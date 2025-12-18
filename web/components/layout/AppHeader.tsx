import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function AppHeader() {
  return (
    <div className="header">
      <div className="sidebar-trigger">
        <SidebarTrigger />
        <Separator orientation="vertical" />
      </div>
    </div>
  );
}
