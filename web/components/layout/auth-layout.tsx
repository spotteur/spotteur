import ThemeTrigger from '@/components/theme-trigger'

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="auth-page h-screen w-full">
      <div className="theme-trigger absolute top-5 right-5">
        <ThemeTrigger />
      </div>
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <div className="header">
          <h1 className="text-xl font-semibold">Spotteur</h1>
        </div>
        <div className="auth-content lg:w-1/4">{children}</div>
      </div>
    </div>
  )
}
