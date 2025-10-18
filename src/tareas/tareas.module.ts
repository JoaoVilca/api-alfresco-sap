import { Module } from '@nestjs/common';
import { TareasController } from './tareas.controller';
import { TareasService } from './tareas.service';
import { AlfrescoModule } from 'src/alfresco/alfresco.module';

@Module({
  controllers: [TareasController],
  providers: [TareasService],
  imports: [AlfrescoModule]
})
export class TareasModule {}
