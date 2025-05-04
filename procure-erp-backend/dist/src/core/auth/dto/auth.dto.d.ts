export declare class LoginDto {
    username: string;
    password: string;
    rememberMe?: boolean;
}
export interface TokenResponseDto {
    success: boolean;
    accessToken: string | null;
    refreshToken?: string | null;
    message?: string;
    code?: string;
    user: {
        id: string;
        username: string;
        role: string;
    } | null;
}
