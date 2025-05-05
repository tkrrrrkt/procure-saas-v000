// components/ui/form-field.tsx
import React, { ReactNode } from 'react';
import { FieldError } from 'react-hook-form';
import { Label } from '@/components/ui/label';

interface FormFieldProps {
  label: string;
  name: string;
  error?: FieldError | undefined;
  serverErrors?: Record<string, string[]> | null;
  required?: boolean;
  className?: string;
  children: ReactNode;
  description?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  error,
  serverErrors,
  required = false,
  className = '',
  children,
  description,
}) => {
  // クライアント側のバリデーションエラーまたはサーバー側のバリデーションエラーを取得
  const errorMessage = error?.message || (serverErrors && serverErrors[name]?.[0]);
  
  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <Label 
          htmlFor={name} 
          className={`text-sm font-medium ${errorMessage ? 'text-destructive' : ''}`}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>
      
      {description && (
        <p className="text-muted-foreground text-xs mb-2">{description}</p>
      )}
      
      {children}
      
      {errorMessage && (
        <p className="text-destructive text-xs mt-1">{errorMessage}</p>
      )}
    </div>
  );
};