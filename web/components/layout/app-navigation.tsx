'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import { useIsMobile } from '@/hooks/use-mobile'
import { NavigationType } from '@/lib/type/app'
import { cn } from '@/lib/utils'

export function AppNavigation({ navigations }: { navigations: NavigationType[] }) {
  const isMobile = useIsMobile()
  const pathname = usePathname()

  return (
    <NavigationMenu viewport={isMobile} className="px-5">
      <NavigationMenuList>
        {navigations &&
          navigations.map((item, key) => (
            <NavigationMenuItem key={key}>
              <NavigationMenuLink asChild className="rounded-none">
                <Link
                  href={item.url}
                  className={cn(
                    'text-muted-foreground',
                    pathname === item.url && 'text-foreground border-primary rounded-none border-b-2',
                  )}
                >
                  {item.label}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
