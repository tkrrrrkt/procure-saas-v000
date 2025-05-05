// lib/validations/common.ts
import * as z from 'zod';

// 基本バリデーションルール
export const requiredString = (fieldName: string) => 
  z.string().min(1, { message: `${fieldName}は必須です` });

export const maxLength = (fieldName: string, max: number) => 
  z.string().max(max, { message: `${fieldName}は${max}文字以内で入力してください` });

export const minLength = (fieldName: string, min: number) => 
  z.string().min(min, { message: `${fieldName}は${min}文字以上で入力してください` });

export const emailSchema = 
  z.string().email({ message: 'メールアドレスの形式が正しくありません' });

export const alphanumeric = (fieldName: string) =>
  z.string().regex(/^[a-zA-Z0-9]+$/, { message: `${fieldName}は英数字のみ使用できます` });

export const numericString = (fieldName: string) =>
  z.string().regex(/^[0-9]+$/, { message: `${fieldName}は数値で入力してください` });

export const phoneNumber = z.string()
  .regex(/^[0-9]{2,4}-?[0-9]{2,4}-?[0-9]{3,4}$/, { 
    message: '電話番号の形式が正しくありません (例: 03-1234-5678)' 
  });

// パスワード検証（英数字含む8文字以上）
export const passwordSchema = 
  z.string()
    .min(8, { message: 'パスワードは8文字以上で入力してください' })
    .regex(/[A-Z]/, { message: 'パスワードは少なくとも1つの大文字を含める必要があります' })
    .regex(/[a-z]/, { message: 'パスワードは少なくとも1つの小文字を含める必要があります' })
    .regex(/[0-9]/, { message: 'パスワードは少なくとも1つの数字を含める必要があります' });

// パスワード確認フィールド用
export const confirmPasswordSchema = (passwordField: string) => 
  z.string().min(1, { message: '確認用パスワードは必須です' })
    .refine(data => data === passwordField, {
      message: 'パスワードと確認用パスワードが一致しません'
    });