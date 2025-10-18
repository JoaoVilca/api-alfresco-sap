import { Body, Controller, Get, Post, UploadedFile } from '@nestjs/common';
import { AlfrescoService } from './alfresco.service';
import { ApiBasicAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';

@ApiTags('nodo')
@ApiBasicAuth()
//@UseGuards(BasicAuthGuard)
@Controller('nodo')
export class AlfrescoController {

    constructor(private readonly alfrescoService: AlfrescoService) 
    {}

    @Get()
    async getNodeAlfresco() {
        return this.alfrescoService.fetchAlfrescoData();
    }

    @Post('upload-to-alfresco')
    @ApiOperation({ summary: 'Subir un archivo local a Alfresco' })
    @ApiResponse({
        status: 201,
        description: 'Archivo cargado correctamente a Alfresco',
    })
    @ApiResponse({
        status: 400,
        description: 'Error al cargar el archivo',
    })
    async uploadFile() {
        try {
        const result = await this.alfrescoService.uploadAllFiles();
        return result; // Aquí puedes retornar la respuesta de Alfresco
        } catch (error) {
        console.error('Detalle del error al subir a Alfresco:', error.message);
  throw new Error('No se pudo subir el archivo a Alfresco');
        }
    }
}
