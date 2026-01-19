import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CensusService } from './census.service';
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
     * Registrar voto realizado
     * Pattern: census.register-vote
     * También usamos el mismo DTO porque solo requiere cédula
     */
    @MessagePattern('census.register-vote')
    async registrarVoto(@Payload() data: CheckStatusDto) {
        console.log('[CENSUS CONTROLLER] Mensaje recibido: census.register-vote');
        return this.censusService.registrarVotoRealizado(data.cedula);
    }

    /**
     * Health check
     * Pattern: census.health
     */
    @MessagePattern('census.health')
    healthCheck() {
        return this.censusService.healthCheck();
    }
}
