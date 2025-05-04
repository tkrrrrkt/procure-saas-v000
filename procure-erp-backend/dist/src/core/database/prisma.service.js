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
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = class PrismaService extends client_1.PrismaClient {
    constructor() {
        super({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
        });
        this.useMockDb = process.env.USE_MOCK_DB === 'true';
        console.log(`PrismaService: モックDBの使用: ${this.useMockDb}`);
    }
    async onModuleInit() {
        if (!this.useMockDb) {
            try {
                await this.$connect();
                console.log('PrismaService: データベース接続が確立されました');
            }
            catch (error) {
                console.error('PrismaService: データベース接続エラー:', error);
                console.log('PrismaService: モックデータを使用します');
                this.useMockDb = true;
            }
        }
        else {
            console.log('PrismaService: モックデータを使用するため、データベース接続をスキップします');
        }
    }
    async onModuleDestroy() {
        if (!this.useMockDb) {
            await this.$disconnect();
            console.log('PrismaService: データベース接続が切断されました');
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map