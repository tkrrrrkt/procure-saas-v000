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
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
const mock_prisma_service_1 = require("./mock/mock-prisma.service");
const useMockDb = process.env.USE_MOCK_DB === 'true';
console.log(`DatabaseModule: モックDBの使用: ${useMockDb}`);
const prismaProvider = {
    provide: prisma_service_1.PrismaService,
    useClass: useMockDb ? mock_prisma_service_1.MockPrismaService : prisma_service_1.PrismaService,
};
let DatabaseModule = class DatabaseModule {
    constructor(prismaService) {
        this.prismaService = prismaService;
        console.log(`DatabaseModule: ${useMockDb ? 'MockPrismaService' : 'PrismaService'}が初期化されました`);
    }
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            prismaProvider,
            {
                provide: 'PRISMA_SERVICE',
                useExisting: prisma_service_1.PrismaService,
            },
        ],
        exports: [
            prisma_service_1.PrismaService,
            'PRISMA_SERVICE',
        ],
    }),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DatabaseModule);
//# sourceMappingURL=database.module.js.map