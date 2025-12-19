import ThemeTrigger from "@/components/theme/theme-trigger";
import { ThemeProvider } from "@/components/theme/theme-provider";

export default function AuthLayout({
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
      <div className="auth-page w-full h-screen ">
        <div className="theme-trigger absolute right-5 top-5">
          <ThemeTrigger />
        </div>
        <div className="min-h-screen flex flex-col items-center justify-center gap-3">
          <div className="header">
            <h1 className="text-xl font-semibold">Spotteur</h1>
          </div>
          <div className="auth-content w-1/5">{children}</div>
        </div>
      </div>
    </ThemeProvider>
  );
}
