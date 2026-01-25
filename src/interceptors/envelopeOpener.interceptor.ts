import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException, Logger } from '@nestjs/common';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { KeyVaultService } from '../security/keyVault.service';

/**
 * Interceptor que descifra automáticamente los sobres de seguridad en peticiones entrantes.
 * 
 * @description Este interceptor:
 * 1. Extrae el sobre cifrado del header 'x-security-envelope'
 * 2. Lo descifra usando KeyVaultService
 * 3. Reemplaza los datos de la petición con los datos descifrados
 */
@Injectable()
export class EnvelopeOpenerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(EnvelopeOpenerInterceptor.name);

  constructor(private readonly keyVaultService: KeyVaultService) {}

  /**
   * Intercepta la petición para descifrar el sobre de seguridad.
   * 
   * @param context - Contexto de ejecución de NestJS
   * @param next - Handler de la siguiente acción en la cadena
   * @returns Observable con los datos descifrados
   * @throws BadRequestException si falta el sobre o no se puede descifrar
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    try {
      const rpcData = context.switchToRpc().getData();
      const envelope = rpcData?.headers?.['x-security-envelope'];

      if (!envelope) {
        this.logger.warn('Petición sin sobre de seguridad');
        throw new BadRequestException('Falta sobre de seguridad requerido (x-security-envelope)');
      }

      return from(this.keyVaultService.unpack(envelope)).pipe(
        switchMap((decryptedData) => {
          delete rpcData.data;
          Object.assign(rpcData, decryptedData);
          return next.handle();
        })
      );
    } catch (error) {
      this.logger.error('Error en interceptor de sobres:', error);
      throw error;
    }
  }
}