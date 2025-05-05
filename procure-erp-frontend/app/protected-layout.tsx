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
  const { user, loading } = useAuth();

  /* ① ログイン確認 */
  React.useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

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
