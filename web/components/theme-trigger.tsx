'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { THEME_DARK, THEME_LIGHT } from '@/constants/app'

export default function ThemeTrigger() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK)}
    >
      {resolvedTheme === THEME_DARK ? <Moon /> : <Sun />}
    </Button>
  )
}
