import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Guard para validar la API Key interna en comunicaciones entre microservicios.
 * 
 * @description Verifica que las peticiones contengan la API Key correcta en el header 'x-api-key'.
 * Este guard protege endpoints internos accesibles solo por microservicios autorizados.
 */
@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(InternalApiKeyGuard.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Valida si la petición tiene una API Key válida.
   * 
   * @param context - Contexto de ejecución de NestJS
   * @returns true si la API Key es válida
   * @throws UnauthorizedException si la API Key es inválida o falta
   */
  canActivate(context: ExecutionContext): boolean {
    try {
      const rpcData = context.switchToRpc().getData();
      const headers = rpcData?.headers;
      const expectedApiKey = this.configService.get<string>('CENSUS_INTERNAL_API_KEY');
      const providedApiKey = headers?.['x-api-key'];

      if (!providedApiKey) {
        this.logger.warn('Intento de acceso sin API Key');
        throw new UnauthorizedException('Acceso denegado: API Key requerida');
      }

      if (providedApiKey !== expectedApiKey) {
        this.logger.warn('Intento de acceso con API Key inválida');
        throw new UnauthorizedException('Acceso denegado: API Key inválida');
      }

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error('Error validando API Key:', error);
      throw new UnauthorizedException('Error de autorización');
    }
  }
}