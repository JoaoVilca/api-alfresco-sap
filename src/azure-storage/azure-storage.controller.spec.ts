import { Test, TestingModule } from '@nestjs/testing';
import { AzureStorageController } from './azure-storage.controller';

describe('AzureStorageController', () => {
  let controller: AzureStorageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AzureStorageController],
    }).compile();

    controller = module.get<AzureStorageController>(AzureStorageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
