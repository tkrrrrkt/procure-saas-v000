// /mnt/c/21_procure-saas/procure-erp-frontend/components/mfa-verify.tsx

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/stores/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MfaVerifyForm({ onSuccess }: { onSuccess: () => void }) {
  const [otpCode, setOtpCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [activeTab, setActiveTab] = useState("otp");
  const { verifyMfa, verifyRecoveryCode, loading } = useAuth();
  const { toast } = useToast();

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpCode) {
      toast({
        title: "エラー",
        description: "認証コードを入力してください",
        variant: "destructive",
      });
      return;
    }
    
    const success = await verifyMfa(otpCode);
    
    if (success) {
      toast({
        title: "認証成功",
        description: "二要素認証が完了しました",
      });
      onSuccess();
    } else {
      toast({
        title: "認証失敗",
        description: "無効なコードです。もう一度お試しください",
        variant: "destructive",
      });
    }
  };

  const handleVerifyRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recoveryCode) {
      toast({
        title: "エラー",
        description: "リカバリーコードを入力してください",
        variant: "destructive",
      });
      return;
    }
    
    const success = await verifyRecoveryCode(recoveryCode);
    
    if (success) {
      toast({
        title: "認証成功",
        description: "リカバリーコードによる認証が完了しました",
      });
      onSuccess();
    } else {
      toast({
        title: "認証失敗",
        description: "無効なリカバリーコードです。もう一度お試しください",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 w-full max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">二要素認証</h1>
        <p className="text-muted-foreground">
          セキュリティのため、認証アプリのコードを入力してください
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="otp">認証アプリ</TabsTrigger>
          <TabsTrigger value="recovery">リカバリーコード</TabsTrigger>
        </TabsList>
        
        <TabsContent value="otp" className="space-y-4">
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="otpCode"
                placeholder="6桁のコードを入力"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                autoComplete="one-time-code"
                className="text-center text-lg tracking-widest"
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading || !otpCode}>
              {loading ? "検証中..." : "認証する"}
            </Button>
          </form>
        </TabsContent>
        
        <TabsContent value="recovery" className="space-y-4">
          <form onSubmit={handleVerifyRecovery} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="recoveryCode"
                placeholder="リカバリーコード（例: ABCD-1234-EFGH-5678）"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                className="text-center tracking-wider"
              />
              <p className="text-xs text-muted-foreground">
                認証アプリが使用できない場合は、バックアップとして提供されたリカバリーコードを使用してください。
                一度使用したリカバリーコードは無効になります。
              </p>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading || !recoveryCode}>
              {loading ? "検証中..." : "リカバリーコードを使用"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}