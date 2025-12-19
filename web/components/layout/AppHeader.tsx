import { UserButton } from '@daveyplate/better-auth-ui'

import ThemeTrigger from '@/components/theme/theme-trigger'
import { SidebarTrigger } from '@/components/ui/sidebar'

export default function AppHeader() {
  return (
    <div className="header w-full py-3 border-b">
      <div className="header-content flex justify-between items-center px-5">
        <div className="sidebar-trigger flex gap-2">
          <SidebarTrigger className="border cursor-pointer" />
        </div>
        <div className="header-right flex gap-2">
          <ThemeTrigger />
          <UserButton size="icon" />
        </div>
      </div>
    </div>
  )
}
