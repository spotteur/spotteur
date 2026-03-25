'use client'

import type { ReactInboxAppearance, Subscriber } from '@novu/nextjs'
import { Inbox, InboxContent } from '@novu/nextjs'
import { useCounts } from '@novu/react'
import { inboxDarkTheme } from '@novu/react/themes'
import { Bell } from 'lucide-react'
import { motion } from 'motion/react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { THEME_DARK } from '@/constants/app'
import { authClient } from '@/lib/auth-client'
import { getPublicEnv } from '@/lib/public-env'

const MotionBellIcon = motion.create(Bell)

function BellIcon() {
  const { counts, refetch } = useCounts({
    filters: [{ read: false }],
  })

  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 2000)

    return () => clearInterval(interval)
  }, [refetch])

  const unreadCount = counts?.[0]?.count ?? 0

  const animation =
    unreadCount > 0
      ? {
          rotate: [0, -15, 15, -15, 15, 0],
          transition: { duration: 0.8, repeat: Infinity, repeatDelay: 0.8 },
        }
      : {}

  return (
    <div className="relative w-fit">
      <MotionBellIcon className="size-4" animate={animation} />
      <Badge className="absolute -top-2.5 -right-2.5 h-4 min-w-4 px-1 tabular-nums">{unreadCount}</Badge>
    </div>
  )
}

export default function NotificationInbox() {
  const [subscriber, setSubscriber] = useState<Subscriber | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const { resolvedTheme } = useTheme()

  const { NOVU_APP_IDENTIFIER, NOVU_BACKEND_URL, NOVU_WS_URL } = getPublicEnv()

  useEffect(() => {
    const fetchSubscriber = async () => {
      try {
        const session = await authClient.getSession()
        if (session.data?.user?.id) {
          setSubscriber({ subscriberId: session.data.user.id, email: session.data.user.email })
        }
      } catch (error) {
        console.error('Failed to fetch subscriber ID:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscriber()
  }, [])

  if (isLoading || !subscriber) {
    return null
  }

  const appearance = {
    baseTheme: resolvedTheme === THEME_DARK ? inboxDarkTheme : undefined,
  } satisfies ReactInboxAppearance

  return (
    <Inbox
      applicationIdentifier={NOVU_APP_IDENTIFIER}
      subscriber={subscriber}
      appearance={appearance}
      backendUrl={NOVU_BACKEND_URL}
      socketUrl={NOVU_WS_URL}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon">
            <BellIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="h-150 w-100 p-0">
          <InboxContent />
        </PopoverContent>
      </Popover>
    </Inbox>
  )
}
