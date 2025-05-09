// app/protected-layout.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/useAuth";

import Header from "@/components/header";
import Sidebar from "@/components/sidebar";

export default function ProtectedLayout({
  children,
}: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, mfaRequired } = useAuth();

  /* ① ログイン確認とMFA確認 */
  React.useEffect(() => {
    if (!loading) {
      console.log('ProtectedLayout - 認証状態:', { user: !!user, mfaRequired });
      
      if (!user) {
        console.log('ユーザーが未認証のため、ログインページにリダイレクト');
        router.replace("/login");
      } else if (mfaRequired) {
        // MFA認証が必要な場合は専用のMFA確認ページにリダイレクト
        console.log('MFA認証が必要なため、MFA確認ページにリダイレクト');
        router.replace("/login?mfa=required");
      } else {
        // 認証済みかつMFA完了状態をチェック
        const hasMfaToken = typeof window !== 'undefined' && !!sessionStorage.getItem('mfaToken');
        console.log('MFAトークン確認:', hasMfaToken ? '存在します' : '存在しません');
        
        // ユーザーにMFAが必要だがトークンがない場合
        if (!hasMfaToken && user.requireMfa) {
          console.log('MFAトークンが見つかりません。MFA確認ページにリダイレクト');
          router.replace("/login?mfa=required");
        }
      }
    }
  }, [loading, user, mfaRequired, router]);

  /* ② スピナー */
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        認証確認中...
      </div>
    );
  }

  /* ③ 認証済みレイアウト */
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/40 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
