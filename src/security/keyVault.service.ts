import { Injectable, OnModuleInit, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jose from 'jose';

/**
 * Servicio de gestión de llaves criptográficas para descifrado de sobres de seguridad.
 * Maneja la verificación de identidad de emisores y el descifrado de contenido JWE/JWS.
 */
@Injectable()
export class KeyVaultService implements OnModuleInit {
  private readonly logger = new Logger(KeyVaultService.name);
  private readonly keyCache = new Map<string, any>();

  constructor(private readonly configService: ConfigService) {}

  /**
   * Inicializa y carga las llaves criptográficas al arrancar el módulo.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.cacheKey('CENSUS_PRIVATE_KEY_BASE64', 'private', 'RSA-OAEP-256');
      await this.cacheKey('AUTH_PUBLIC_KEY_BASE64', 'public', 'PS256');
      await this.cacheKey('VOTING_PUBLIC_KEY_BASE64', 'public', 'PS256');

      this.logger.log('Sistema de llaves criptográficas inicializado');
    } catch (error) {
      this.logger.error('Error cargando llaves criptográficas:', error.message);
      throw error;
    }
  }

  /**
   * Carga una llave criptográfica desde variables de entorno y la almacena en caché.
   * 
   * @param envVar - Nombre de la variable de entorno
   * @param type - Tipo de llave: 'private' o 'public'
   * @param alg - Algoritmo criptográfico a usar
   * @private
   */
  private async cacheKey(envVar: string, type: 'private' | 'public', alg: string): Promise<void> {
    const base64 = this.configService.get<string>(envVar);
    if (!base64) {
      this.logger.warn(`Variable de entorno ${envVar} no encontrada, saltando...`);
      return;
    }

    try {
      const keyStr = Buffer.from(base64, 'base64').toString();
      const key = type === 'private'
        ? await jose.importPKCS8(keyStr, alg)
        : await jose.importSPKI(keyStr, alg);

      this.keyCache.set(envVar, key);
    } catch (error) {
      this.logger.error(`Error cargando llave ${envVar}:`, error.message);
      throw error;
    }
  }

  /**
   * Desempaqueta un sobre de seguridad JWE/JWS verificando el emisor.
   * 
   * @param envelope - Sobre JWE que contiene un JWS firmado
   * @returns Datos descifrados y verificados
   * @throws BadRequestException si el sobre es inválido o el emisor desconocido
   */
  async unpack(envelope: string): Promise<any> {
    try {
      const myPrivKey = this.keyCache.get('CENSUS_PRIVATE_KEY_BASE64');
      if (!myPrivKey) {
        throw new Error('Llave privada no disponible');
      }

      // Descifrar el JWE
      const { plaintext } = await jose.compactDecrypt(envelope, myPrivKey);
      const jws = new TextDecoder().decode(plaintext);

      // Verificar emisor del JWS
      const header = jose.decodeProtectedHeader(jws);
      const issuer = header.iss as string;

      if (!issuer) {
        throw new Error('Sobre de seguridad sin emisor válido');
      }

      // Obtener llave pública del emisor
      const senderPubKey = this.getPublicKeyForIssuer(issuer);

      // Verificar la firma JWS
      const { payload } = await jose.compactVerify(jws, senderPubKey);

      return JSON.parse(new TextDecoder().decode(payload));
    } catch (error) {
      this.logger.error(`Error desempaquetando sobre de seguridad: ${error.message}`);
      throw new BadRequestException('Sobre de seguridad inválido o emisor desconocido');
    }
  }

  /**
   * Obtiene la llave pública correspondiente a un emisor específico.
   * 
   * @param iss - Identificador del emisor
   * @returns Llave pública del emisor
   * @throws Error si no existe llave registrada para el emisor
   * @private
   */
  private getPublicKeyForIssuer(iss: string): any {
    const issuerMap: Record<string, string> = {
      'auth-service': 'AUTH_PUBLIC_KEY_BASE64',
      'voting-service': 'VOTING_PUBLIC_KEY_BASE64',
    };

    const envVar = issuerMap[iss];
    const key = this.keyCache.get(envVar);

    if (!key) {
      throw new Error(`Emisor no autorizado o llave no disponible: ${iss}`);
    }

    return key;
  }
}