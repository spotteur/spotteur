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

import { authClient } from '@/lib/auth-client'
import { UserType } from '@/lib/types/user'
export default function SettingsPage() {
  const [itemPerPage, setItemPerPage] = useState<number>()
  useEffect(() => {
    const process = async () => {
      const result = await authClient.getSession()
      const data = result.data

      if (data && data.user) {
        const user = data.user as UserType
        setItemPerPage(user.itemPerPage)
      }
    }
    process()
  }, [])
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
