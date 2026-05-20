'use client'

import {
  ChangeEmailCard,
  ChangePasswordCard,
  DeleteAccountCard,
  SessionsCard,
  UpdateNameCard,
} from '@daveyplate/better-auth-ui'
import { useMemo } from 'react'

import { useHeaderBreadcrumbs, useHeaderNavigations } from '@/components/layout/header-context'
import { defaultMenu } from '@/constants/app'
import { type NavigationType } from '@/types/app'

export default function SettingsPage() {
  const navigations = useMemo<NavigationType[]>(() => defaultMenu(), [])
  useHeaderNavigations(navigations)
  useHeaderBreadcrumbs(null, !navigations)

  return (
    <div className="flex flex-col gap-6">
      <UpdateNameCard />
      <ChangeEmailCard />
      <ChangePasswordCard />
      <SessionsCard />
      <DeleteAccountCard />
    </div>
  )
}
