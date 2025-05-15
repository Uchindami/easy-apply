import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/mode-toggle";
import type { User } from "firebase/auth";

interface SidebarProfileProps {
  user: User | null;
}

export function SidebarProfile({ user }: SidebarProfileProps) {
  return (
    <>
      <div className="group-data-[collapsible=icon]:hidden space-y-2">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2 overflow-hidden">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user?.photoURL || undefined}
                alt={user?.displayName || "User"}
              />
              <AvatarFallback>{user?.displayName?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <span className="overflow-hidden text-ellipsis font-medium">
              {user?.displayName || "User "}
            </span>
          </div>
          <ModeToggle />
        </div>
      </div>

      {/* This will only show in icon mode */}
      <div className="hidden group-data-[collapsible=icon]:flex justify-center py-2">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={user?.photoURL || undefined}
            alt={user?.displayName || "User"}
          />
          <AvatarFallback>{user?.displayName?.[0] || "U"}</AvatarFallback>
        </Avatar>
      </div>
    </>
  );
}
