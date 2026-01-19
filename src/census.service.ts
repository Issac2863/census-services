import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

// Interfaz para el ciudadano en el padrón
interface CiudadanoPadron {
    cedula: string;
    nombres: string;
    recinto: string;
    yaVoto: boolean;
}

@Injectable()
export class CensusService {
    // Simulación de Base de Datos en Memoria
    // En producción, esto sería una conexión a MongoDB
    private padronElectoral: Map<string, CiudadanoPadron> = new Map();

    constructor() {
        this.inicializarPadronMock();
    }

    private inicializarPadronMock() {
        // Datos de prueba
        const ciudadanos = [
            { cedula: '1500958069', nombres: 'ISSAC DE LA CADENA', recinto: 'EPN - FIEE' },
            { cedula: '1722256492', nombres: 'JUAN PEREZ', recinto: 'COLEGIO MEJIA' },
            { cedula: '0104992564', nombres: 'MARIA LOPEZ', recinto: 'UNIVERSIDAD CENTRAL' }
        ];

        ciudadanos.forEach(c => {
            this.padronElectoral.set(c.cedula, {
                ...c,
                yaVoto: false // Por defecto nadie ha votado al iniciar
            });
        });

        console.log(`[CENSUS SERVICE] Padrón inicializado con ${ciudadanos.length} ciudadanos.`);
    }

    /**
     * Verificar si un ciudadano puede votar
     * @param cedula 
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

        if (ciudadano.yaVoto) {
            return {
                puedeVotar: false,
                mensaje: 'El ciudadano YA ha ejercido su recuento de voto.',
                nombres: ciudadano.nombres,
                recinto: ciudadano.recinto
            };
        }

        return {
            puedeVotar: true,
            mensaje: 'Ciudadano habilitado para votar.',
            nombres: ciudadano.nombres,
            recinto: ciudadano.recinto
        };
    }

    /**
     * Registrar que un ciudadano ya votó
     * Se llama cuando el voto se guarda exitosamente en el Blockchain/BD Votos
     */
    async registrarVotoRealizado(cedula: string) {
        console.log('[CENSUS SERVICE] Registrando voto para:', cedula);

        const ciudadano = this.padronElectoral.get(cedula);

        if (!ciudadano) {
            throw new RpcException({
                success: false,
                message: 'Ciudadano no encontrado',
                statusCode: 404
            });
        }

        // Actualizar estado (GUARDADO EN MEMORIA)
        ciudadano.yaVoto = true;
        this.padronElectoral.set(cedula, ciudadano);

        console.log(`[CENSUS SERVICE] Voto registrado exitosamente para ${cedula}`);

        return {
            success: true,
            message: 'Voto registrado en el padrón electoral.'
        };
    }

    /**
     * Health check
     */
    healthCheck() {
        return {
            status: 'ok',
            service: 'census-service',
            totalCiudadanos: this.padronElectoral.size,
            timestamp: new Date().toISOString()
        };
    }
}
