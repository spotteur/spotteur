'use client'

import { Toaster } from 'sonner'

import AppHeader from '@/components/layout/app-header'
import { HeaderProvider } from '@/components/layout/header-context'

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <HeaderProvider>
      <main className="w-full">
        <Toaster richColors closeButton position="top-right" />
        <AppHeader />
        <div className="p-5">{children}</div>
      </main>
    </HeaderProvider>
  )
}
