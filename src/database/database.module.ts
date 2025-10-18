import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mssql',
        host: config.get('DB_HOST'),
        port: parseInt(config.get('DB_PORT')!),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        synchronize: false, //'true' solo en desarrollo
        autoLoadEntities: true,
        options: {
          encrypt: true,
          trustServerCertificate: true,
          enableArithAbort: true,
        },
        requestTimeout: 600000, // 10 min
            //cancelTimeout: 60000,   // 1 min
            pool: {
                max: 20,
                min: 0,
                idleTimeoutMillis: 60000,
            },
      }),
    }),
  ],
})
export class DatabaseModule {}