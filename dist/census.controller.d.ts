import { CensusService, EstadoVoto } from './census.service';
import { CheckStatusDto } from './dto/census.dto';
export declare class CensusController {
    private readonly censusService;
    constructor(censusService: CensusService);
    verificarEstado(data: CheckStatusDto): Promise<{
        puedeVotar: boolean;
        estadoVoto: EstadoVoto;
        mensaje: string;
        nombres: string;
        recinto: string;
    }>;
    obtenerEstado(data: CheckStatusDto): Promise<{
        success: boolean;
        cedula: string;
        nombres: string;
        recinto: string;
        estadoVoto: EstadoVoto;
    }>;
    iniciarVotacion(data: CheckStatusDto): Promise<{
        success: boolean;
        estadoAnterior: EstadoVoto;
        estadoActual: EstadoVoto;
        message: string;
    }>;
    guardarVoto(data: CheckStatusDto): Promise<{
        success: boolean;
        estadoAnterior: EstadoVoto;
        estadoActual: EstadoVoto;
        message: string;
    }>;
    confirmarVoto(data: CheckStatusDto): Promise<{
        success: boolean;
        estadoAnterior: EstadoVoto;
        estadoActual: EstadoVoto;
        message: string;
    }>;
    registrarVoto(data: CheckStatusDto): Promise<{
        success: boolean;
        estadoAnterior: EstadoVoto;
        estadoActual: EstadoVoto;
        message: string;
    }>;
    consultCitizineWithVote(): Promise<any[]>;
    confirmarEnvioCertificados(data: {
        cedulas: string[];
    }): Promise<{
        success: boolean;
        procesados: number;
        fallidos: number;
        errores: any[];
        message: string;
    }>;
    healthCheck(): {
        status: string;
        service: string;
        totalCiudadanos: number;
        estadisticas: {
            NO_VOTO: number;
            VOTANDO: number;
            GUARDANDO_VOTO: number;
            VOTO: number;
        };
        timestamp: string;
    };
}
