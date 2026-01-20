export declare enum EstadoVoto {
    NO_VOTO = "NO_VOTO",
    VOTANDO = "VOTANDO",
    GUARDANDO_VOTO = "GUARDANDO_VOTO",
    VOTO = "VOTO"
}
export declare class CensusService {
    private padronElectoral;
    constructor();
    private inicializarPadronMock;
    obtenerEstadoVoto(cedula: string): Promise<{
        success: boolean;
        cedula: string;
        nombres: string;
        recinto: string;
        estadoVoto: EstadoVoto;
    }>;
    verificarEstadoVoto(cedula: string): Promise<{
        puedeVotar: boolean;
        estadoVoto: EstadoVoto;
        mensaje: string;
        nombres: string;
        recinto: string;
    }>;
    actualizarEstadoVoto(cedula: string, nuevoEstado: EstadoVoto): Promise<{
        success: boolean;
        estadoAnterior: EstadoVoto;
        estadoActual: EstadoVoto;
        message: string;
    }>;
    iniciarVotacion(cedula: string): Promise<{
        success: boolean;
        estadoAnterior: EstadoVoto;
        estadoActual: EstadoVoto;
        message: string;
    }>;
    guardarVoto(cedula: string): Promise<{
        success: boolean;
        estadoAnterior: EstadoVoto;
        estadoActual: EstadoVoto;
        message: string;
    }>;
    confirmarVoto(cedula: string): Promise<{
        success: boolean;
        estadoAnterior: EstadoVoto;
        estadoActual: EstadoVoto;
        message: string;
    }>;
    registrarVotoRealizado(cedula: string): Promise<{
        success: boolean;
        estadoAnterior: EstadoVoto;
        estadoActual: EstadoVoto;
        message: string;
    }>;
    obtenerPendientesCertificado(): Promise<any[]>;
    confirmarEnvioCertificados(cedulas: string[]): Promise<{
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
