import { useEffect, useMemo, type FC } from "react"
import { useNavigate } from "react-router";
import { BookOpen, MoreHorizontal, Trash2 } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatStore } from "@/store/chat-store";
import { useProfileStore } from "@/store/profile-store";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router";
import { historyService } from "@/services/history-service";

interface ChatListProps {
  isActive: (path: string) => boolean;
  searchQuery: string
}

const ChatListSkeleton: FC = () => (
  <>
    {Array.from({ length: 5 }).map((_, index) => (
      <SidebarMenuItem key={`skeleton-${index}`}>
        <SidebarMenuSkeleton showIcon />
      </SidebarMenuItem>
    ))}
  </>
);

interface ChatMenuProps {
  chat: any;
  isActive: boolean;
  onOpen: () => void;
  onDelete: () => void;
}

const ChatMenu: FC<ChatMenuProps> = ({ chat, isActive, onOpen, onDelete }) => (
  <SidebarMenuItem key={chat.id}>
    <SidebarMenuButton
      tooltip={chat.title}
      isActive={isActive}
      onClick={onOpen}
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
        <DropdownMenuItem onClick={onOpen}>
          <BookOpen className="mr-2 h-4 w-4" />
          <span>Open</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </SidebarMenuItem>
);

export function ChatList({ isActive, searchQuery }: ChatListProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { chats, fetchChats, isLoading } = useChatStore();
  const { user } = useProfileStore();
  const { toast } = useToast();

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

  const handleDeleteChat = async (chatId: string) => {
    if (!user) return;

    try {
      historyService.deleteHistory(user.uid, chatId);
      await fetchChats(user.uid); // Refresh chat list after deletion
      if (location.pathname.includes(chatId)) {
        navigate("/dashboard"); // Redirect to dashboard if current chat is deleted
      }
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

  const filteredChats = useMemo(() => {
    if (!searchQuery?.trim()) return chats;
    return chats.filter((chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chats, searchQuery]);

  const currentChatId = useMemo(() => {
    const match = location.pathname.match(/\/dashboard\/(chat|chatHistory)\/(.+)/);
    return match ? match[2] : undefined;
  }, [location.pathname]);

  let content;
  if (isLoading) {
    content = <ChatListSkeleton />;
  } else if (filteredChats.length > 0) {
    content = filteredChats.map((chat) => (
      <ChatMenu
        key={chat.id}
        chat={chat}
        isActive={currentChatId === chat.id}
        onOpen={() => navigate(`/dashboard/chatHistory/${chat.id}`)}
        onDelete={() => handleDeleteChat(chat.id)}
      />
    ));
  } else if (searchQuery) {
    content = (
      <SidebarMenuItem>
        <span className="px-2 py-1.5 text-sm text-sidebar-foreground/70">
          No chats matching "{searchQuery}"
        </span>
      </SidebarMenuItem>
    );
  } else {
    content = (
      <SidebarMenuItem>
        <span className="px-2 py-1.5 text-sm text-sidebar-foreground/70">
          No recent chats
        </span>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Recent Applications</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>{content}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
