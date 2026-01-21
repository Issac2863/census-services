import { Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

// Estados de voto
export enum EstadoVoto {
    NO_VOTO = 'NO_VOTO',           // No ha votado
    VOTANDO = 'VOTANDO',           // En proceso de votación
    GUARDANDO_VOTO = 'GUARDANDO_VOTO', // Guardando voto en blockchain
    VOTO = 'VOTO'                  // Ya votó
}

// Interfaz para el ciudadano en el padrón
interface CiudadanoPadron {
    cedula: string;
    nombres: string;
    recinto: string;
    estadoVoto: EstadoVoto;
    email: string;
    certificado_enviado: boolean;
}

@Injectable()
export class CensusService {
    // Simulación de Base de Datos en Memoria
    private padronElectoral: Map<string, CiudadanoPadron> = new Map();

    constructor(
        @Inject('CERTIFICATE_SERVICE') 
        private clientCertificate: ClientProxy,
        private configService: ConfigService
    ) {
        this.inicializarPadronMock();
    }

    private inicializarPadronMock() {
        const ciudadanos = [
            { cedula: '1500958069', nombres: 'ISSAC DE LA CADENA', recinto: 'EPN - FIEE', email: 'santiagomfo@outlook.com' },
            { cedula: '1724915770', nombres: 'JOEL DEFAZ', recinto: 'COLEGIO MEJIA', email: 'joe.def2019@gmail.com', },
            { cedula: '0104992564', nombres: 'MARIA LOPEZ', recinto: 'UNIVERSIDAD CENTRAL', email: 'participante3@epn.edu.ec' },
        ];

        ciudadanos.forEach(c => {
            this.padronElectoral.set(c.cedula, {
                ...c,
                estadoVoto: EstadoVoto.NO_VOTO,
                certificado_enviado: false,
            });
        });

        console.log(`[CENSUS SERVICE] Padrón inicializado con ${ciudadanos.length} ciudadanos.`);
    }

    /**
     * Obtener estado de voto de un ciudadano
     */
    async obtenerEstadoVoto(cedula: string) {
        const ciudadano = this.padronElectoral.get(cedula);

        if (!ciudadano) {
            throw new RpcException({
                success: false,
                message: 'Ciudadano no empadronado.',
                statusCode: 404
            });
        }

        return {
            success: true,
            cedula: ciudadano.cedula,
            nombres: ciudadano.nombres,
            recinto: ciudadano.recinto,
            estadoVoto: ciudadano.estadoVoto
        };
    }

    /**
     * Verificar si un ciudadano puede votar
     */
    async verificarEstadoVoto(cedula: string) {
        console.log('[CENSUS SERVICE] Verificando estado de:', cedula);

        const ciudadano = this.padronElectoral.get(cedula);

        if (!ciudadano) {
            throw new RpcException({
                success: false,
                message: 'Ciudadano no empadronado o no existe.',
                statusCode: 404
            });
        }

        // Solo puede votar si está en estado NO_VOTO
        const puedeVotar = ciudadano.estadoVoto === EstadoVoto.NO_VOTO;

        return {
            puedeVotar,
            estadoVoto: ciudadano.estadoVoto,
            mensaje: puedeVotar
                ? 'Ciudadano habilitado para votar.'
                : `El ciudadano tiene estado: ${ciudadano.estadoVoto}`,
            nombres: ciudadano.nombres,
            recinto: ciudadano.recinto
        };
    }

    /**
     * Actualizar estado de voto
     */
    async actualizarEstadoVoto(cedula: string, nuevoEstado: EstadoVoto) {
        console.log(`[CENSUS SERVICE] Actualizando estado de ${cedula} a ${nuevoEstado}`);

        const ciudadano = this.padronElectoral.get(cedula);

        if (!ciudadano) {
            throw new RpcException({
                success: false,
                message: 'Ciudadano no encontrado',
                statusCode: 404
            });
        }

        const estadoAnterior = ciudadano.estadoVoto;
        ciudadano.estadoVoto = nuevoEstado;
        this.padronElectoral.set(cedula, ciudadano);

        console.log(`[CENSUS SERVICE] Estado actualizado: ${estadoAnterior} -> ${nuevoEstado}`);

        return {
            success: true,
            estadoAnterior,
            estadoActual: nuevoEstado,
            message: `Estado de voto actualizado a ${nuevoEstado}`
        };
    }

    /**
     * Iniciar proceso de votación (NO_VOTO -> VOTANDO)
     */
    async iniciarVotacion(cedula: string) {
        const ciudadano = this.padronElectoral.get(cedula);

        if (!ciudadano) {
            throw new RpcException({
                success: false,
                message: 'Ciudadano no encontrado',
                statusCode: 404
            });
        }

        if (ciudadano.estadoVoto !== EstadoVoto.NO_VOTO) {
            throw new RpcException({
                success: false,
                message: `No puede iniciar votación. Estado actual: ${ciudadano.estadoVoto}`,
                statusCode: 400
            });
        }

        return this.actualizarEstadoVoto(cedula, EstadoVoto.VOTANDO);
    }

    /**
     * Guardar voto (VOTANDO -> GUARDANDO_VOTO)
     */
    async guardarVoto(cedula: string) {
        const ciudadano = this.padronElectoral.get(cedula);

        if (!ciudadano) {
            throw new RpcException({
                success: false,
                message: 'Ciudadano no encontrado',
                statusCode: 404
            });
        }

        if (ciudadano.estadoVoto !== EstadoVoto.VOTANDO) {
            throw new RpcException({
                success: false,
                message: `No puede guardar voto. Estado actual: ${ciudadano.estadoVoto}`,
                statusCode: 400
            });
        }

        return this.actualizarEstadoVoto(cedula, EstadoVoto.GUARDANDO_VOTO);
    }

    /**
     * Confirmar voto realizado (GUARDANDO_VOTO -> VOTO)
     */
    async confirmarVoto(cedula: string) {
        const ciudadano = this.padronElectoral.get(cedula);

        if (!ciudadano) {
            throw new RpcException({
                success: false,
                message: 'Ciudadano no encontrado',
                statusCode: 404
            });
        }

        if (ciudadano.estadoVoto !== EstadoVoto.GUARDANDO_VOTO) {
            throw new RpcException({
                success: false,
                message: `No puede confirmar voto. Estado actual: ${ciudadano.estadoVoto}`,
                statusCode: 400
            });
        }

        this.actualizarEstadoVoto(cedula, EstadoVoto.VOTO);
        
        const secretToken = this.configService.get<string>('INTERNAL_SECRET');
        
        this.clientCertificate.emit('vote.confirmed', {
            token: secretToken,
            cedula: ciudadano.cedula,
            nombres: ciudadano.nombres,
            recinto: ciudadano.recinto,
            email: ciudadano.email
        });
        
        return { success: true, message: 'Voto confirmado.' };
    }

    /**
     * Registrar voto completo (shortcut: NO_VOTO -> VOTO)
     * Mantiene compatibilidad con la implementación anterior
     */
    async registrarVotoRealizado(cedula: string) {
        console.log('[CENSUS SERVICE] Registrando voto para:', cedula);
        return this.actualizarEstadoVoto(cedula, EstadoVoto.VOTO);
    }


    /**
     * Obtener ciudadanos en estado GUARDANDO_VOTO que aún no tienen certificado enviado.
     * Útil para el servicio de mensajería/email.
     */
    async obtenerPendientesCertificado() {
        console.log('[CENSUS SERVICE] Consultando ciudadanos pendientes de certificado');

        // Define la interfaz o usa 'any' para el arreglo
        const pendientes: any[] = [];

        this.padronElectoral.forEach((ciudadano) => {
            if (ciudadano.estadoVoto === EstadoVoto.VOTO && !ciudadano.certificado_enviado) {
                pendientes.push({
                    cedula: ciudadano.cedula,
                    nombres: ciudadano.nombres,
                    recinto: ciudadano.recinto,
                    email: ciudadano.email
                });
            }
        });

        return pendientes;
    }

    /**
     * Notificar envío de certificados y finalizar proceso de votación (GUARDANDO_VOTO -> VOTO)
     * @param cedulas Lista de cédulas procesadas por el servicio de email
     */
    async confirmarEnvioCertificados(cedulas: string[]) {
        console.log(`[CENSUS SERVICE] Confirmando envío de certificados para ${cedulas.length} ciudadanos`);

        // Tipar el objeto de resultados
        const resultados: { actualizados: number, errores: any[] } = {
            actualizados: 0,
            errores: [] // <--- Ahora acepta objetos gracias al tipo 'any[]' anterior
        };

        cedulas.forEach(cedula => {
            const ciudadano = this.padronElectoral.get(cedula);
            if (!ciudadano) {
                resultados.errores.push({ cedula, mensaje: 'Ciudadano no encontrado' });
                return;
            }

            // Validación de seguridad: Solo actualizar si estaba esperando el certificado
            if (ciudadano.estadoVoto !== EstadoVoto.GUARDANDO_VOTO) {
                resultados.errores.push({
                    cedula,
                    mensaje: `Estado inválido para finalizar: ${ciudadano.estadoVoto}`
                });
                return;
            }

            // Actualización de estado y bandera de certificado
            this.confirmarVoto(cedula);
            ciudadano.certificado_enviado = true;

            this.padronElectoral.set(cedula, ciudadano);
            resultados.actualizados++;
        });

        return {
            success: true,
            procesados: resultados.actualizados,
            fallidos: resultados.errores.length,
            errores: resultados.errores,
            message: `Se finalizaron ${resultados.actualizados} procesos de votación con éxito.`
        };
    }

    /**
     * Health check
     */
    healthCheck() {
        // Contar estados
        const estadisticas = {
            NO_VOTO: 0,
            VOTANDO: 0,
            GUARDANDO_VOTO: 0,
            VOTO: 0
        };

        this.padronElectoral.forEach(c => {
            estadisticas[c.estadoVoto]++;
        });

        return {
            status: 'ok',
            service: 'census-service',
            totalCiudadanos: this.padronElectoral.size,
            estadisticas,
            timestamp: new Date().toISOString()
        };
    }
}
