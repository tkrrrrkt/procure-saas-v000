import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto, response: Response): Promise<{
        success: boolean;
        message: string;
        code: string;
        user: any;
    } | {
        success: boolean;
        user: {
            id: string;
            username: string;
            role: string;
        };
        message?: undefined;
        code?: undefined;
    }>;
    refreshToken(refreshTokenDto: RefreshTokenDto, response: Response): Promise<{
        success: boolean;
        user: {
            id: string;
            username: string;
            role: string;
        };
        message?: undefined;
        code?: undefined;
    } | {
        success: boolean;
        message: string;
        code: string;
        user: any;
    }>;
    logout(response: Response): Promise<{
        success: boolean;
        message: string;
    }>;
}
