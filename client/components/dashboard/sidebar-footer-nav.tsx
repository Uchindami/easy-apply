import { useNavigate } from "react-router"
import { Settings, User, LogOut } from "lucide-react"
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"

interface SidebarFooterNavProps {
  // Determines if the given path matches the current active route.
  isActive: (path: string) => boolean
  onLogout: () => void
}

export function SidebarFooterNav({ isActive, onLogout }: SidebarFooterNavProps) {
  const navigate = useNavigate()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => navigate("/dashboard/settings")}
          tooltip="Settings"
          isActive={isActive("/dashboard/settings")}
        >
          <Settings className="mr-2" />
          <span>Settings</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => navigate("/dashboard/profile")}
          tooltip="Profile"
          isActive={isActive("/dashboard/profile")}
        >
          <User className="mr-2" />
          <span>Profile</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={onLogout} tooltip="Logout" isActive={false}>
          <LogOut className="mr-2" />
          <span>Logout</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
