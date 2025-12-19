"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import AppHeader from "@/components/layout/AppHeader";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { AppSkeleton } from "@/components/theme/skeleton";
import AuthLayout from "@/components/layout/AuthLayout";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggedIn, setLoggedIn] = useState<boolean>(true);
  const router = useRouter();
  useEffect(() => {
    const checkSession = async () => {
      const result = await authClient.getSession();
      const session = result.data?.session;

      if (session) {
        setLoggedIn(true);
        router.replace("/");
      } else {
        setLoggedIn(false);
        router.replace("/auth/signin");
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  if (loading) return <AppSkeleton />;

  if (!isLoggedIn) {
    return <AuthLayout>{children}</AuthLayout>;
  }
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
          <div>{children}</div>
        </main>
      </SidebarProvider>
    </ThemeProvider>
  );
}
