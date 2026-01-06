'use client'

import { Toaster } from 'sonner'

import AppHeader from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { HeaderProvider } from '@/components/layout/header-context'
import { SidebarProvider } from '@/components/ui/sidebar'

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider>
      <HeaderProvider>
        <AppSidebar />
        <main className="w-full">
          <Toaster richColors closeButton position="top-right" />
          <AppHeader />
          <div className="p-5">{children}</div>
        </main>
      </HeaderProvider>
    </SidebarProvider>
  )
}
