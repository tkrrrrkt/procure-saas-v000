"use client"

import React from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import Header from "@/components/header"
import Sidebar from "@/components/sidebar"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      toast({
        title: "認証が必要です",
        description: "ログインページにリダイレクトします",
        variant: "destructive",
      })
      router.push("/login")
    }
  }, [isAuthenticated, loading, router, toast])

  if (loading) {
    return <div className="flex items-center justify-center h-screen">読み込み中...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4">{children}</main>
      </div>
    </div>
  )
}
