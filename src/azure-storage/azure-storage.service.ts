import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    BlobServiceClient,
    ContainerClient,
    StorageSharedKeyCredential,
} from '@azure/storage-blob';
import * as fs from 'fs';
import { ClientSecretCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArchivosEntity } from './entities/archivos.entity';
import {
    generarSufijoArchivo,
    moverArchivo,
    formatFilenameSolped,
    formatFilename,
} from 'src/common/utils';
import { DateTime } from 'luxon';

@Injectable()
export class AzureStorageService implements OnModuleInit {

    // ─── Azure config ────────────────────────────────────────────────────────────
    private storageAccountName: string;
    private containerNameFI: string;
    private containerNameSOLPED: string;
    private containerNamePEDIDOS: string;
    private containerNameCONTRATOS: string;
    private containerNameHES: string;
    private blobServiceClient: BlobServiceClient;
    private containerClient: ContainerClient;
    private client: SecretClient;
    private accountKey: string;
    private tenantId: string;
    private clientId: string;
    private clientSecret: string;
    private keyVaultName: string;

    // ─── Local path config (same as AlfrescoService) ─────────────────────────────
    private localFilePathFI: string;
    private localFileErrorFI: string;
    private localFilePathMM: string;
    private localFileErrorMM: string;

    // ─── PDF URL ──────────────────────────────────────────────────────────────────
    private urlPDF: string;

