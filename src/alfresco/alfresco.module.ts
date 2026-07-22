import { Module } from '@nestjs/common';
import { AlfrescoController } from './alfresco.controller';
import { AlfrescoService } from './alfresco.service';
import { ArchivosEntity } from './entities/archivos.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [AlfrescoController],
  providers: [AlfrescoService],
  imports: [TypeOrmModule.forFeature([ArchivosEntity])],
  exports: [AlfrescoService]
})
export class AlfrescoModule {}
