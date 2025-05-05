// src/lib/utils/error-handler.ts

import { ApiError } from '../api/client';

export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return '予期せぬエラーが発生しました';
};

export const isValidationError = (error: unknown): boolean => {
  return error instanceof ApiError && error.code === 'VALIDATION_ERROR';
};

export const getValidationErrors = (error: unknown): Record<string, string[]> | null => {
  if (error instanceof ApiError && error.code === 'VALIDATION_ERROR' && error.details) {
    return error.details;
  }
  
  return null;
};