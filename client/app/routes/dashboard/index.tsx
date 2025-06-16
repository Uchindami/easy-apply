import { Outlet, useNavigate, useLocation } from "react-router";
import { useEffect, useState } from "react";
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
import { useDocumentStore } from "@/store/useResumeStore";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const {resetForm} = useDocumentStore();
  const { user, isLoading, setLogout } = useProfileStore();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    setLogout();
  };

  const handleNewChat = async () => {
    if (!user) return;
    try {
      navigate(`/dashboard`);
      resetForm(); // Reset the form state
      toast({
        title: "New chat created",
        description: "You can start your Application now",
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

  useEffect(() => {
    if (isLoading) return; // Wait for loading to finish

    if (!user) {
      toast({
        title: "Unauthorized",
        description: "You need to log in to access this page",
      });
      navigate("/login", { replace: true });
    }
  }, [user, isLoading, navigate, toast]);

  if (user) {
    return (
      <div className="flex min-h-screen">
        <SidebarProvider>
          <div className="flex h-screen w-full bg-background dark:bg-background-dark">
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
}
