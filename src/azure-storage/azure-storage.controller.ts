import { BadRequestException, Controller, Get, NotFoundException, Param, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBasicAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AzureStorageService } from './azure-storage.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@ApiTags('azure-storage')
@ApiBasicAuth()
//@UseGuards(BasicAuthGuard)
@Controller('azure-storage')
export class AzureStorageController {
    constructor(private readonly azureStorageService: AzureStorageService) { }

    @Post('upload-to-blob-storage')
    @UseInterceptors(FileInterceptor('file')) // 'file' es el nombre de la key en el form-data
    @ApiOperation({ summary: 'Subir un archivo a Blob Storage' })
    @ApiConsumes('multipart/form-data') // Necesario para que Swagger muestre el botón de subir archivo
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'Archivo cargado correctamente' })
    @ApiResponse({ status: 400, description: 'Error al cargar el archivo' })
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No se ha seleccionado ningún archivo');
        }

        try {
            // En lugar de una ruta local fija, pasamos el Buffer o el objeto file completo
            const result = await this.azureStorageService.uploadFileToBlobStorage(file);
            return result;
        } catch (error) {
            console.error('Detalle del error:', error.message);
            throw new BadRequestException('No se pudo subir el archivo al almacenamiento');
        }
    }

    @Get('view/:container/:filename')
    async serveFile(@Param('container') container: string, @Param('filename') filename: string, @Res() res: Response) {
        try {
            const fileData = await this.azureStorageService.getFileStream(filename,container);

            if (!fileData.readableStream) {
                return res.status(404).send('Stream no disponible');
            }

            // 1. Establecer el tipo de contenido (Ej: image/jpeg, application/pdf)
            res.attachment(filename); // Esto ayuda a definir el nombre predeterminado
            res.setHeader('Content-Type', fileData.contentType || 'application/octet-stream');

            // 2. IMPORTANTE: Cambiar 'attachment' por 'inline' para ver en el navegador
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

            // 3. Enviar el flujo
            fileData.readableStream.pipe(res);

        } catch (error) {
            res.status(404).json({ message: 'Error al obtener el archivo' });
        }
    }
}
