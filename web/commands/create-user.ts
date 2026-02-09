import { confirm, input, password, select } from '@inquirer/prompts'

import { auth } from '@/lib/auth'
import { logger } from '@/lib/logger'

async function main() {
  const name = await input({
    message: "What is the user's full name?",
    required: true,
  })

  const email = await input({
    message: "What is the user's email address?",
    required: true,
  })

  const userPassword = await password({
    message: "What is the user's password?",
    mask: '*',
  })

  const role: 'admin' | 'user' = await select({
    message: "Select the user's role:",
    choices: [
      { name: 'Admin', value: 'admin' },
      { name: 'User', value: 'user' },
    ],
    default: 'user',
  })

  const shouldCreate = await confirm({
    message: `Create user "${name}" with email "${email}" and role "${role}"?`,
    default: true,
  })
  if (!shouldCreate) {
    logger.info('User creation cancelled')
    process.exit(0)
  }

  await auth.api.createUser({
    body: {
      name,
      email,
      password: userPassword,
      role,
    },
  })

  logger.info('User successfully created')

  process.exit(0)
}

main().catch((error) => {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    return
  }

  logger.error(`Unexpected error: ${error instanceof Error ? error.message : error}`)
  process.exit(1)
})
