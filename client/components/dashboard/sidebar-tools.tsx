"use client"

import { useNavigate } from "react-router"
import { Search, LightbulbIcon } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

interface SidebarToolsProps {
  isActive: (path: string) => boolean
}

export function SidebarTools({ isActive }: SidebarToolsProps) {
  const navigate = useNavigate()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Tools</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => navigate("/dashboard/jobs")}
              tooltip="Jobs"
              isActive={isActive("/dashboard/jobs")}
            >
              <Search className="mr-2" />
              <span>Jobs</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => navigate("/dashboard/suggestions")}
              tooltip="Suggestions"
              isActive={isActive("/dashboard/suggestions")}
            >
              <LightbulbIcon className="mr-2" />
              <span>Suggestions</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
