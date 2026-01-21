import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.CENSUS_SERVICE_HOST || '127.0.0.1',
        port: parseInt(process.env.CENSUS_SERVICE_PORT || '3002'),
      },
    },
  );

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  await app.listen();
  console.log(`Census Service is running on TCP port ${process.env.CENSUS_SERVICE_PORT || 3002}`);
}
bootstrap();
