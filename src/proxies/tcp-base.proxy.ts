import { ClientProxy } from '@nestjs/microservices';
import { EnvelopePackerService } from '../security/envelopePacker.service';
import { lastValueFrom } from 'rxjs';
import { InternalServerErrorException, Logger } from '@nestjs/common';

/**
 * Clase base abstracta para proxies de comunicación TCP segura.
 * Maneja la comunicación con microservicios mediante message patterns y sobres de seguridad.
 */
export abstract class BaseMessageProxy {
  protected abstract readonly logger: Logger;
  protected abstract readonly targetService: string;
  protected abstract readonly privateKeyVar: string;
  protected abstract readonly publicKeyVar: string;
  protected abstract readonly apiKeyVar: string;

  constructor(
    protected readonly client: ClientProxy,
    protected readonly securityService: EnvelopePackerService,
    protected readonly originService: string,
  ) {}

  /**
   * Envía una petición segura al microservicio con sobre de seguridad cifrado.
   * 
   * @template T - Tipo de respuesta esperada del microservicio
   * @param pattern - Patrón de mensaje para el microservicio
   * @param data - Datos a enviar al microservicio
   * @returns Respuesta del microservicio
   * @throws InternalServerErrorException si falla la comunicación
   */
  protected async sendRequest<T>(pattern: string, data: any): Promise<T> {
    try {
      const { headers, payload: securePayload } = await this.securityService.getSecurityHeaders(
        this.targetService,
        this.originService,
        this.privateKeyVar,
        this.publicKeyVar,
        this.apiKeyVar,
        data
      );

      this.logger.log(`Enviando petición TCP a ${this.targetService} - Pattern: ${pattern}`);

      return await lastValueFrom(
        this.client.send(pattern, { data: securePayload, headers })
      );
    } catch (error) {
      this.logger.error(`Error TCP con ${this.targetService} [${pattern}]: ${error.message}`);
      throw new InternalServerErrorException(
        error.message || `Error de comunicación con ${this.targetService}`
      );
    }
  }
}