import { Body, Controller, Get, Param, Post, Query, Res, UploadedFile } from '@nestjs/common';
import { AlfrescoService } from './alfresco.service';
import { ApiBasicAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { Response } from 'express';

@ApiTags('nodo')
@ApiBasicAuth()
//@UseGuards(BasicAuthGuard)
@Controller('nodo')
export class AlfrescoController {

    constructor(private readonly alfrescoService: AlfrescoService) { }

    @Get()
    async getNodeAlfresco(@Query('nodo') nodo: string,) {
        return this.alfrescoService.getAlfrescoFile(nodo);
    }

    @Get('documentos/:nodeId')
    async visualizarDocumento(
        @Param('nodeId') nodeId: string,
        @Res() res: Response,
    ) {
        const file = await this.alfrescoService.getAlfrescoFile(nodeId);

        res.set({
            'Content-Type': file.contentType,
            'Content-Disposition': 'inline',
        });

        res.send(file.data);
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
