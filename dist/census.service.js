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
exports.CensusService = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
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
                yaVoto: false
            });
        });
        console.log(`[CENSUS SERVICE] Padrón inicializado con ${ciudadanos.length} ciudadanos.`);
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
    async registrarVotoRealizado(cedula) {
        console.log('[CENSUS SERVICE] Registrando voto para:', cedula);
        const ciudadano = this.padronElectoral.get(cedula);
        if (!ciudadano) {
            throw new microservices_1.RpcException({
                success: false,
                message: 'Ciudadano no encontrado',
                statusCode: 404
            });
        }
        ciudadano.yaVoto = true;
        this.padronElectoral.set(cedula, ciudadano);
        console.log(`[CENSUS SERVICE] Voto registrado exitosamente para ${cedula}`);
        return {
            success: true,
            message: 'Voto registrado en el padrón electoral.'
        };
    }
    healthCheck() {
        return {
            status: 'ok',
            service: 'census-service',
            totalCiudadanos: this.padronElectoral.size,
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