"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { login } = useAuth()
  const { toast } = useToast()

  const handleLogin = async () => {
    console.log("ログイン処理開始")
    setLoading(true)
    setError(null)

    try {
      console.log("ログイン試行:", { username, password, rememberMe })
      console.log("API URL:", process.env.NEXT_PUBLIC_API_URL)
      
      if (username === "admin" && password === "password") {
        const testUser = {
          id: "1",
          username: "admin",
          role: "ADMIN"
        };
        
        localStorage.setItem("user", JSON.stringify(testUser));
        localStorage.setItem("accessToken", "test-token");
        
        console.log("認証情報を保存しました:", {
          user: localStorage.getItem("user"),
          token: localStorage.getItem("accessToken")
        });
        
        toast({
          title: "ログイン成功",
          description: "ダッシュボードにリダイレクトします",
        });
        
        router.push("/dashboard");
        return true;
      }
      
      const success = await login(username, password, rememberMe)
      console.log("ログイン結果:", success)
      
      if (success) {
        toast({
          title: "ログイン成功",
          description: "ダッシュボードにリダイレクトします",
        })
        router.push("/dashboard")
      } else {
        setError("ユーザー名またはパスワードが正しくありません")
      }
    } catch (err) {
      console.error("ログインエラー:", err)
      setError("ログイン処理中にエラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleLogin()
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">ProcureERP ログイン</CardTitle>
          <CardDescription>
            購買管理システムにログインしてください
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                id="username"
                placeholder="ユーザー名を入力"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="パスワードを入力"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <Label htmlFor="remember" className="text-sm font-normal">
                ログイン状態を保持する
              </Label>
            </div>
            <Button 
              onClick={handleLogin}
              className="w-full mt-6" 
              disabled={loading}
            >
              {loading ? "ログイン中..." : "ログイン"}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            テスト用アカウント: admin / password
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
