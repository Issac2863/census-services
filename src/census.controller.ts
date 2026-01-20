import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CensusService, EstadoVoto } from './census.service';
import { CheckStatusDto } from './dto/census.dto';

@Controller()
export class CensusController {
    constructor(private readonly censusService: CensusService) { }

    /**
     * Verificar estado del voto
     * Pattern: census.check-status
     */
    @MessagePattern('census.check-status')
    async verificarEstado(@Payload() data: CheckStatusDto) {
        console.log('[CENSUS CONTROLLER] Mensaje recibido: census.check-status');
        return this.censusService.verificarEstadoVoto(data.cedula);
    }

    /**
     * Obtener estado de voto actual
     * Pattern: census.get-status
     */
    @MessagePattern('census.get-status')
    async obtenerEstado(@Payload() data: CheckStatusDto) {
        console.log('[CENSUS CONTROLLER] Mensaje recibido: census.get-status');
        return this.censusService.obtenerEstadoVoto(data.cedula);
    }

    /**
     * Iniciar votación (NO_VOTO -> VOTANDO)
     * Pattern: census.start-voting
     */
    @MessagePattern('census.start-voting')
    async iniciarVotacion(@Payload() data: CheckStatusDto) {
        console.log('[CENSUS CONTROLLER] Mensaje recibido: census.start-voting');
        return this.censusService.iniciarVotacion(data.cedula);
    }

    /**
     * Guardar voto (VOTANDO -> GUARDANDO_VOTO)
     * Pattern: census.save-vote
     */
    @MessagePattern('census.save-vote')
    async guardarVoto(@Payload() data: CheckStatusDto) {
        console.log('[CENSUS CONTROLLER] Mensaje recibido: census.save-vote');
        return this.censusService.guardarVoto(data.cedula);
    }

    /**
     * Confirmar voto (GUARDANDO_VOTO -> VOTO)
     * Pattern: census.confirm-vote
     */
    @MessagePattern('census.confirm-vote')
    async confirmarVoto(@Payload() data: CheckStatusDto) {
        console.log('[CENSUS CONTROLLER] Mensaje recibido: census.confirm-vote');
        return this.censusService.confirmarVoto(data.cedula);
    }

    /**
     * Registrar voto realizado (compatible con versión anterior)
     * Pattern: census.register-vote
     */
    @MessagePattern('census.register-vote')
    async registrarVoto(@Payload() data: CheckStatusDto) {
        console.log('[CENSUS CONTROLLER] Mensaje recibido: census.register-vote');
        return this.censusService.registrarVotoRealizado(data.cedula);
    }

    /**
     * Health check con estadísticas
     * Pattern: census.health
     */
    @MessagePattern('census.health')
    healthCheck() {
        return this.censusService.healthCheck();
    }
}
