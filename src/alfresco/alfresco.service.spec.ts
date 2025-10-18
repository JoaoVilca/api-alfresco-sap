import { Test, TestingModule } from '@nestjs/testing';
import { AlfrescoService } from './alfresco.service';

describe('AlfrescoService', () => {
  let service: AlfrescoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlfrescoService],
    }).compile();

    service = module.get<AlfrescoService>(AlfrescoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
