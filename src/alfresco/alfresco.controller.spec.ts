import { Test, TestingModule } from '@nestjs/testing';
import { AlfrescoController } from './alfresco.controller';

describe('AlfrescoController', () => {
  let controller: AlfrescoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlfrescoController],
    }).compile();

    controller = module.get<AlfrescoController>(AlfrescoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
