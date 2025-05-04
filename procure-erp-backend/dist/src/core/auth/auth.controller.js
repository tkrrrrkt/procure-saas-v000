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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const auth_dto_1 = require("./dto/auth.dto");
const refresh_token_dto_1 = require("./dto/refresh-token.dto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async login(loginDto, response) {
        try {
            console.log('=== ログインリクエスト受信 ===');
            console.log('リクエスト詳細:', {
                username: loginDto.username,
                passwordLength: loginDto.password?.length || 0,
                rememberMe: loginDto.rememberMe
            });
            console.log('リクエストヘッダー:', JSON.stringify(response.req.headers));
            const validationResult = await this.authService.validateUser(loginDto.username, loginDto.password);
            console.log('ユーザー検証結果:', validationResult ? '成功' : '失敗');
            if (validationResult) {
                console.log('検証成功ユーザー情報:', JSON.stringify(validationResult));
            }
            if (!validationResult) {
                console.log('ユーザー検証に失敗しました。ログイン処理を中止します。');
                return {
                    success: false,
                    message: 'ユーザー名またはパスワードが正しくありません',
                    code: 'INVALID_CREDENTIALS',
                    user: null
                };
            }
            const result = await this.authService.login(loginDto);
            console.log('認証結果:', { success: !!result, hasUser: !!result.user });
            response.cookie('token', result.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: loginDto.rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
            });
            console.log('アクセストークンCookie設定完了');
            if (result.refreshToken) {
                response.cookie('refresh_token', result.refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 30 * 24 * 60 * 60 * 1000,
                });
                console.log('リフレッシュトークンCookie設定完了');
            }
            console.log('ログイン成功レスポンス送信');
            return {
                success: true,
                user: result.user
            };
        }
        catch (error) {
            console.error('ログインエラー詳細:', error);
            return {
                success: false,
                message: 'ログインに失敗しました',
                code: 'LOGIN_FAILED',
                user: null
            };
        }
    }
    async refreshToken(refreshTokenDto, response) {
        try {
            const result = await this.authService.refreshToken(refreshTokenDto.refreshToken);
            response.cookie('token', result.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000,
            });
            if (result.refreshToken) {
                response.cookie('refresh_token', result.refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 30 * 24 * 60 * 60 * 1000,
                });
            }
            return {
                success: true,
                user: result.user
            };
        }
        catch (error) {
            console.error('Token refresh error:', error);
            return {
                success: false,
                message: 'トークンの更新に失敗しました',
                code: 'TOKEN_REFRESH_FAILED',
                user: null
            };
        }
    }
    async logout(response) {
        response.clearCookie('token');
        response.clearCookie('refresh_token');
        return {
            success: true,
            message: 'ログアウトしました'
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshTokenDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map