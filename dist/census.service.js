"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CensusService = exports.EstadoVoto = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
var EstadoVoto;
(function (EstadoVoto) {
    EstadoVoto["NO_VOTO"] = "NO_VOTO";
    EstadoVoto["VOTANDO"] = "VOTANDO";
    EstadoVoto["GUARDANDO_VOTO"] = "GUARDANDO_VOTO";
    EstadoVoto["VOTO"] = "VOTO";
})(EstadoVoto || (exports.EstadoVoto = EstadoVoto = {}));
let CensusService = class CensusService {
    padronElectoral = new Map();
    constructor() {
        this.inicializarPadronMock();
    }
    inicializarPadronMock() {
        const ciudadanos = [
            { cedula: '1500958069', nombres: 'ISSAC DE LA CADENA', recinto: 'EPN - FIEE' },
            { cedula: '1722256492', nombres: 'JUAN PEREZ', recinto: 'COLEGIO MEJIA' },
            { cedula: '0104992564', nombres: 'MARIA LOPEZ', recinto: 'UNIVERSIDAD CENTRAL' }
        ];
        ciudadanos.forEach(c => {
            this.padronElectoral.set(c.cedula, {
                ...c,
                estadoVoto: EstadoVoto.NO_VOTO
            });
        });
        console.log(`[CENSUS SERVICE] Padrón inicializado con ${ciudadanos.length} ciudadanos.`);
    }
    async obtenerEstadoVoto(cedula) {
        const ciudadano = this.padronElectoral.get(cedula);
        if (!ciudadano) {
            throw new microservices_1.RpcException({
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
    async verificarEstadoVoto(cedula) {
        console.log('[CENSUS SERVICE] Verificando estado de:', cedula);
        const ciudadano = this.padronElectoral.get(cedula);
        if (!ciudadano) {
            throw new microservices_1.RpcException({
                success: false,
                message: 'Ciudadano no empadronado o no existe.',
                statusCode: 404
            });
        }
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
    async actualizarEstadoVoto(cedula, nuevoEstado) {
        console.log(`[CENSUS SERVICE] Actualizando estado de ${cedula} a ${nuevoEstado}`);
        const ciudadano = this.padronElectoral.get(cedula);
        if (!ciudadano) {
            throw new microservices_1.RpcException({
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
    async iniciarVotacion(cedula) {
        const ciudadano = this.padronElectoral.get(cedula);
        if (!ciudadano) {
            throw new microservices_1.RpcException({
                success: false,
                message: 'Ciudadano no encontrado',
                statusCode: 404
            });
        }
        if (ciudadano.estadoVoto !== EstadoVoto.NO_VOTO) {
            throw new microservices_1.RpcException({
                success: false,
                message: `No puede iniciar votación. Estado actual: ${ciudadano.estadoVoto}`,
                statusCode: 400
            });
        }
        return this.actualizarEstadoVoto(cedula, EstadoVoto.VOTANDO);
    }
    async guardarVoto(cedula) {
        const ciudadano = this.padronElectoral.get(cedula);
        if (!ciudadano) {
            throw new microservices_1.RpcException({
                success: false,
                message: 'Ciudadano no encontrado',
                statusCode: 404
            });
        }
        if (ciudadano.estadoVoto !== EstadoVoto.VOTANDO) {
            throw new microservices_1.RpcException({
                success: false,
                message: `No puede guardar voto. Estado actual: ${ciudadano.estadoVoto}`,
                statusCode: 400
            });
        }
        return this.actualizarEstadoVoto(cedula, EstadoVoto.GUARDANDO_VOTO);
    }
    async confirmarVoto(cedula) {
        const ciudadano = this.padronElectoral.get(cedula);
        if (!ciudadano) {
            throw new microservices_1.RpcException({
                success: false,
                message: 'Ciudadano no encontrado',
                statusCode: 404
            });
        }
        if (ciudadano.estadoVoto !== EstadoVoto.GUARDANDO_VOTO) {
            throw new microservices_1.RpcException({
                success: false,
                message: `No puede confirmar voto. Estado actual: ${ciudadano.estadoVoto}`,
                statusCode: 400
            });
        }
        return this.actualizarEstadoVoto(cedula, EstadoVoto.VOTO);
    }
    async registrarVotoRealizado(cedula) {
        console.log('[CENSUS SERVICE] Registrando voto para:', cedula);
        return this.actualizarEstadoVoto(cedula, EstadoVoto.VOTO);
    }
    healthCheck() {
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
};
exports.CensusService = CensusService;
exports.CensusService = CensusService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CensusService);
//# sourceMappingURL=census.service.js.map