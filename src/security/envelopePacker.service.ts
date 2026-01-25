import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jose from 'jose';

/**
 * Servicio responsable de generar sobres de seguridad para comunicación entre microservicios.
 * Implementa doble protección: JWS (autenticidad/integridad) + JWE (confidencialidad).
 */
@Injectable()
export class EnvelopePackerService {
  private readonly logger = new Logger(EnvelopePackerService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Genera el sobre de seguridad completo con firma, cifrado y headers de autenticación.
   * 
   * @param targetService - Nombre del microservicio de destino
   * @param originService - Nombre del microservicio origen
   * @param privateKeyEnv - Variable de entorno con la clave privada para firmar
   * @param publicKeyEnv - Variable de entorno con la clave pública para cifrar
   * @param apiKeyEnv - Variable de entorno con la API Key interna
   * @param payload - Datos a proteger y enviar
   * @returns Headers de seguridad y payload protegido
   * @throws InternalServerErrorException si falla la generación del sobre
   */
  async getSecurityHeaders(
    targetService: string,
    originService: string,
    privateKeyEnv: string,
    publicKeyEnv: string,
    apiKeyEnv: string,
    payload: any,
  ): Promise<{headers: object, payload: object}> {
    try {
      const { privateKey, publicKey } = await this.loadKeys(privateKeyEnv, publicKeyEnv);
      const internalApiKey = this.configService.get<string>(apiKeyEnv);

      const signedPayload = await this.signPayload(payload, privateKey, targetService, originService);
      const encryptedEnvelope = await this.encryptPayload(signedPayload, publicKey);

      return {
        headers: {
          'x-api-key': internalApiKey,
          'x-security-envelope': encryptedEnvelope,
          'x-content-encrypted': 'true',
          'Content-Type': 'application/json',
        },
        payload: { protected: true },
      };
    } catch (error) {
      this.logger.error(`Error generando sobre de seguridad para ${targetService}: ${error.message}`);
      throw new InternalServerErrorException('Error procesando seguridad interna');
    }
  }

  /**
   * Carga y convierte las claves criptográficas desde variables de entorno.
   * 
   * @param privVar - Variable de entorno de la clave privada en base64
   * @param pubVar - Variable de entorno de la clave pública en base64
   * @returns Claves criptográficas cargadas
   * @throws Error si las variables no existen o las claves son inválidas
   * @private
   */
  private async loadKeys(privVar: string, pubVar: string): Promise<{privateKey: any, publicKey: any}> {
    const privBase64 = this.configService.get<string>(privVar);
    const pubBase64 = this.configService.get<string>(pubVar);

    if (!privBase64 || !pubBase64) {
      throw new Error(`Claves criptográficas no encontradas: ${privVar} / ${pubVar}`);
    }

    return {
      privateKey: await jose.importPKCS8(Buffer.from(privBase64, 'base64').toString(), 'PS256'),
      publicKey: await jose.importSPKI(Buffer.from(pubBase64, 'base64').toString(), 'RSA-OAEP-256'),
    };
  }

  /**
   * Firma digitalmente el payload usando JWS con algoritmo PS256.
   * 
   * @param data - Datos a firmar
   * @param key - Clave privada para la firma
   * @param aud - Audiencia (microservicio de destino)
   * @param iss - Emisor (microservicio origen)
   * @returns Token JWS firmado
   * @private
   */
  private async signPayload(data: any, key: any, aud: string, iss: string): Promise<string> {
    const bodyString = JSON.stringify(data);
    return await new jose.CompactSign(new TextEncoder().encode(bodyString))
      .setProtectedHeader({
        alg: 'PS256',
        iss,
        aud
      })
      .sign(key);
  }

  /**
   * Cifra el payload firmado usando JWE con RSA-OAEP-256 y A256GCM.
   * 
   * @param signedData - Token JWS a cifrar
   * @param key - Clave pública para el cifrado
   * @returns Token JWE cifrado
   * @private
   */
  private async encryptPayload(signedData: string, key: any): Promise<string> {
    return await new jose.CompactEncrypt(new TextEncoder().encode(signedData))
      .setProtectedHeader({
        alg: 'RSA-OAEP-256',
        enc: 'A256GCM'
      })
      .encrypt(key);
  }
}