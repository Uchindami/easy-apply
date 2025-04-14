import { Outlet, useNavigate, useLocation } from "react-router";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Mic, Send, Trash2, Plus, Search, LightbulbIcon, BookOpen, Settings, User, Home } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNewChat = () => {
    // Implement new chat functionality
  }
  
  const isActive = (path: string) => {
    return location.pathname === path;
  }

  return (
    <div className="flex min-h-screen">
      <SidebarProvider>
        <div className="flex h-screen w-full bg-background">
          <Sidebar variant="floating" collapsible="icon">
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/dashboard')}
                    tooltip="Home"
                    className={isActive('/dashboard') ? 'bg-accent' : ''}
                  >
                    <Home className="mr-2" />
                    <span>Home</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleNewChat} tooltip="New Chat">
                    <Plus className="mr-2" />
                    <span>New Chat</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="overflow-hidden">
              <SidebarGroup>
                <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {/* {conversations.map((convo) => (
                      <SidebarMenuItem key={convo.id}>
                        <SidebarMenuButton tooltip={convo.title}>
                          <BookOpen className="mr-2" />
                          <span>{convo.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))} */}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarSeparator />

              <SidebarGroup>
                <SidebarGroupLabel>Tools</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => navigate('/dashboard/search')}
                        tooltip="Search"
                        className={isActive('/dashboard/search') ? 'bg-accent' : ''}
                      >
                        <Search className="mr-2" />
                        <span>Search</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => navigate('/dashboard/suggestions')}
                        tooltip="Suggestions"
                        className={isActive('/dashboard/suggestions') ? 'bg-accent' : ''}
                      >
                        <LightbulbIcon className="mr-2" />
                        <span>Suggestions</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
              
              <SidebarMenu className="flex-row items-center justify-between">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/dashboard/profile')}
                    tooltip="Profile"
                    className={isActive('/dashboard/profile') ? 'bg-accent' : ''}
                  >
                    <User className="mr-2" />
                    <span>Profile</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
