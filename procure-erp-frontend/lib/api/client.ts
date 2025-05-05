// src/lib/api/client.ts

import { AxiosError } from "axios";
import { axiosInstance } from "./axios";
import { ApiResponse } from "../types/api";

export class ApiError extends Error {
  code: string;
  details?: any;
  
  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

export const apiClient = {
  async get<T>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const response = await axiosInstance.get<ApiResponse<T>>(url, { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },
  
  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await axiosInstance.post<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },
  
  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await axiosInstance.put<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },
  
  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await axiosInstance.delete<ApiResponse<T>>(url);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },
  
  handleError(error: unknown): never {
    if (error instanceof AxiosError && error.response?.data?.error) {
      const apiError = error.response.data.error;
      throw new ApiError(
        apiError.code || 'UNKNOWN_ERROR',
        apiError.message || '予期せぬエラーが発生しました',
        apiError.details
      );
    }
    
    if (error instanceof Error) {
      throw new ApiError('UNKNOWN_ERROR', error.message);
    }
    
    throw new ApiError('UNKNOWN_ERROR', '予期せぬエラーが発生しました');
  }
};