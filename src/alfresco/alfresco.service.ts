import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as FormData from 'form-data';
import path from 'path';
import { ArchivosEntity } from './entities/archivos.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { generarSufijoArchivo, moverArchivo } from 'src/common/utils';
import { DateTime } from 'luxon';

@Injectable()
export class AlfrescoService {

    private urlAlfresco: string;
    private urlAlfrescoGet: string;
    private username: string;
    private password: string;
    private localFilePathFI: string;
    private localFileBackupFI: string;
    private localFileErrorFI: string;
    private localFilePathMM: string;
    private localFileBackupMM: string;
    private localFileErrorMM: string;
    private nodo_SOLPED: string;
    private nodo_PEDIDOS: string;
    private nodo_CONTRATOS: string;
    private nodo_HES: string;
    private nodo_FI: string;
    private urlPDF: string;

    constructor(
        private configService: ConfigService,
        @InjectRepository(ArchivosEntity)
        private nodeRepository: Repository<ArchivosEntity>,
    ) {
        this.urlAlfresco = this.configService.get<string>('ALFRESCO_URL_POST_NODO')!;
        this.urlAlfrescoGet = this.configService.get<string>('ALFRESCO_URL_GET_NODO')!;
        this.username = this.configService.get<string>('ALFRESCO_USER')!;
        this.password = this.configService.get<string>('ALFRESCO_PASS')!;

        this.localFilePathFI = this.configService.get<string>('ALFRESCO_LOCAL_PATH_FI')!;
        this.localFileBackupFI = this.configService.get<string>('ALFRESCO_LOCAL_BACKUP_FI')!;
        this.localFileErrorFI = this.configService.get<string>('ALFRESCO_LOCAL_ERROR_FI')!;

        this.localFilePathMM = this.configService.get<string>('ALFRESCO_LOCAL_PATH_MM')!;
        this.localFileBackupMM = this.configService.get<string>('ALFRESCO_LOCAL_BACKUP_MM')!;
        this.localFileErrorMM = this.configService.get<string>('ALFRESCO_LOCAL_ERROR_MM')!;

        this.nodo_SOLPED = this.configService.get<string>('ALFRESCO_NODO_SOLPED')!;
        this.nodo_PEDIDOS = this.configService.get<string>('ALFRESCO_NODO_PEDIDOS')!;
        this.nodo_CONTRATOS = this.configService.get<string>('ALFRESCO_NODO_CONTRATOS')!;
        this.nodo_HES = this.configService.get<string>('ALFRESCO_NODO_HES')!;
        this.nodo_FI = this.configService.get<string>('ALFRESCO_NODO_FI')!;

        this.urlPDF = this.configService.get<string>('API_URL_PDF')!;
    }

    /**
     * Este endpoint debe ser dinamico y debe armarse dependiendo del nombre del archivo seleccionado por el servicio de tareas automatico
     * temporalmente se pone textual el nodo
     * @returns retorna los datos del nodo en Alfresco
     */
    async fetchAlfrescoData(): Promise<any[]> {

        const endpoint = 'children?include=path'

        const url = this.urlAlfrescoGet! + endpoint;
        const username = this.username!;
        const password = this.password!;

        const response = await axios.get(url, {
            auth: { username, password },
            //headers: { Accept: 'application/json' },
        });
        return response.data;
    }

