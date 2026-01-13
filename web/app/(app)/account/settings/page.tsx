'use client'

import {
  ChangeEmailCard,
  ChangePasswordCard,
  DeleteAccountCard,
  SessionsCard,
  UpdateAvatarCard,
  UpdateFieldCard,
  UpdateNameCard,
} from '@daveyplate/better-auth-ui'
import { useEffect, useMemo, useState } from 'react'

import { useHeaderNavigations } from '@/components/layout/header-context'
import { defaultMenu } from '@/constants/app'
import { authClient } from '@/lib/auth-client'
import { NavigationType } from '@/lib/type/app'

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

  const defaultNavigations = useMemo<NavigationType[]>(() => defaultMenu, [])
  useHeaderNavigations(defaultNavigations)

  return (
    <div className="flex flex-col gap-6">
      <UpdateAvatarCard />
      <UpdateNameCard />
      <ChangeEmailCard />
      <ChangePasswordCard />
      <SessionsCard />
      <UpdateFieldCard name="itemPerPage" label="Items per page" type="number" value={itemPerPage} />
      <DeleteAccountCard />
    </div>
  )
}
