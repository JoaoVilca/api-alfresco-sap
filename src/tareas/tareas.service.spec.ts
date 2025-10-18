import { Test, TestingModule } from '@nestjs/testing';
import { TareasService } from './tareas.service';

describe('TareasService', () => {
  let service: TareasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TareasService],
    }).compile();

    service = module.get<TareasService>(TareasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
