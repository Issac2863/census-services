export declare class CensusService {
    private padronElectoral;
    constructor();
    private inicializarPadronMock;
    verificarEstadoVoto(cedula: string): Promise<{
        puedeVotar: boolean;
        mensaje: string;
        nombres: string;
        recinto: string;
    }>;
    registrarVotoRealizado(cedula: string): Promise<{
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
