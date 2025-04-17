"use client";

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
  SidebarMenuAction,
  SidebarMenuSkeleton,
  SidebarInput,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  Trash2,
  Plus,
  Search,
  LightbulbIcon,
  BookOpen,
  Settings,
  User,
  Home,
  MoreHorizontal,
  LogOut,
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { useChatStore } from "@/services/chatService";
import { useEffect, useState, useMemo } from "react";
import { useProfileStore } from "@/store/profile-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { chats, fetchChats, isLoading, error } = useChatStore();
  const { user } = useProfileStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      fetchChats(user.uid).catch((err) => {
        toast({
          title: "Failed to load chats",
          description: err.message,
          variant: "destructive",
        });
      });
    }
  }, [user, fetchChats, toast]);

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

  const handleDeleteChat = async (chatId: string) => {
    if (!user) return;

    try {
      toast({
        title: "Chat deleted",
        description: "The chat has been removed from your history",
      });
    } catch (err) {
      toast({
        title: "Failed to delete chat",
        description:
          err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

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

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    return chats.filter((chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chats, searchQuery]);

  const currentChatId = useMemo(() => {
    const match = location.pathname.match(/\/dashboard\/chat\/(.+)/);
    return match ? match[1] : undefined;
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen">
      <SidebarProvider>
        <div className="flex h-screen w-full bg-background">
          <Sidebar variant="floating" collapsible="icon">
            <SidebarHeader className="space-y-2">
              <div className="group-data-[collapsible=icon]:hidden space-y-2">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user?.photoURL || undefined}
                        alt={user?.displayName || "User"}
                      />
                      <AvatarFallback>
                        {user?.displayName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium truncate">
                      {user?.displayName || "User"}
                    </span>
                  </div>
                  <ModeToggle />
                </div>

                <SidebarInput
                  placeholder="Search Applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* This will only show in icon mode */}
              <div className="hidden group-data-[collapsible=icon]:flex justify-center py-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.photoURL || undefined}
                    alt={user?.displayName || "User"}
                  />
                  <AvatarFallback>
                    {user?.displayName?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>

              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate("/dashboard")}
                    tooltip="Home"
                    isActive={
                      isActive("/dashboard") &&
                      location.pathname === "/dashboard"
                    }
                  >
                    <Home className="mr-2" />
                    <span>Home</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleNewChat}
                    tooltip="New Chat"
                    variant="outline"
                  >
                    <Plus className="mr-2" />
                    <span>New Chat</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="overflow-hidden">
              <SidebarGroup>
                <SidebarGroupLabel>Recent Applications</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <SidebarMenuItem key={`skeleton-${index}`}>
                          <SidebarMenuSkeleton showIcon />
                        </SidebarMenuItem>
                      ))
                    ) : filteredChats.length > 0 ? (
                      filteredChats.map((chat) => (
                        <SidebarMenuItem key={chat.id}>
                          <SidebarMenuButton
                            tooltip={chat.title}
                            isActive={currentChatId === chat.id}
                            onClick={() =>
                              navigate(`/dashboard/chat/${chat.id}`)
                            }
                          >
                            <BookOpen className="mr-2" />
                            <span>{chat.title}</span>
                          </SidebarMenuButton>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <SidebarMenuAction showOnHover>
                                <MoreHorizontal />
                                <span className="sr-only">Chat options</span>
                              </SidebarMenuAction>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="right" align="start">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/dashboard/chat/${chat.id}`)
                                }
                              >
                                <BookOpen className="mr-2 h-4 w-4" />
                                <span>Open</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteChat(chat.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </SidebarMenuItem>
                      ))
                    ) : searchQuery ? (
                      <SidebarMenuItem>
                        <span className="px-2 py-1.5 text-sm text-sidebar-foreground/70">
                          No chats matching "{searchQuery}"
                        </span>
                      </SidebarMenuItem>
                    ) : (
                      <SidebarMenuItem>
                        <span className="px-2 py-1.5 text-sm text-sidebar-foreground/70">
                          No recent chats
                        </span>
                      </SidebarMenuItem>
                    )}
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
                        onClick={() => navigate("/dashboard/search")}
                        tooltip="Search"
                        isActive={isActive("/dashboard/search")}
                      >
                        <Search className="mr-2" />
                        <span>Search</span>
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
            </SidebarContent>

            <SidebarFooter>
              <SidebarSeparator />
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
                  <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                    <LogOut className="mr-2" />
                    <span>Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
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
