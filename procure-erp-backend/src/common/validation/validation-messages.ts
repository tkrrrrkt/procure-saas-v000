// src/common/validation/validation-messages.ts
export const ValidationMessages = {
    required: (field: string) => `${field}は必須です`,
    maxLength: (field: string, max: number) => `${field}は${max}文字以内で入力してください`,
    minLength: (field: string, min: number) => `${field}は${min}文字以上で入力してください`,
    email: () => 'メールアドレスの形式が正しくありません',
    pattern: (field: string) => `${field}の形式が正しくありません`,
    alphanumeric: (field: string) => `${field}は英数字のみ使用できます`,
    date: (field: string) => `${field}は有効な日付ではありません`,
    numeric: (field: string) => `${field}は数値で入力してください`,
    positiveNumber: (field: string) => `${field}は0より大きい値を入力してください`,
    integer: (field: string) => `${field}は整数で入力してください`,
    boolean: (field: string) => `${field}はtrueまたはfalseで指定してください`,
    enum: (field: string, values: string[]) => `${field}は${values.join(', ')}のいずれかを指定してください`,
    uuid: (field: string) => `${field}は有効なUUID形式ではありません`,
    password: () => 'パスワードは少なくとも1つの大文字、小文字、数字を含む8文字以上で入力してください',
    passwordMismatch: () => 'パスワードと確認用パスワードが一致しません',
    objectId: (field: string) => `${field}は有効なID形式ではありません`,
  };