"use client"

import React from "react"
import ProtectedLayout from "../protected-layout"

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}

