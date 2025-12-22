"use client"

import AppHeader from "@/components/layout/AppHeader"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <AppHeader />
          <div className="p-5">{children}</div>
        </main>
      </SidebarProvider>
    </ThemeProvider>
  )
}
