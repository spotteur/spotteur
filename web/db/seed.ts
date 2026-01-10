import { faker } from '@faker-js/faker'

import db from './drizzle'
import { users } from './schema'

async function main() {
  const randomUsers = Array.from({ length: 20 }).map(() => ({
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
  }))

  await db.insert(users).values(randomUsers)

  console.log('✅ Seed selesai')
  process.exit(0)
}

main().catch(console.error)
