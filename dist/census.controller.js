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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CensusController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const census_service_1 = require("./census.service");
const census_dto_1 = require("./dto/census.dto");
let CensusController = class CensusController {
    censusService;
    constructor(censusService) {
        this.censusService = censusService;
    }
    async verificarEstado(data) {
        console.log('[CENSUS CONTROLLER] Mensaje recibido: census.check-status');
        return this.censusService.verificarEstadoVoto(data.cedula);
    }
    async registrarVoto(data) {
        console.log('[CENSUS CONTROLLER] Mensaje recibido: census.register-vote');
        return this.censusService.registrarVotoRealizado(data.cedula);
    }
    healthCheck() {
        return this.censusService.healthCheck();
    }
};
exports.CensusController = CensusController;
__decorate([
    (0, microservices_1.MessagePattern)('census.check-status'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [census_dto_1.CheckStatusDto]),
    __metadata("design:returntype", Promise)
], CensusController.prototype, "verificarEstado", null);
__decorate([
    (0, microservices_1.MessagePattern)('census.register-vote'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [census_dto_1.CheckStatusDto]),
    __metadata("design:returntype", Promise)
], CensusController.prototype, "registrarVoto", null);
__decorate([
    (0, microservices_1.MessagePattern)('census.health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CensusController.prototype, "healthCheck", null);
exports.CensusController = CensusController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [census_service_1.CensusService])
], CensusController);
//# sourceMappingURL=census.controller.js.map