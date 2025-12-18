import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import AppHeader from "@/components/layout/AppHeader";
import { ThemeProvider } from "@/components/theme/theme-provider";

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
          <div>{children}</div>
        </main>
      </SidebarProvider>
    </ThemeProvider>
  );
}
