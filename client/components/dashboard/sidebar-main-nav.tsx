import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Home, Plus } from "lucide-react";

interface SidebarMainNavProps {
  isActive: (path: string) => boolean;
  onNewChat: () => void;
}

import { useLocation, useNavigate } from "react-router";

export function SidebarMainNav({ isActive, onNewChat }: SidebarMainNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={
              isActive("/dashboard") && location.pathname === "/dashboard"
            }
            onClick={() => navigate("/dashboard")}
            tooltip="Home"
          >
            <Home className="mr-2" />
            <span>Home</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={onNewChat}
            tooltip="New Application"
            variant="outline"
          >
            <Plus className="mr-2" />
            <span>New Application</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}
