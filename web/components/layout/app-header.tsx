import { UserButton } from '@daveyplate/better-auth-ui'

import { AppNavigation } from '@/components/layout/app-navigation'
import { useHeaderContext } from '@/components/layout/header-context'
import NotificationInbox from '@/components/notification-inbox'
import ThemeTrigger from '@/components/theme-trigger'
import { Breadcrumb, BreadcrumbList } from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

export default function AppHeader() {
  const { breadcrumbs, isLoading, navigations } = useHeaderContext()

  return (
    <div className="header bg-background/80 w-full border-b supports-backdrop-filter:backdrop-blur">
      <div className="header-content flex flex-col gap-2 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-foreground text-lg">Spotteur</span>
          <Separator orientation="vertical" className="data-[orientation=vertical]:h-6" />
          {isLoading && <Skeleton className="h-6 w-48" />}
          {!isLoading && breadcrumbs && (
            <Breadcrumb>
              <BreadcrumbList>{breadcrumbs}</BreadcrumbList>
            </Breadcrumb>
          )}
        </div>
        <div className="header-right flex gap-2">
          <NotificationInbox />
          <ThemeTrigger />
          <UserButton size="icon" classNames={{ skeleton: 'size-9', base: 'size-9' }} />
        </div>
      </div>
      <div>
        <div className="px-5">{isLoading && <Skeleton className="h-6 w-48" />}</div>
        {!isLoading && navigations && <AppNavigation navigations={navigations} />}
      </div>
    </div>
  )
}
