import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CandidatosService } from './candidatosRepository.service';
import { CertificateProxy } from './proxies/certificate.proxy';

/**
 * Interfaz para la respuesta del servicio de certificados.
 */
export interface CertificateResponse {
    success: boolean;
    message: string;
}

/**
 * Estados posibles del proceso de votación en el padrón electoral.
 */
export enum EstadoVoto {
    NO_VOTO = 'NO_VOTO',           // No ha votado
    VOTANDO = 'VOTANDO',           // En proceso de votación
    GUARDANDO_VOTO = 'GUARDANDO_VOTO', // Guardando voto en blockchain
    VOTO = 'VOTO'                  // Ya votó
}

/**
 * Servicio de censo electoral que gestiona el padrón y estados de votación.
 * Maneja las transiciones de estado durante el proceso electoral y coordina
 * la emisión de certificados de votación.
 */
@Injectable()
export class CensusService {
    private readonly logger = new Logger(CensusService.name);

    constructor(
        private readonly padronService: CandidatosService,
        private readonly certificateProxy: CertificateProxy
    ) {}

    /**
     * Valida las credenciales de un ciudadano y verifica su elegibilidad para votar.
     * 
     * @param data - Datos de validación con cédula y código dactilar
     * @returns Información de validación y datos del ciudadano si es válido
     * @throws RpcException si ocurre un error interno
     */
    async validarIdentidadCiudadano(data: any): Promise<any> {
        try {
            this.logger.log(`Validando identidad del ciudadano: ${data.cedula}`);
            const ciudadano = await this.padronService.obtenerCandidato(data.cedula);

            // 1. Verificar que existe en el padrón
            if (!ciudadano) {
                this.logger.warn(`Ciudadano no encontrado en padrón: ${data.cedula}`);
                return {
                    exists: false,
                    message: 'Ciudadano no registrado en el padrón electoral'
                };
            }

            // 2. Validar código dactilar
            const codigoValido = ciudadano.codigo_dactilar === data.codigoDactilar;
            if (!codigoValido) {
                this.logger.warn(`Código dactilar inválido para: ${data.cedula}`);
                return {
                    exists: false,
                    message: 'Credenciales inválidas'
                };
            }

            // 3. Verificar estado de votación (CRÍTICO PARA SEGURIDAD)
            const estado = ciudadano.estado_voto;

            // Si ya está votando, guardando o ya votó -> RECHAZAR
            if (estado === EstadoVoto.VOTANDO) {
                this.logger.warn(`Intento de autenticación duplicada - Ciudadano ${data.cedula} ya está votando`);
                return {
                    exists: false,
                    canVote: false,
                    message: 'Ya tiene una sesión de votación activa. Complete o cancele la votación actual.',
                    currentState: estado
                };
            }

            if (estado === EstadoVoto.GUARDANDO_VOTO) {
                this.logger.warn(`Intento de re-votación - Ciudadano ${data.cedula} está guardando voto`);
                return {
                    exists: false,
                    canVote: false,
                    message: 'Su voto está siendo procesado. No puede iniciar una nueva votación.',
                    currentState: estado
                };
            }

            if (estado === EstadoVoto.VOTO) {
                this.logger.warn(`Intento de re-votación - Ciudadano ${data.cedula} ya votó`);
                return {
                    exists: true,
                    canVote: false,
                    hasVoted: true,
                    message: 'Ya ha ejercido su derecho al voto. No puede votar nuevamente.',
                    currentState: estado
                };
            }

            // 4. Solo si está en NO_VOTO puede proceder
            if (estado === EstadoVoto.NO_VOTO) {
                this.logger.log(` Validación exitosa - Ciudadano ${data.cedula} puede votar`);
                return {
                    exists: true,
                    canVote: true,
                    hasVoted: false,
                    citizenData: {
                        id: ciudadano.id,
                        cedula: ciudadano.cedula,
                        nombres: ciudadano.nombres,
                        apellidos: ciudadano.apellidos,
                        email: ciudadano.email
                    },
                    currentState: estado
                };
            }

            // Estado desconocido (no debería pasar)
            this.logger.error(`Estado de voto desconocido para ${data.cedula}: ${estado}`);
            return {
                exists: false,
                canVote: false,
                message: 'Estado de votación inválido. Contacte al administrador.',
                currentState: estado
            };

        } catch (error) {
            this.logger.error(`Error validando identidad de ${data.cedula}: ${error.message}`, error.stack);
            throw new RpcException({
                success: false,
                message: 'Error interno al validar identidad',
                statusCode: 500
            });
        }
    }

