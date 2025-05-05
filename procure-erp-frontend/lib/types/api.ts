// src/lib/types/api.ts

export interface ApiResponse<T> {
    status: 'success' | 'error';
    data?: T;
    error?: {
      code: string;
      message: string;
      details?: any;
    };
    meta?: {
      total?: number;
      page?: number;
      limit?: number;
    };
  }
  
  export interface User {
    id: string;
    username: string;
    role: string;
  }
  
  // 他の共通インターフェース...