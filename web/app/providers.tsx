'use client'

import { ProgressProvider } from '@bprogress/next/app'
import { AuthUIProvider } from '@daveyplate/better-auth-ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type Route } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ThemeProvider } from 'next-themes'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { useState } from 'react'
import { type ReactNode } from 'react'

import { TooltipProvider } from '@/components/ui/tooltip'
import { DISABLE_REGISTRATION } from '@/constants/env'
import { authClient } from '@/lib/auth-client'

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [queryClient] = useState(() => new QueryClient())

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ProgressProvider height="4px" color="currentColor" options={{ showSpinner: false }} shallowRouting>
        <NuqsAdapter>
          <QueryClientProvider client={queryClient}>
            <AuthUIProvider
              authClient={authClient}
              navigate={(href) => router.push(href as Route<string>)}
              replace={(href) => router.replace(href as Route<string>)}
              onSessionChange={() => {
                // Clear router cache (protected routes)
                router.refresh()
              }}
              Link={({ href, className, children }) => (
                <Link href={href as Route<string>} className={className}>
                  {children}
                </Link>
              )}
              redirectTo="/projects"
              signUp={!DISABLE_REGISTRATION}
              additionalFields={{
                itemPerPage: {
                  label: 'Items per page',
                  placeholder: 'Items per page',
                  description: 'The number x item per page',
                  required: false,
                  type: 'number',
                },
              }}
              account={{
                fields: ['itemPerPage'],
              }}
            >
              <TooltipProvider>{children}</TooltipProvider>
            </AuthUIProvider>
          </QueryClientProvider>
        </NuqsAdapter>
      </ProgressProvider>
    </ThemeProvider>
  )
}
