// components/Header.tsx
"use client"

import React from "react"
import { Bell, HelpCircle, Search, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/stores/useAuth"  // ← Zustand authStore から

export default function Header() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      {/* ───────────────── Left ───────────────── */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-primary">ProcureERP</h1>
      </div>

      {/* ───────────────── Center （検索） ───────────────── */}
      <div className="hidden flex-1 px-4 md:flex md:max-w-md lg:max-w-lg">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="検索..."
            className="w-full bg-background pl-8 md:w-[300px] lg:w-[400px]"
          />
        </div>
      </div>

      {/* ───────────────── Right ───────────────── */}
      <div className="flex items-center gap-2">
        {/* 通知 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -right-1 -top-1 h-5 w-5 p-0 flex items-center justify-center">
                3
              </Badge>
              <span className="sr-only">通知</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[300px]">
            <DropdownMenuLabel>通知</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* ...通知アイテム */}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ヘルプ */}
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-5 w-5" />
          <span className="sr-only">ヘルプ</span>
        </Button>

        {/* 設定 */}
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
          <span className="sr-only">設定</span>
        </Button>

        {/* プロフィール + ログアウト */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                {user?.username && (
                  <AvatarImage
                    src={`/avatars/${user.username}.png`}
                    alt={user.username}
                  />
                )}
                <AvatarFallback>
                  {user?.username.slice(0, 2).toUpperCase() || "??"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* ユーザー名表示 */}
            <DropdownMenuLabel>
              {user?.username || "Guest"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onSelect={() => router.push("/profile")}>
              プロフィール
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push("/settings")}>
              設定
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {/* ログアウト */}
            <DropdownMenuItem className="cursor-pointer" onSelect={handleLogout}>
              ログアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
