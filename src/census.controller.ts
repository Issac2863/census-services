import { Body, Controller, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CensusService } from './census.service';
import { InternalApiKeyGuard } from './guards/internalApiKey.guard';
import { EnvelopeOpenerInterceptor } from './interceptors/envelopeOpener.interceptor';

/**
 * Controlador del servicio de censo electoral.
 * Maneja todas las operaciones relacionadas con el padrón electoral y estados de votación.
 * 
 * @security Protegido por InternalApiKeyGuard para comunicación interna.
 * @security Usa EnvelopeOpenerInterceptor para descifrar datos encriptados.
 */
@UseGuards(InternalApiKeyGuard)
@UseInterceptors(EnvelopeOpenerInterceptor)
@Controller()
export class CensusController {
    private readonly logger = new Logger(CensusController.name);

    constructor(private readonly censusService: CensusService) {}

    /**
     * Valida las credenciales de un ciudadano y verifica su estado electoral.
     * 
     * @param data - Datos de validación (cédula y código dactilar)
     * @returns Estado de validación y datos del ciudadano si es válido
     */
    @MessagePattern('census.validate-credentials')
    async validateCredentials(@Payload() data: any): Promise<any> {
        try {
            this.logger.log(`Validando credenciales - Cédula: ${data.cedula}`);
            return await this.censusService.validarIdentidadCiudadano(data);
        } catch (error) {
            this.logger.error(`Error validando credenciales para ${data.cedula}:`, error);
            throw error;
        }
    }

    /**
     * Inicia el proceso de votación para un ciudadano.
     * Transición: NO_VOTO → VOTANDO
     * 
     * @param data - DTO con la cédula del ciudadano
     * @returns Confirmación del inicio de votación
     */
    @MessagePattern('census.start-voting')
    async iniciarVotacion(@Payload() data: any): Promise<any> {
        try {
            this.logger.log(`Iniciando proceso de votación - ID: ${data.id}`);
            const resultado = await this.censusService.iniciarVotacion(data.id);
            return resultado;
        } catch (error) {
            this.logger.error(`Error iniciando votación para ${data.id}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Procesa y guarda el voto emitido por el ciudadano.
     * Transición: VOTANDO → GUARDANDO_VOTO
     * 
     * @param data - DTO con la cédula del ciudadano
     * @returns Confirmación del guardado del voto
     */
    @MessagePattern('census.save-vote')
    async guardarVoto(@Payload() data: any): Promise<any> {
        try {
            this.logger.log(`Guardando voto - ID: ${data.id}`);
            return await this.censusService.guardarVoto(data.id);
        } catch (error) {
            this.logger.error(`Error guardando voto para ${data.id}:`, error);
            throw error;
        }
    }

    /**
     * Confirma definitivamente el voto emitido.
     * Transición: GUARDANDO_VOTO → VOTO
     * 
     * @param data - DTO con la cédula del ciudadano
     * @returns Confirmación final del voto registrado
     */
    @MessagePattern('census.confirm-vote')
    async confirmarVoto(@Payload() data: any): Promise<any> {
        try {
            this.logger.log(`Confirmando voto final - ID: ${data.id}`);
            return await this.censusService.confirmarVoto(data.id);
        } catch (error) {
            this.logger.error(`Error confirmando voto para ${data.id}:`, error);
            throw error;
        }
    }

    /**
     * Verifica el estado de salud del servicio de censo.
     * 
     * @returns Estadísticas y estado del servicio
     */
    @MessagePattern('census.health')
    healthCheck(): any {
        this.logger.log('Health check solicitado');
        return this.censusService.healthCheck();
    }
}
