// hooks/use-form.ts
import { useForm as useReactHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { ApiError } from '@/lib/api/client';
import { getValidationErrors } from '@/lib/utils/error-handler';

// 汎用フォームフック
export function useForm<T extends z.ZodType<any, any>>(
  schema: T,
  defaultValues?: Partial<z.infer<T>>
) {
  const [serverErrors, setServerErrors] = useState<Record<string, string[]> | null>(null);
  
  const form = useReactHookForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  // サーバーサイドエラーを処理する関数
  const handleApiError = (error: unknown) => {
    const validationErrors = getValidationErrors(error);
    if (validationErrors) {
      // サーバーサイドのバリデーションエラーをフォームに反映
      setServerErrors(validationErrors);
      
      // サーバーから返されたエラーをフォームのエラーに設定
      Object.keys(validationErrors).forEach(field => {
        if (field in form.formState.errors) return; // クライアント側ですでにエラーがある場合はスキップ
        
        // フォームフィールドにエラーを設定
        form.setError(field as any, { 
          type: 'server', 
          message: validationErrors[field][0] 
        });
      });
    } else if (error instanceof ApiError) {
      // APIエラーだがバリデーションエラーではない場合
      throw error;
    } else {
      // 予期せぬエラーの場合
      throw new Error('フォーム送信中に予期せぬエラーが発生しました');
    }
  };

  // フォームサブミット用のラッパー関数
  const submitForm = async (
    submitFn: (data: z.infer<T>) => Promise<any>
  ) => {
    // サーバーエラーをリセット
    setServerErrors(null);
    
    try {
      return await form.handleSubmit(async (data) => {
        try {
          return await submitFn(data);
        } catch (error) {
          handleApiError(error);
          throw error;
        }
      })();
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    }
  };

  return {
    ...form,
    submitForm,
    serverErrors
  };
}