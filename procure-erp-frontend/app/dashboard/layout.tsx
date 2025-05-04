"use client"

import React from "react"
import ProtectedLayout from "../protected-layout"
import { metadata } from "./metadata"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}