    /**
     * Metodo para cargar archivo local a Alfresco usando su endpoint para crear nodo
     * @param filePath ruta de archivo PDF
     * @param stringRandom cadena de 4 caracteres alfanumericos random para complementar el nombre del archivo en Alfresco y no se repita en caso el usuario suba otro
     * otro archivo diferente para el mismo documento sap
     */
    async uploadFileToAlfresco(filePath: string, stringRandom: string, folder: string, tipoDoc:string) {

        const uploadFolderFI = this.localFilePathFI!
        const uploadFolderMM = this.localFilePathMM!

        const endpoint = '/children?include=path'

        let url = ''
        const username = this.username!;
        const password = this.password!;
        let localFilePath = ''

        switch (folder) {
            case 'FI':
                url = this.urlAlfresco! + this.nodo_FI + endpoint;
                localFilePath = uploadFolderFI + filePath
                break;
            case 'SOLPED':
                url = this.urlAlfresco! + this.nodo_SOLPED + endpoint;
                localFilePath = uploadFolderMM + folder + '\\' + filePath
                break;
            case 'PEDIDOS':
                url = this.urlAlfresco! + this.nodo_PEDIDOS + endpoint;
                localFilePath = uploadFolderMM + folder + '\\' + filePath
                break;
            case 'CONTRATOS':
                url = this.urlAlfresco! + this.nodo_CONTRATOS + endpoint;
                localFilePath = uploadFolderMM + folder + '\\' + filePath
                break;
            case 'HES':
                url = this.urlAlfresco! + this.nodo_HES + endpoint;
                localFilePath = uploadFolderMM + folder + '\\' + filePath
                break;
        }

        try {
            const form = new FormData()

            form.append('filedata', fs.createReadStream(localFilePath))
            form.append('name', filePath.slice(0, 14) + stringRandom + filePath.slice(-4))
            form.append('nodeType', 'cm:content')

            const response = await axios.post(url, form, {
                auth: { username, password },
                headers: { Accept: 'multipart/form-data' },
            });

            await this.saveNodeToDatabase(response.data.entry,folder,tipoDoc)
            //return response.data.entry.id
        }
        catch (error) {
            console.log(error)
        }
    }

    /**
     * metodo principal que llama al metodo que hace la carga de archivos a alfresco
     * no recibe parametros
     * es utilizado por el endpoint de tipo POST de la API upload-to-alfresco
     */
    async uploadAllFiles() {

        const filesFI = fs.readdirSync(this.localFilePathFI);
        const filesMMSolped = fs.readdirSync(this.localFilePathMM!+'SOLPED'+'\\');
        const filesMMPedidos = fs.readdirSync(this.localFilePathMM!+'PEDIDOS'+'\\');
        const filesMMContratos = fs.readdirSync(this.localFilePathMM!+'CONTRATOS'+'\\');
        const filesMMHes = fs.readdirSync(this.localFilePathMM!+'HES'+'\\');

        for (const file of filesFI) {
            let stringRandom = generarSufijoArchivo()

            if (file.toLowerCase().endsWith('.pdf') && file.length == 18) {
                await this.uploadFileToAlfresco(file, stringRandom, 'FI', 'DOCFI'); // espera a que suba antes de continuar
            }
            else {
                //this.moverArchivoError(file)
                moverArchivo(file, this.localFilePathFI, this.localFileErrorFI, 'Archivo movido a la carpeta ERRORFILE\DOCUMENTOSFI:')
                console.error(`El archivo no esta en formato PDF o no tiene el formato de titulo correcto: "${file}"`);
            }
        }
        for (const file of filesMMSolped) {
            let stringRandom = generarSufijoArchivo()

            if (file.toLowerCase().endsWith('.pdf') && file.length == 18) {
                await this.uploadFileToAlfresco(file, stringRandom,'SOLPED','SOLPED'); // espera a que suba antes de continuar
            }
            else {
                //this.moverArchivoError(file)
                moverArchivo(file, this.localFilePathMM+'SOLPED\\', this.localFileErrorMM+'SOLPED\\', 'Archivo movido a la carpeta ERRORFILE\DOCUMENTOSMM\SOLPED:')
                console.error(`El archivo no esta en formato PDF o no tiene el formato de titulo correcto: "${file}"`);
            }
        }
        for (const file of filesMMPedidos) {
            let stringRandom = generarSufijoArchivo()

            if (file.toLowerCase().endsWith('.pdf') && file.length == 14) {
                await this.uploadFileToAlfresco(file, stringRandom,'PEDIDOS','OC'); // espera a que suba antes de continuar
            }
            else {
                //this.moverArchivoError(file)
                moverArchivo(file, `${this.localFilePathMM}PEDIDOS\\`, `${this.localFileErrorMM}PEDIDOS\\`, 'Archivo movido a la carpeta ERRORFILE\DOCUMENTOSMM\PEDIDOS:')
                console.error(`El archivo no esta en formato PDF o no tiene el formato de titulo correcto: "${file}"`);
            }
        }
        for (const file of filesMMContratos) {
            let stringRandom = generarSufijoArchivo()

            if (file.toLowerCase().endsWith('.pdf') && file.length == 14) {
                await this.uploadFileToAlfresco(file, stringRandom,'CONTRATOS','CONTR'); // espera a que suba antes de continuar
            }
            else {
                //this.moverArchivoError(file)
                moverArchivo(file, this.localFilePathMM +'CONTRATOS\\', this.localFileErrorMM +'CONTRATOS\\', 'Archivo movido a la carpeta ERRORFILE\DOCUMENTOSMM\CONTRATOS:')
                console.error(`El archivo no esta en formato PDF o no tiene el formato de titulo correcto: "${file}"`);
            }
        }
        for (const file of filesMMHes) {
            let stringRandom = generarSufijoArchivo()

            if (file.toLowerCase().endsWith('.pdf') && file.length == 14) {
                await this.uploadFileToAlfresco(file, stringRandom,'HES','HES'); // espera a que suba antes de continuar
            }
            else {
                //this.moverArchivoError(file)
                moverArchivo(file, this.localFilePathMM +'HES\\', this.localFileErrorMM +'HES\\', 'Archivo movido a la carpeta ERRORFILE\DOCUMENTOSMM\HES:')
                console.error(`El archivo no esta en formato PDF o no tiene el formato de titulo correcto: "${file}"`);
            }
        }
    }

