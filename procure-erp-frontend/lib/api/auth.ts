import { axiosInstance } from './axios';

export interface LoginResponse {
  success: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  message?: string;
  code?: string;
  user: {
    id: string;
    username: string;
    role: string;
  } | null;
}

export interface RefreshTokenResponse {
  success: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  message?: string;
  code?: string;
  user: {
    id: string;
    username: string;
    role: string;
  } | null;
}

export const login = async (
  username: string,
  password: string,
  rememberMe: boolean
): Promise<LoginResponse> => {
  try {
    const response = await axiosInstance.post("/auth/login", {
      username,
      password,
      rememberMe,
    });
    
    return response.data;
  } catch (error: any) {
    console.error("ログインAPI呼び出しエラー:", error);
    
    if (error.response) {
      return {
        success: false,
        accessToken: null,
        refreshToken: null,
        message: error.response.data.message || "ログインに失敗しました",
        code: error.response.data.code || "UNKNOWN_ERROR",
        user: null,
      };
    }
    
    return {
      success: false,
      accessToken: null,
      refreshToken: null,
      message: "サーバーに接続できませんでした",
      code: "NETWORK_ERROR",
      user: null,
    };
  }
};

export const refreshToken = async (
  refreshTokenValue: string
): Promise<RefreshTokenResponse> => {
  try {
    const response = await axiosInstance.post("/auth/refresh", {
      refreshToken: refreshTokenValue,
    });
    
    return response.data;
  } catch (error: any) {
    console.error("トークンリフレッシュエラー:", error);
    
    return {
      success: false,
      accessToken: null,
      refreshToken: null,
      message: "トークンの更新に失敗しました",
      code: "REFRESH_FAILED",
      user: null,
    };
  }
};

export const logout = async (): Promise<void> => {
  try {
    await axiosInstance.post("/auth/logout");
  } catch (error) {
    console.error("ログアウトエラー:", error);
  }
};

export const checkAuth = async (): Promise<boolean> => {
  try {
    const response = await axiosInstance.get("/auth/check");
    return response.data.authenticated === true;
  } catch (error) {
    console.error("認証チェックエラー:", error);
    return false;
  }
};
