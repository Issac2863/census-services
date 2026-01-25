import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * Bootstrap del microservicio de censo electoral.
 * Configura validaciones globales y conexión TCP para gestión del padrón electoral.
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('CensusServiceBootstrap');
  
  try {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
      AppModule,
      {
        transport: Transport.TCP,
        options: {
          host: process.env.CENSUS_SERVICE_HOST || '127.0.0.1',
          port: parseInt(process.env.CENSUS_SERVICE_PORT || '3006'),
        },
      },
    );

    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }));

    await app.listen();
    logger.log(`Census Service iniciado en puerto ${process.env.CENSUS_SERVICE_PORT || 3006}`);
  } catch (error) {
    logger.error('Error iniciando Census Service:', error);
    process.exit(1);
  }
}

bootstrap();
