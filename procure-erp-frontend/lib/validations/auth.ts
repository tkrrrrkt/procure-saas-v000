// lib/validations/auth.ts
import * as z from 'zod';
import { requiredString, minLength, passwordSchema } from './common';

// ログインフォームのバリデーションスキーマ
export const loginSchema = z.object({
  username: requiredString('ユーザー名')
    .min(3, { message: 'ユーザー名は3文字以上で入力してください' })
    .max(50, { message: 'ユーザー名は50文字以内で入力してください' }),
  password: requiredString('パスワード')
    .min(4, { message: 'パスワードは4文字以上で入力してください' }),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ユーザー登録フォームのバリデーションスキーマ
export const registerSchema = z.object({
  username: requiredString('ユーザー名')
    .min(3, { message: 'ユーザー名は3文字以上で入力してください' })
    .max(50, { message: 'ユーザー名は50文字以内で入力してください' }),
  email: requiredString('メールアドレス')
    .email({ message: 'メールアドレスの形式が正しくありません' }),
  password: passwordSchema,
  confirmPassword: requiredString('確認用パスワード'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードと確認用パスワードが一致しません',
  path: ['confirmPassword'],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

// パスワードリセットリクエストフォームのバリデーションスキーマ
export const forgotPasswordSchema = z.object({
  email: requiredString('メールアドレス')
    .email({ message: 'メールアドレスの形式が正しくありません' }),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

// パスワードリセットフォームのバリデーションスキーマ
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: requiredString('確認用パスワード'),
  token: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードと確認用パスワードが一致しません',
  path: ['confirmPassword'],
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;