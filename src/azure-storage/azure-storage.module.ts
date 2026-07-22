import { Module } from '@nestjs/common';
import { AzureStorageService } from './azure-storage.service';
import { AzureStorageController } from './azure-storage.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArchivosEntity } from './entities/archivos.entity';

@Module({
  providers: [AzureStorageService],
  controllers: [AzureStorageController],
  //imports: [TypeOrmModule.forFeature([ArchivosEntity])],
  //exports: [AzureStorageService],
})
export class AzureStorageModule {}
