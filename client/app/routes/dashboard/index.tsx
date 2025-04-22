import { Outlet, useNavigate, useLocation } from "react-router";
import { useState } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useProfileStore } from "@/store/profile-store";
import { useToast } from "@/hooks/use-toast";
import { SidebarProfile } from "@/components/dashboard/sidebar-profile";
import { ChatList } from "@/components/dashboard/chat-list";
import { SidebarTools } from "@/components/dashboard/sidebar-tools";
import { SidebarFooterNav } from "@/components/dashboard/sidebar-footer-nav";
import { SidebarSearch } from "@/components/dashboard/sidebar-search";
import { SidebarMainNav } from "@/components/dashboard/sidebar-main-nav";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useProfileStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    try {
      navigate("/login");
      toast({
        title: "Logged out successfully",
      });
    } catch (err) {
      toast({
        title: "Failed to logout",
        description:
          err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleNewChat = async () => {
    if (!user) return;

    try {
      navigate(`/dashboard`);
      toast({
        title: "New chat created",
        description: "You can start your conversation now",
      });
    } catch (err) {
      toast({
        title: "Failed to create new chat",
        description:
          err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  return (
    <div className="flex min-h-screen">
      <SidebarProvider>
        <div className="flex h-screen w-full bg-background">
          <Sidebar variant="floating" collapsible="icon">
            <SidebarHeader className="space-y-2">
              {/* Profile section */}
              <SidebarProfile user={user} />

              {/* Search input */}
              <SidebarSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />

              {/* Main navigation */}
              <SidebarMainNav isActive={isActive} onNewChat={handleNewChat} />
            </SidebarHeader>

            <SidebarContent className="overflow-hidden">
              {/* Chat list */}
              <ChatList isActive={isActive} searchQuery={searchQuery} />

              <SidebarSeparator />

              {/* Tools section */}
              <SidebarTools isActive={isActive} />
            </SidebarContent>

            <SidebarFooter>
              <SidebarSeparator />
              {/* Footer navigation */}
              <SidebarFooterNav isActive={isActive} onLogout={handleLogout} />
            </SidebarFooter>
          </Sidebar>

          <SidebarInset>
            <main className="flex-1 overflow-auto">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
