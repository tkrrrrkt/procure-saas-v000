// /mnt/c/21_procure-saas/procure-erp-frontend/components/mfa-setup.tsx

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { mfaApi } from "@/lib/api/mfa";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function MfaSetupForm({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<"setup" | "verify" | "backup">("setup");
  const [isLoading, setIsLoading] = useState(false);
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeDataUrl: string;
    recoveryCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const { toast } = useToast();

  const handleSetup = async () => {
    try {
      setIsLoading(true);
      const result = await mfaApi.setupMfa();
      setSetupData(result);
      setStep("verify");
    } catch (error) {
      toast({
        title: "設定エラー",
        description: "MFA設定の初期化に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!setupData) return;
    
    try {
      setIsLoading(true);
      const result = await mfaApi.enableMfa(setupData.secret, verificationCode);
      
      if (result.enabled) {
        // リカバリーコードを更新
        setSetupData({
          ...setupData,
          recoveryCodes: result.recoveryCodes,
        });
        
        setStep("backup");
        toast({
          title: "設定成功",
          description: "二要素認証が有効化されました",
        });
      }
    } catch (error) {
      toast({
        title: "検証エラー",
        description: "コードの検証に失敗しました。正しいコードを入力してください",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    // リカバリーコードを表示済みかチェック
    if (!showRecoveryCodes) {
      toast({
        title: "注意",
        description: "続行する前にリカバリーコードを保存してください",
        variant: "destructive",
      });
      return;
    }
    
    onComplete();
  };

  const copyRecoveryCodes = () => {
    if (!setupData) return;
    
    const codesText = setupData.recoveryCodes.join("\n");
    navigator.clipboard.writeText(codesText);
    
    toast({
      title: "コピー完了",
      description: "リカバリーコードがクリップボードにコピーされました",
    });
    
    setShowRecoveryCodes(true);
  };

  return (
    <div className="space-y-6 w-full max-w-md mx-auto">
      {step === "setup" && (
        <>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">二要素認証の設定</h1>
            <p className="text-muted-foreground">
              アカウントのセキュリティを強化するため、二要素認証を設定してください
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <h3 className="font-medium">二要素認証とは？</h3>
              <p className="text-sm text-muted-foreground">
                二要素認証は、パスワードに加えて、スマートフォンの認証アプリから生成されるコードを
                使用してログインする方法です。これにより、仮にパスワードが漏洩しても、
                アカウントを保護することができます。
              </p>
            </div>
            
            <Button
              onClick={handleSetup}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "準備中..." : "設定を開始"}
            </Button>
          </div>
        </>
      )}

      {step === "verify" && setupData && (
        <>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">認証アプリの設定</h1>
            <p className="text-muted-foreground">
              以下のQRコードをスキャンして、認証アプリに追加してください
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                <img
                  src={setupData.qrCodeDataUrl}
                  alt="MFA QR Code"
                  width={200}
                  height={200}
                />
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                QRコードをスキャンできない場合は、以下のコードを手動で入力してください：
              </p>
              <code className="bg-muted px-2 py-1 rounded text-sm">
                {setupData.secret}
              </code>
            </div>
            
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="verificationCode" className="text-sm font-medium">
                  認証コードを入力
                </label>
                <Input
                  id="verificationCode"
                  placeholder="6桁のコード"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || verificationCode.length !== 6}
              >
                {isLoading ? "検証中..." : "検証して有効化"}
              </Button>
            </form>
          </div>
        </>
      )}

      {step === "backup" && setupData && (
        <>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">リカバリーコード</h1>
            <p className="text-muted-foreground">
              認証アプリが使用できなくなった場合に備えて、以下のリカバリーコードを安全な場所に保存してください
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              {showRecoveryCodes ? (
                <div className="grid grid-cols-2 gap-2">
                  {setupData.recoveryCodes.map((code, index) => (
                    <div key={index} className="font-mono text-xs">
                      {code}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm font-medium mb-2">
                    セキュリティのため、リカバリーコードは隠されています
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowRecoveryCodes(true)}
                  >
                    リカバリーコードを表示
                  </Button>
                </div>
              )}
            </div>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={copyRecoveryCodes}
            >
              すべてのコードをコピー
            </Button>
            
            <Button
              onClick={handleComplete}
              className="w-full"
            >
              完了
            </Button>
          </div>
        </>
      )}
      
      <Dialog open={step === "backup" && !showRecoveryCodes} onOpenChange={(open) => { if (!open) setShowRecoveryCodes(true) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>注意</DialogTitle>
            <DialogDescription>
              リカバリーコードは、認証アプリが使用できなくなった場合のバックアップとして非常に重要です。
              リカバリーコードを保存せずに進むと、アカウントにアクセスできなくなる可能性があります。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowRecoveryCodes(true)}>
              リカバリーコードを表示
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}