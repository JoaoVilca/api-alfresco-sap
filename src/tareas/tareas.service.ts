import { Injectable, OnModuleInit } from '@nestjs/common';
import { CronJob } from 'cron';
import { DateTime } from 'luxon';
import { AlfrescoService } from 'src/alfresco/alfresco.service';
//import { AzureStorageService } from 'src/azure-storage/azure-storage.service';

@Injectable()
export class TareasService implements OnModuleInit {
  constructor(
    //private readonly azureStorageService: AzureStorageService,
    private readonly alfrescoServices: AlfrescoService
  ) { }

  onModuleInit() {
    const job = new CronJob(
      '*/2 * * * *', // → Cada 2 minutos
      () => {
        //this.alfrescoService.uploadAllFiles();
        const fecha = new Date().toISOString().slice(0, 10)
        const hora = DateTime.now().setZone('America/Lima').toFormat('HH:mm:ss.SSS')
        //const fechaCompleta = new Date()

        const fechaCompleta = DateTime.now().setZone('America/Lima').toFormat('yyyy-MM-dd HH:mm:ss.SSS')

        console.log(`Tarea realizada a las ${hora}`)
        //console.log(fecha + ' ' + hora)
        //console.log(fechaCompleta)

        //this.azureStorageService.uploadAllFiles();
        this.alfrescoServices.uploadAllFiles();
      },
      null,            // onComplete
      true,            // start
      'America/Lima'   // timeZone
    );

    //console.log('CronJob iniciado correctamente');
  }
}
