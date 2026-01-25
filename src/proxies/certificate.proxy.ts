import { Inject, Injectable, Logger } from '@nestjs/common';
import { EnvelopePackerService } from '../security/envelopePacker.service';
import { BaseMessageProxy } from './tcp-base.proxy';
import { ClientProxy } from '@nestjs/microservices';
import { CertificateResponse } from '../census.service';

/**
 * Proxy para comunicación segura con el servicio de certificados.
 * Gestiona el envío de datos de votación para la generación de certificados PDF.
 */
@Injectable()
export class CertificateProxy extends BaseMessageProxy {
  protected readonly logger = new Logger(CertificateProxy.name);
  protected readonly targetService = 'certificate-service';
  protected readonly originService = 'census-service';
  protected readonly privateKeyVar = 'CERTIFICATE_PRIVATE_KEY_BASE64';
  protected readonly apiKeyVar = 'CERTIFICATE_INTERNAL_API_KEY';
  protected readonly publicKeyVar = 'CERTIFICATE_ENCRYPT_PUBLIC_KEY_BASE64';

  constructor(
    @Inject('CERTIFICATE_SERVICE') private readonly certificateClient: ClientProxy,
    securityService: EnvelopePackerService,
  ) {
    super(certificateClient, securityService, 'census-service');
  }

  /**
   * Solicita la emisión de un certificado de votación.
   * 
   * @param datosCertificado - Datos del ciudadano para generar el certificado
   * @returns Resultado de la operación de emisión
   */
  async emitirCertificado(datosCertificado: any): Promise<CertificateResponse> {
    return this.sendRequest<CertificateResponse>('vote.confirmed', datosCertificado);
  }
}