import { AuthView } from '@daveyplate/better-auth-ui'
import { authViewPaths } from '@daveyplate/better-auth-ui/server'

import { Toaster } from '@/components/ui/sonner'

export const dynamicParams = false

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }))
}

export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params

  return (
    <main className="container flex grow flex-col items-center justify-center self-center py-4 md:py-6">
      <Toaster richColors closeButton position="top-right" />
      <AuthView
        path={path}
        classNames={{
          form: {
            forgotPasswordLink: 'text-small pl-5',
          },
        }}
      />
    </main>
  )
}
