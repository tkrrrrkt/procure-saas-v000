// app/layout.tsx
import type React from 'react'
import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
// ✅ AuthProvider は不要になったので import を削除

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ProcureERP - Modern Purchasing Management',
  description: 'Enterprise purchasing management system',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {/* テーマ切り替えだけをグローバルに提供 */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {/* Zustand ストアは React Tree のどこでも直接 useAuth() で読めるので
              追加の Provider は不要 */}
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
