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
exports.HealthCheckController = void 0;
const common_1 = require("@nestjs/common");
const health_check_service_1 = require("./health-check.service");
const create_health_check_dto_1 = require("./dto/create-health-check.dto");
const update_health_check_dto_1 = require("./dto/update-health-check.dto");
let HealthCheckController = class HealthCheckController {
    constructor(healthCheckService) {
        this.healthCheckService = healthCheckService;
    }
    create(createHealthCheckDto) {
        return this.healthCheckService.create(createHealthCheckDto);
    }
    findAll() {
        return this.healthCheckService.findAll();
    }
    findOne(id) {
        return this.healthCheckService.findOne(+id);
    }
    update(id, updateHealthCheckDto) {
        return this.healthCheckService.update(+id, updateHealthCheckDto);
    }
    remove(id) {
        return this.healthCheckService.remove(+id);
    }
};
exports.HealthCheckController = HealthCheckController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_health_check_dto_1.CreateHealthCheckDto]),
    __metadata("design:returntype", void 0)
], HealthCheckController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthCheckController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HealthCheckController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_health_check_dto_1.UpdateHealthCheckDto]),
    __metadata("design:returntype", void 0)
], HealthCheckController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HealthCheckController.prototype, "remove", null);
exports.HealthCheckController = HealthCheckController = __decorate([
    (0, common_1.Controller)('health-check'),
    __metadata("design:paramtypes", [health_check_service_1.HealthCheckService])
], HealthCheckController);
//# sourceMappingURL=health-check.controller.js.map