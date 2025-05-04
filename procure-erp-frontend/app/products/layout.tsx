"use client"

import React from "react"
import ProtectedLayout from "../protected-layout"

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}

