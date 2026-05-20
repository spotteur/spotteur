'use client'

import {
  ChangeEmailCard,
  ChangePasswordCard,
  DeleteAccountCard,
  SessionsCard,
  UpdateNameCard,
} from '@daveyplate/better-auth-ui'
import { useEffect, useMemo, useState } from 'react'

import { useHeaderBreadcrumbs, useHeaderNavigations } from '@/components/layout/header-context'
import { defaultMenu } from '@/constants/app'
import { authClient } from '@/lib/auth-client'
import { type NavigationType } from '@/types/app'

export default function SettingsPage() {
  const [itemPerPage, setItemPerPage] = useState<number>()

  useEffect(() => {
    const process = async () => {
      const result = await authClient.getSession()
      const data = result.data

      if (data) {
        setItemPerPage(data.user.itemPerPage)
      }
    }
    process()
  }, [])

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
