import { type Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import '@/app/globals.css'
import { Providers } from '@/app/providers'
import { PublicEnv } from '@/lib/public-env'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Spotteur',
  description: 'The visual regression tools.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PublicEnv />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
