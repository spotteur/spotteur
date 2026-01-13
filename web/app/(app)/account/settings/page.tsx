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
import { useEffect, useState } from 'react'

import { useHeaderNavigations } from '@/components/layout/header-context'
import { authClient } from '@/lib/auth-client'

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

  useHeaderNavigations()

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
