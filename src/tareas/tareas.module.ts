import { Module } from '@nestjs/common';
import { TareasController } from './tareas.controller';
import { TareasService } from './tareas.service';
import { AlfrescoModule } from 'src/alfresco/alfresco.module';
import { AzureStorageModule } from 'src/azure-storage/azure-storage.module';

@Module({
  controllers: [TareasController],
  providers: [TareasService],
  imports: [
    //AzureStorageModule, 
    AlfrescoModule]
})
export class TareasModule {}
