import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { LoginDto, TokenResponseDto } from './dto/auth.dto';
import { RefreshTokenResponseDto } from './dto/refresh-token.dto';
export declare class AuthService {
    private readonly jwtService;
    private readonly prismaService;
    private useMockDb;
    constructor(jwtService: JwtService, prismaService: PrismaService);
    validateUser(username: string, password: string): Promise<any>;
    login(loginDto: LoginDto): Promise<TokenResponseDto>;
    refreshToken(token: string): Promise<RefreshTokenResponseDto>;
}