    constructor(
        private configService: ConfigService,
        @InjectRepository(ArchivosEntity)
        private nodeRepository: Repository<ArchivosEntity>,
    ) {
        // Azure
        this.storageAccountName = this.configService.get<string>('STORAGE_ACCOUNT_NAME')!;
        this.containerNameFI = this.configService.get<string>('CONTAINER_NAME_FI')!;
        this.containerNameSOLPED = this.configService.get<string>('CONTAINER_NAME_SOLPED')!;
        this.containerNamePEDIDOS = this.configService.get<string>('CONTAINER_NAME_PEDIDOS')!;
        this.containerNameCONTRATOS = this.configService.get<string>('CONTAINER_NAME_CONTRATOS')!;
        this.containerNameHES = this.configService.get<string>('CONTAINER_NAME_HES')!;
        this.tenantId = this.configService.get<string>('AZURE_TENANT_ID')!;
        this.clientId = this.configService.get<string>('AZURE_CLIENT_ID')!;
        this.clientSecret = this.configService.get<string>('AZURE_CLIENT_SECRET')!;
        this.keyVaultName = this.configService.get<string>('KEY_VAULT_NAME')!;

        // Local paths (FI)
        this.localFilePathFI = this.configService.get<string>('BLOBSTORAGE_LOCAL_PATH_FI')!;
        this.localFileErrorFI = this.configService.get<string>('BLOBSTORAGE_LOCAL_ERROR_FI')!;

        // Local paths (MM)
        this.localFilePathMM = this.configService.get<string>('BLOBSTORAGE_LOCAL_PATH_MM')!;
        this.localFileErrorMM = this.configService.get<string>('BLOBSTORAGE_LOCAL_ERROR_MM')!;

        this.urlPDF = this.configService.get<string>('GET_FILE_BLOB')!;
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────────

    async onModuleInit() {
        const credential = new ClientSecretCredential(
            this.tenantId,
            this.clientId,
            this.clientSecret,
        );

        const vaultUrl = `https://${this.keyVaultName}.vault.azure.net`;
        this.client = new SecretClient(vaultUrl, credential);

        const secret = await this.client.getSecret('storage-account-key');
        if (!secret.value) {
            throw new Error('No se pudo obtener la key desde Key Vault');
        }

        this.accountKey = secret.value;
        console.log('Key obtenida desde Key Vault');

        const sharedKeyCredential = new StorageSharedKeyCredential(
            this.storageAccountName,
            this.accountKey,
        );

        this.blobServiceClient = new BlobServiceClient(
            `https://${this.storageAccountName}.blob.core.windows.net`,
            sharedKeyCredential,
        );


    }

    // ─── Single-file upload (HTTP endpoint, streaming from buffer) ────────────────

    /**
     * Carga un archivo recibido por HTTP (Express.Multer.File) a Azure Blob Storage.
     * Equivalente al endpoint puntual; no toca la BD ni las carpetas locales.
     */
    async uploadFileToBlobStorage(file: Express.Multer.File, containerName?: string) {
        try {
            switch (containerName) {
                case 'SOLPED':
                    this.containerClient = this.blobServiceClient.getContainerClient(this.containerNameSOLPED);
                    break;
                case 'PEDIDOS':
                    this.containerClient = this.blobServiceClient.getContainerClient(this.containerNamePEDIDOS);
                    break;
                case 'CONTRATOS':
                    this.containerClient = this.blobServiceClient.getContainerClient(this.containerNameCONTRATOS);
                    break;
                case 'HES':
                    this.containerClient = this.blobServiceClient.getContainerClient(this.containerNameHES);
                    break;
                case 'FI':
                    this.containerClient = this.blobServiceClient.getContainerClient(this.containerNameFI);
                    break;
            }

            const blobName = `${Date.now()}-${file.originalname}`;
            const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

            const uploadBlobResponse = await blockBlobClient.uploadData(file.buffer, {
                blobHTTPHeaders: { blobContentType: file.mimetype },
            });

            console.log(`Archivo "${blobName}" subido con éxito. ID: ${uploadBlobResponse.requestId}`);

            return {
                url: blockBlobClient.url,
                requestId: uploadBlobResponse.requestId,
                filename: blobName,
            };
        } catch (error) {
            console.error('Error en Azure Storage:', error.message);
            throw new Error('Error al procesar la carga en la nube');
        }
    }

    // ─── Bulk upload (equivalente a uploadAllFiles de Alfresco) ──────────────────

    /**
     * Recorre las mismas carpetas locales que AlfrescoService y sube cada archivo
     * válido a Azure Blob Storage, guardando el registro en la BD local.
     * Es invocado por el endpoint POST upload-to-azure (o el scheduler).
     */
    async uploadAllFiles() {
        const filesFI = fs.readdirSync(this.localFilePathFI);
        const filesMMSolped = fs.readdirSync(`${this.localFilePathMM}SOLPED\\`);
        const filesMMPedidos = fs.readdirSync(`${this.localFilePathMM}PEDIDOS\\`);
        const filesMMContratos = fs.readdirSync(`${this.localFilePathMM}CONTRATOS\\`);
        const filesMMHes = fs.readdirSync(`${this.localFilePathMM}HES\\`);

        // ── FI ──────────────────────────────────────────────────────────────────
        for (const file of filesFI) {
            const stringRandom = generarSufijoArchivo();

            if (file.toLowerCase().endsWith('.pdf') && file.length === 18) {
                await this.uploadLocalFileToBlob(file, 'FI', 'DOCFI');
            } else {
                moverArchivo(
                    file,
                    this.localFilePathFI,
                    this.localFileErrorFI,
                    'Archivo movido a la carpeta ERRORFILE\\DOCUMENTOSFI:',
                );
                console.error(`Archivo inválido (FI): "${file}"`);
            }
        }

        // ── SOLPED ──────────────────────────────────────────────────────────────
        for (const file of filesMMSolped) {
            const stringRandom = generarSufijoArchivo();
            const result = formatFilename(file);

            if (
                this.isValidExtension(result.extension) &&
                result.numeroDoc?.length === 10 &&
                result.nombreArchivo?.length! <= 30
            ) {
                await this.uploadLocalFileToBlob(file, 'SOLPED','SOLPED');
            } else {
                moverArchivo(
                    file,
                    `${this.localFilePathMM}SOLPED\\`,
                    `${this.localFileErrorMM}SOLPED\\`,
                    'Archivo movido a la carpeta ERRORFILE\\DOCUMENTOSMM\\SOLPED:',
                );
                console.error(`Archivo inválido (SOLPED): "${file}"`);
            }
        }

        // ── PEDIDOS ─────────────────────────────────────────────────────────────
        for (const file of filesMMPedidos) {
            const stringRandom = generarSufijoArchivo();
            const result = formatFilename(file);

            if (
                this.isValidExtension(result.extension) &&
                result.numeroDoc?.length === 10 &&
                result.nombreArchivo!.length! <= 30
            ) {
                await this.uploadLocalFileToBlob(file, 'PEDIDOS','OC');
            } else {
                moverArchivo(
                    file,
                    `${this.localFilePathMM}PEDIDOS\\`,
                    `${this.localFileErrorMM}PEDIDOS\\`,
                    'Archivo movido a la carpeta ERRORFILE\\DOCUMENTOSMM\\PEDIDOS:',
                );
                console.error(`Archivo inválido (PEDIDOS): "${file}"`);
            }
        }

        // ── CONTRATOS ───────────────────────────────────────────────────────────
        for (const file of filesMMContratos) {
            const stringRandom = generarSufijoArchivo();
            const result = formatFilename(file);

            if (
                this.isValidExtension(result.extension) &&
                result.numeroDoc?.length === 10 &&
                result.nombreArchivo?.length! <= 30
            ) {
                await this.uploadLocalFileToBlob(file,'CONTRATOS','CONTR');
            } else {
                moverArchivo(
                    file,
                    `${this.localFilePathMM}CONTRATOS\\`,
                    `${this.localFileErrorMM}CONTRATOS\\`,
                    'Archivo movido a la carpeta ERRORFILE\\DOCUMENTOSMM\\CONTRATOS:',
                );
                console.error(`Archivo inválido (CONTRATOS): "${file}"`);
            }
        }

        // ── HES ─────────────────────────────────────────────────────────────────
        for (const file of filesMMHes) {
            const stringRandom = generarSufijoArchivo();
            const result = formatFilename(file);

            if (
                this.isValidExtension(result.extension) &&
                result.numeroDoc?.length === 10 &&
                result.nombreArchivo?.length! <= 30
            ) {
                await this.uploadLocalFileToBlob(file,'HES','HES');
            } else {
                moverArchivo(
                    file,
                    `${this.localFilePathMM}HES\\`,
                    `${this.localFileErrorMM}HES\\`,
                    'Archivo movido a la carpeta ERRORFILE\\DOCUMENTOSMM\\HES:',
                );
                console.error(`Archivo inválido (HES): "${file}"`);
            }
        }
    }

    // ─── Core upload: local file → Azure Blob ─────────────────────────────────────

    /**
     * Lee el archivo desde disco, construye el nombre del blob con el mismo criterio
     * que AlfrescoService, lo sube a Azure y persiste el registro en la BD.
     *
     * @param filePath  nombre del archivo (sin ruta)
     * @param stringRandom sufijo aleatorio de 4 chars
     * @param folder    carpeta lógica: 'FI' | 'SOLPED' | 'PEDIDOS' | 'CONTRATOS' | 'HES'
     * @param tipoDoc   tipo de documento para la BD
     */
    async uploadLocalFileToBlob(
        filePath: string,
        folder: string,
        tipoDoc: string,
    ) {
        let localFilePath = '';
        let blobFolder = '';   // prefijo virtual dentro del container

        // Construir ruta local y prefijo de blob igual que Alfresco
        switch (folder.toUpperCase()) {
            case 'FI':
                this.containerClient = this.blobServiceClient.getContainerClient(this.containerNameFI);
                localFilePath = this.localFilePathFI + filePath;
                blobFolder = 'FI';
                break;
            case 'SOLPED':
                this.containerClient = this.blobServiceClient.getContainerClient(this.containerNameSOLPED);
                localFilePath = `${this.localFilePathMM}SOLPED\\${filePath}`;
                blobFolder = 'MM/SOLPED';
                break;
            case 'PEDIDOS':
                this.containerClient = this.blobServiceClient.getContainerClient(this.containerNamePEDIDOS);
                localFilePath = `${this.localFilePathMM}PEDIDOS\\${filePath}`;
                blobFolder = 'MM/PEDIDOS';
                break;
            case 'CONTRATOS':
                this.containerClient = this.blobServiceClient.getContainerClient(this.containerNameCONTRATOS);
                localFilePath = `${this.localFilePathMM}CONTRATOS\\${filePath}`;
                blobFolder = 'MM/CONTRATOS';
                break;
            case 'HES':
                this.containerClient = this.blobServiceClient.getContainerClient(this.containerNameHES);
                localFilePath = `${this.localFilePathMM}HES\\${filePath}`;
                blobFolder = 'MM/HES';
                break;
        }

        // Construir nombre del blob con la misma lógica de AlfrescoService
        console.log('filePath: ' + filePath);
        console.log('localFilePath: ' + localFilePath);
        const result = formatFilename(filePath);
        let blobName = '';
        const fecha = new Date().toISOString().slice(0, 10)

        if (folder == 'FI') {
            blobName = filePath.slice(0, 14) + filePath.slice(-4)
        }
        else {
            blobName = `${result.numeroDoc}-${fecha}-${result.nombreArchivo}${result.extension}`;
        }

        // Ruta virtual en el container: "FI/blobName"
        //const fullBlobPath = `${blobFolder}/${blobName}`; esto ubica el blob dentro de la ruta de carpeta en el contenedor sino existe la crea
        const fullBlobPath = `${blobName}`;

        console.log('blobPath: ' + fullBlobPath);

        try {
            const fileBuffer = fs.readFileSync(localFilePath);
            const mimeType = this.getMimeType(filePath);

            const blockBlobClient = this.containerClient.getBlockBlobClient(fullBlobPath);

            const uploadResponse = await blockBlobClient.uploadData(fileBuffer, {
                blobHTTPHeaders: { blobContentType: mimeType },
            });

            console.log(`Blob "${fullBlobPath}" subido. ID: ${uploadResponse.requestId}`);

            // Guardar en BD con la misma estructura que AlfrescoService
            await this.saveBlobToDatabase(
                {
                    id: blockBlobClient.url,   // URL completa como identificador
                    name: blobName,
                    url: `${this.urlPDF}${folder.toUpperCase()}/${encodeURIComponent(fullBlobPath)}`, // URL para acceder al blob vía nuestro endpoint
                },
                filePath,
                folder,
                tipoDoc,
            );

            // Eliminar el archivo local después de subirlo
            fs.unlinkSync(localFilePath);
            console.log(`Archivo local "${localFilePath}" eliminado tras subir a Azure.`);
        } catch (error) {
            console.error(`Error al subir "${filePath}" a Azure:`, error.message ?? error);
        }
    }

    // ─── Persist to DB ────────────────────────────────────────────────────────────

    /**
     * Guarda el registro del blob en la tabla sap_int_digita_doc,
     * con la misma estructura que saveNodeToDatabase de AlfrescoService.
     */
    async saveBlobToDatabase(
        blobEntry: { id: string; name: string; url: string },
        file: string,
        folder: string,
        tipoDoc: string,
    ) {
        const result = formatFilenameSolped(blobEntry.name);
        console.log('result',result);

        let posicionAnio = '';
        let dDocumento = '';

        const fecha = new Date().toISOString().slice(0, 10)

        if (folder === 'FI') {
            posicionAnio = blobEntry.name.slice(10, 14);
            dDocumento =
                blobEntry.name.slice(0, 10) + '-' +
                blobEntry.name.slice(10, 14) +
                blobEntry.name.slice(14, 19);
        } else if (folder === 'SOLPED') {
            posicionAnio = '0000';
            dDocumento = `${result.numeroDoc}-${fecha}-${result.nombre}`;
        } else {
            posicionAnio = '0000';
            dDocumento = `${result.numeroDoc}-${fecha}-${result.nombre}`;
        }

        const fechaCompleta = DateTime.now()
            .setZone('America/Lima')
            .toFormat('yyyy-MM-dd HH:mm:ss.SSS');

        const mapped = this.nodeRepository.create({
            Sociedad: 'PE10',
            CAnio: posicionAnio,
            Ndocumento: blobEntry.name.slice(0, 10),
            Ddocumento: blobEntry.name.slice(0, -4),
            IDAlfresco: blobEntry.name,        // se reutiliza la columna para guardar la URL del blob
            DUrl: blobEntry.url,
            Clase_Doc: '',
            Referencia: '',
            Estado_env: 'PE',
            codigo_sap: '',
            texto_sap: '',
            anio_sap: '',
            Usuario: 'Digitaliza',
            fec_creacion: fechaCompleta,
            tdocumento: tipoDoc,
        });

        await this.nodeRepository.save(mapped);
    }

    // ─── Streaming download (existing functionality kept intact) ─────────────────

    async getFileStream(blobName: string, containerName?: string) {

        switch (containerName?.toUpperCase()) {
            case 'SOLPED':
                this.containerClient = this.blobServiceClient.getContainerClient(this.containerNameSOLPED);
                break;
            case 'PEDIDOS':
                this.containerClient = this.blobServiceClient.getContainerClient(this.containerNamePEDIDOS);
                break;
            case 'CONTRATOS':
                this.containerClient = this.blobServiceClient.getContainerClient(this.containerNameCONTRATOS);
                break;
            case 'HES':
                this.containerClient = this.blobServiceClient.getContainerClient(this.containerNameHES);
                break;
            case 'FI':
            default:
                this.containerClient = this.blobServiceClient.getContainerClient(this.containerNameFI);
        }

        //this.containerClient = this.blobServiceClient.getContainerClient(this.containerNameFI);
        const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
        try {
            const exists = await blockBlobClient.exists();

            if (!exists) throw new Error('Archivo no encontrado');

            const downloadResponse = await blockBlobClient.download();

            return {
                // Forzamos a reconocer que en Node.js esto es un ReadableStream
                readableStream: downloadResponse.readableStreamBody as NodeJS.ReadableStream,
                contentType: downloadResponse.contentType,
                contentLength: downloadResponse.contentLength
            };
        }
        catch (error) {
            console.error('Error al obtener el archivo:', error.message);
            throw new Error('No se pudo obtener el archivo del almacenamiento');
        }
    }


    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private isValidExtension(ext: string | undefined): boolean {
        return ['.pdf', '.docx', '.xlsx'].includes(ext ?? '');
    }

    private getMimeType(filename: string): string {
        const ext = filename.split('.').pop()?.toLowerCase();
        const mimeMap: Record<string, string> = {
            pdf: 'application/pdf',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
        return mimeMap[ext ?? ''] ?? 'application/octet-stream';
    }
}