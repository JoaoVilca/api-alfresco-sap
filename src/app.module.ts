import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AlfrescoModule } from './alfresco/alfresco.module';
import { DatabaseModule } from './database/database.module';
import { TareasModule } from './tareas/tareas.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({isGlobal:true}), AlfrescoModule, DatabaseModule, TareasModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