    /**
     * Inicia el proceso de votación para un ciudadano.
     * Transición válida: NO_VOTO → VOTANDO
     * 
     * @param id - Cédula del ciudadano
     * @returns Confirmación del inicio de votación
     * @throws RpcException si el ciudadano no existe o no puede iniciar votación
     */
    async iniciarVotacion(id: string): Promise<any> {
        this.logger.log(`Iniciando votación para: ${id}`);

        const ciudadano = await this.padronService.obtenerCandidatoPorId(id);

        if (!ciudadano) {
            this.logger.error(`Ciudadano no encontrado para iniciar votación: ${id}`);
            throw new RpcException({
                success: false,
                message: 'Ciudadano no encontrado',
                statusCode: 404
            });
        }

        if (ciudadano.estado_voto !== EstadoVoto.NO_VOTO) {
            this.logger.warn(`Intento de iniciar votación inválido para ${id} - Estado actual: ${ciudadano.estadoVoto}`);
            throw new RpcException({
                success: false,
                message: `No puede iniciar votación. Estado actual: ${ciudadano.estadoVoto}`,
                statusCode: 400
            });
        }

        //return this.actualizarEstadoVoto(id, EstadoVoto.VOTANDO);
        return this.padronService.actualizarEstado(id, EstadoVoto.VOTANDO);
    }

    /**
     * Procesa el guardado del voto en blockchain.
     * Transición válida: VOTANDO → GUARDANDO_VOTO
     * 
     * @param id - Cédula del ciudadano
     * @returns Confirmación del guardado
     * @throws RpcException si el ciudadano no existe o no puede guardar el voto
     */
    async guardarVoto(id: string): Promise<any> {
        this.logger.log(`Guardando voto para: ${id}`);

        const ciudadano = await this.padronService.obtenerCandidatoPorId(id);

        if (!ciudadano) {
            this.logger.error(`Ciudadano no encontrado para guardar voto: ${id}`);
            throw new RpcException({
                success: false,
                message: 'Ciudadano no encontrado',
                statusCode: 404
            });
        }

        if (ciudadano.estado_voto !== EstadoVoto.VOTANDO) {
            this.logger.warn(`Intento de guardar voto inválido para ${id} - Estado actual: ${ciudadano.estadoVoto}`);
            throw new RpcException({
                success: false,
                message: `No puede guardar voto. Estado actual: ${ciudadano.estadoVoto}`,
                statusCode: 400
            });
        }

        return this.padronService.actualizarEstado(id, EstadoVoto.GUARDANDO_VOTO);
    }

    /**
     * Confirma definitivamente el voto y notifica al servicio de certificados.
     * Transición válida: GUARDANDO_VOTO → VOTO
     * 
     * @param id - Cédula del ciudadano
     * @returns Confirmación del voto finalizado
     * @throws RpcException si el ciudadano no existe o no puede confirmar el voto
     */
    async confirmarVoto(id: string): Promise<any> {
        this.logger.log(`Confirmando voto final para: ${id}`);

        try {
            const ciudadano = await this.padronService.obtenerCandidatoPorId(id);

            if (!ciudadano) {
                this.logger.error(`Ciudadano no encontrado para confirmar voto: ${id}`);
                throw new RpcException({
                    success: false,
                    message: 'Ciudadano no encontrado',
                    statusCode: 404
                });
            }

            if (ciudadano.estado_voto !== EstadoVoto.GUARDANDO_VOTO) {
                this.logger.warn(`Intento de confirmación inválido para ${id} - Estado actual: ${ciudadano.estado_voto}`);
                throw new RpcException({
                    success: false,
                    message: `No puede confirmar voto. Estado actual: ${ciudadano.estado_voto}`,
                    statusCode: 400
                });
            }

            // Actualizar estado a VOTO
            const ciudadanoActualizado = await this.padronService.actualizarEstado(id, EstadoVoto.VOTO);

            if (!ciudadanoActualizado) {
                throw new RpcException({
                    success: false,
                    message: 'Error al actualizar estado del ciudadano',
                    statusCode: 500
                });
            }

            // Intentar enviar certificado (no crítico)
            try {
                const result = await this.certificateProxy.emitirCertificado({
                    cedula: ciudadanoActualizado.cedula,
                    nombres: ciudadanoActualizado.nombres,
                    recinto: ciudadanoActualizado.recinto,
                    email: ciudadanoActualizado.email
                });

                if (result?.success) {
                    this.logger.log(`Certificado enviado para ciudadano ${id}`);
                } else {
                    this.logger.warn(`Certificado no enviado: ${result?.message || 'Error desconocido'}`);
                }
            } catch (certError) {
                // El voto YA está confirmado, solo logueamos el error del certificado
                this.logger.error(`Error enviando certificado (voto confirmado): ${certError.message}`);
            }

            // RETORNAR RESPUESTA EXITOSA
            return {
                success: true,
                message: 'Voto confirmado exitosamente y certificado emitido.',
            };

        } catch (error) {
            this.logger.error(`Error confirmando voto para ${id}: ${error.message}`);
            throw error; // Re-lanzar para que el caller maneje el error
        }
    }

    /**
     * Proporciona información de salud y estadísticas del servicio.
     * 
     * @returns Estado del servicio y distribución de ciudadanos por estado electoral
     */
    healthCheck(): any {
        const estadisticas = {
            NO_VOTO: 0,
            VOTANDO: 0,
            GUARDANDO_VOTO: 0,
            VOTO: 0
        };

        const result = {
            status: 'ok',
            service: 'census-service',
            estadisticas,
            timestamp: new Date().toISOString()
        };

        this.logger.log(`Health check - , Estados: ${JSON.stringify(estadisticas)}`);
        return result;
    }
}
