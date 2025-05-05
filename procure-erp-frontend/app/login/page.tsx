"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/stores/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FormField } from "@/components/ui/form-field"
import { useForm } from "@/hooks/use-form"
import { loginSchema, LoginFormValues } from "@/lib/validations/auth"
import { Checkbox } from "@/components/ui/checkbox"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { toast } = useToast()

  // useFormフックでフォーム状態を管理
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting }, 
    watch,
    setValue,
    submitForm,
    serverErrors
  } = useForm(loginSchema, {
    username: "",
    password: "",
    rememberMe: false
  })

  // フォーム送信処理
  const onSubmit = async (data: LoginFormValues) => {
    try {
      // フォーム送信関数を使用して処理を行う
      await submitForm(async (formData) => {
        console.log("ログイン試行:", { username: formData.username, rememberMe: formData.rememberMe })
        console.log("API URL:", process.env.NEXT_PUBLIC_API_URL)
        
        // テスト用の仮の認証処理（本番環境では削除すること）
        if (formData.username === "admin" && formData.password === "password") {
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
        
        // 実際のAPI呼び出し
        const success = await login(formData.username, formData.password, formData.rememberMe)
        
        if (success) {
          toast({
            title: "ログイン成功",
            description: "ダッシュボードにリダイレクトします",
          })
          router.push("/dashboard")
          return success
        } else {
          // 認証失敗
          throw new Error("ユーザー名またはパスワードが正しくありません")
        }
      });
    } catch (err) {
      // エラー処理はuseFormフックで行われますが、
      // 一般的なエラーに対してはここで処理
      console.error("ログインエラー:", err)
      
      toast({
        title: "ログイン失敗",
        description: err instanceof Error ? err.message : "ログイン処理中にエラーが発生しました",
        variant: "destructive",
      })
    }
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
          {/* APIからの一般的なエラーメッセージ表示 */}
          {serverErrors && serverErrors["_error"] && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverErrors["_error"][0]}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* ユーザー名フィールド */}
            <FormField
              label="ユーザー名"
              name="username"
              error={errors.username}
              serverErrors={serverErrors}
              required
            >
              <Input
                id="username"
                {...register("username")}
                placeholder="ユーザー名を入力"
                autoComplete="username"
                aria-invalid={errors.username ? "true" : "false"}
              />
            </FormField>
            
            {/* パスワードフィールド */}
            <FormField
              label="パスワード"
              name="password"
              error={errors.password}
              serverErrors={serverErrors}
              required
            >
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="パスワードを入力"
                autoComplete="current-password"
                aria-invalid={errors.password ? "true" : "false"}
              />
            </FormField>
            
            {/* ログイン状態保持チェックボックス */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={watch("rememberMe")}
                onCheckedChange={(checked) => setValue("rememberMe", checked as boolean)}
              />
              <label 
                htmlFor="rememberMe" 
                className="text-sm font-normal cursor-pointer"
              >
                ログイン状態を保持する
              </label>
            </div>
            
            {/* ログインボタン */}
            <Button 
              type="submit"
              className="w-full mt-6" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "ログイン中..." : "ログイン"}
            </Button>
          </form>
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