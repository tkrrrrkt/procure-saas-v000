// /mnt/c/21_procure-saas/procure-erp-frontend/app/settings/security/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { mfaApi } from "@/lib/api/mfa";
import { useToast } from "@/components/ui/use-toast";
import MfaSetupForm from "@/components/mfa-setup";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function SecuritySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [lastUsed, setLastUsed] = useState<string | null>(null);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMfaStatus = async () => {
      try {
        const status = await mfaApi.getMfaStatus();
        setMfaEnabled(status.enabled);
        setLastUsed(status.lastUsed);
      } catch (error) {
        console.error("MFA状態の取得に失敗しました:", error);
        toast({
          title: "エラー",
          description: "MFA設定の取得に失敗しました",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMfaStatus();
  }, [toast]);

  const handleMfaToggle = () => {
    if (mfaEnabled) {
      setShowDisableDialog(true);
    } else {
      setShowSetupDialog(true);
    }
  };

  const handleDisableMfa = async () => {
    try {
      setLoading(true);
      const result = await mfaApi.disableMfa();
      
      if (result.disabled) {
        setMfaEnabled(false);
        setLastUsed(null);
        toast({
          title: "MFA無効化",
          description: "二要素認証が無効化されました",
        });
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "MFAの無効化に失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowDisableDialog(false);
    }
  };

  const handleSetupComplete = () => {
    setShowSetupDialog(false);
    setMfaEnabled(true);
    setLastUsed(new Date().toISOString());
    toast({
      title: "MFA有効化",
      description: "二要素認証が有効化されました",
    });
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">セキュリティ設定</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>二要素認証（2FA）</CardTitle>
          <CardDescription>
            二要素認証を有効にすると、ログイン時にモバイル認証アプリからコードの入力が必要になります。
            これにより、パスワードが漏洩した場合でもアカウントを保護できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>二要素認証</Label>
              {mfaEnabled && lastUsed && (
                <p className="text-sm text-muted-foreground">
                  最終使用: {new Date(lastUsed).toLocaleString()}
                </p>
              )}
            </div>
            <Switch
              checked={mfaEnabled}
              onCheckedChange={handleMfaToggle}
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {mfaEnabled ? (
            <Button
              variant="outline"
              onClick={() => setShowDisableDialog(true)}
              disabled={loading}
            >
              二要素認証を無効化
            </Button>
          ) : (
            <Button
              onClick={() => setShowSetupDialog(true)}
              disabled={loading}
            >
              二要素認証を設定
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* MFA設定ダイアログ */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-md">
          <MfaSetupForm onComplete={handleSetupComplete} />
        </DialogContent>
      </Dialog>
      
      {/* MFA無効化確認ダイアログ */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>二要素認証の無効化</DialogTitle>
            <DialogDescription>
              二要素認証を無効化すると、アカウントのセキュリティが低下します。
              本当に無効化しますか？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDisableDialog(false)}
              disabled={loading}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisableMfa}
              disabled={loading}
            >
              {loading ? "処理中..." : "無効化する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}