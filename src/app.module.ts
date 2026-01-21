import { Module } from '@nestjs/common';
import { CensusController } from './census.controller';
import { CensusService } from './census.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    // Carga las variables de entorno y las hace globales
    ConfigModule.forRoot({ isGlobal: true }),
    // Configura el cliente TCP para el Certificate Service
    ClientsModule.registerAsync([
      {
        name: 'CERTIFICATE_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('CERTIFICATE_HOST'),
            port: configService.get('CERTIFICATE_PORT'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [CensusController],
  providers: [CensusService],
})
export class AppModule { }
