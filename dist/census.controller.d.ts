import { CensusService } from './census.service';
export declare class CensusController {
    private readonly censusService;
    constructor(censusService: CensusService);
    verificarEstado(data: {
        cedula: string;
    }): Promise<{
        puedeVotar: boolean;
        mensaje: string;
        nombres: string;
        recinto: string;
    }>;
    registrarVoto(data: {
        cedula: string;
    }): Promise<{
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
