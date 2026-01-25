import { Module } from '@nestjs/common';
import { CensusController } from './census.controller';
import { CensusService } from './census.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { EnvelopeOpenerInterceptor } from './interceptors/envelopeOpener.interceptor';
import { KeyVaultService } from './security/keyVault.service';
import { CandidatosService } from './candidatosRepository.service';
import { CertificateProxy } from './proxies/certificate.proxy';
import { EnvelopePackerService } from './security/envelopePacker.service';

/**
 * Módulo principal del servicio de censo electoral.
 * Gestiona el padrón electoral, estados de votación y comunicación con el servicio de certificados.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  providers: [
    CensusService,
    KeyVaultService,
    {
      provide: APP_INTERCEPTOR,
      useClass: EnvelopeOpenerInterceptor,
    },
    CandidatosService,
    CertificateProxy,
    EnvelopePackerService
  ],
})
export class AppModule {}
