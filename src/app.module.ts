import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AlfrescoModule } from './alfresco/alfresco.module';
import { DatabaseModule } from './database/database.module';
import { TareasModule } from './tareas/tareas.module';
import { ConfigModule } from '@nestjs/config';
import { AzureStorageModule } from './azure-storage/azure-storage.module';

@Module({
  imports: [ConfigModule.forRoot({isGlobal:true}), 
    AlfrescoModule, 
    DatabaseModule, 
    TareasModule, 
    //AzureStorageModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