    /**
     * Metodo para guardar el archivo cargado a alfresco, en la base de datos sql en la tabla sap_int_digita_doc
     * @param id_node luego de creado el nodo en alfresco y subir el archivo el endpoint de alfresco devuelve el id del archivo, aqui se manda el objeto devuelto por alfresco
     */
    async saveNodeToDatabase(id_node, folder:string, tipoDoc: string) {

        const tdocumento = ''

        const date = new Date().toISOString().slice(0, 10);

        const fechaCompleta = DateTime.now().setZone('America/Lima').toFormat('yyyy-MM-dd HH:mm:ss.SSS')

        const mapped = this.nodeRepository.create({
            Sociedad: 'PE10',
            CAnio: id_node.name.slice(10, 14),
            Ndocumento: id_node.name.slice(0, 10),
            Ddocumento: 'Doc-' + id_node.name.slice(0, 10) + "-" + id_node.name.slice(10, 14) + "-" + id_node.name.slice(14, 18),
            IDAlfresco: id_node.id,
            DUrl: this.urlPDF + id_node.id,
            Clase_Doc: '',
            Referencia: '',
            Estado_env: 'PE',
            codigo_sap: '',
            texto_sap: '',
            anio_sap: '',
            Usuario: 'Digitaliza',
            fec_creacion: fechaCompleta,
            tdocumento: tipoDoc
        });

        await this.nodeRepository.save(mapped);

        //this.moverArchivoBackup(id_node.name.slice(0, 14) + id_node.name.slice(-4))
        switch (folder) {
            case 'FI':
                moverArchivo(id_node.name.slice(0, 14) + id_node.name.slice(-4), this.localFilePathFI, this.localFileBackupFI, 'Archivo movido a la carpeta BACKUP_GENERAL/DOCUMENTOSFI:')
                break;
            case 'SOLPED':
                moverArchivo(id_node.name.slice(0, 14) + id_node.name.slice(-4), this.localFilePathMM!+folder + '\\', this.localFileBackupMM+folder + '\\', 'Archivo movido a la carpeta BACKUP_GENERAL/SOLPED:')
                break;
            case 'PEDIDOS':
                moverArchivo(id_node.name.slice(0, 14) + id_node.name.slice(-4), this.localFilePathMM!+folder + '\\', this.localFileBackupMM+folder + '\\', 'Archivo movido a la carpeta BACKUP_GENERAL/PEDIDOS:')
                break;
            case 'CONTRATOS':
                moverArchivo(id_node.name.slice(0, 14) + id_node.name.slice(-4), this.localFilePathMM!+folder + '\\', this.localFileBackupMM+folder + '\\', 'Archivo movido a la carpeta CONTRATOS:')
                break;
            case 'HES':
                moverArchivo(id_node.name.slice(0, 14) + id_node.name.slice(-4), this.localFilePathMM!+folder + '\\', this.localFileBackupMM+folder + '\\', 'Archivo movido a la carpeta BACKUP_GENERAL/HES:')
                break;
        }
        
    }

}