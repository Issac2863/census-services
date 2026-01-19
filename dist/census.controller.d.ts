import { CensusService } from './census.service';
import { CheckStatusDto } from './dto/census.dto';
export declare class CensusController {
    private readonly censusService;
    constructor(censusService: CensusService);
    verificarEstado(data: CheckStatusDto): Promise<{
        puedeVotar: boolean;
        mensaje: string;
        nombres: string;
        recinto: string;
    }>;
    registrarVoto(data: CheckStatusDto): Promise<{
        success: boolean;
        message: string;
    }>;
    healthCheck(): {
        status: string;
        service: string;
        totalCiudadanos: number;
        timestamp: string;
    };
}
