"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { THEME_DARK, THEME_LIGHT } from "@/constants/app"

export default function ThemeTrigger() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      variant="outline"
      onClick={() =>
        setTheme(resolvedTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK)
      }
    >
      {resolvedTheme === THEME_DARK ? (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      )}
    </Button>
  )
}
