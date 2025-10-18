import { DataSource } from 'typeorm';
import { join } from 'path';

export const AppDataSource = new DataSource({
  type: 'mssql', // o 'postgres', 'mysql', etc.
  host: '192.168.3.72',
  port: 1433,
  username: 'sqldesa',
  password: 'admindesa',
  database: 'IntegracionSAP',
  synchronize: false,
  entities: [join(__dirname, 'src', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'src', 'migrations', '*.{ts,js}')],
  migrationsTableName: 'migrations',
  options: {
    enableArithAbort: true, // opcional, mejora estabilidad en algunas conexiones
  },
  extra: {
    encrypt: true,
    trustServerCertificate: true, // ✅ permite certificados autofirmados
  }
});