"use client"

import React from "react"
import ProtectedLayout from "../protected-layout"

export default function OrganizationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}

