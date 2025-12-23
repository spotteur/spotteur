'use client'

import { useEffect, useState } from 'react'

import UserTableComponent from '@/components/table/users/UserTableComponent'
import { users } from '@/db/schema'
import { selectUsers } from '@/lib/query/users/select'

export default function MockPage() {
  const [data, setData] = useState<(typeof users.$inferSelect)[]>()

  useEffect(() => {
    const process = async () => {
      const result = await selectUsers()

      setData(result)
    }
    process()
  }, [])

  if (!data) return <></>
  return <UserTableComponent data={data} />
}
