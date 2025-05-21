import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "./ui/sidebar";
import { useRef } from "react";
import { Bookmark } from "lucide-react";

interface HeaderProps {
  title: string;
  onReset?: () => void;
  isResetDisabled?: boolean;
  savedJobsButtonProps?: {
    onClick: () => void;
    isLoadingSavedJobs: boolean;
    savedJobsCount: number;
  };
}

export function Header({ title, onReset, isResetDisabled, savedJobsButtonProps }: HeaderProps) {
  const renderCount = useRef(0)
  renderCount.current +=1
  return (
    <header className="border-b bg-background p-4 sticky top-0 z-10">
      <div className="flex items-center justify-between max-w-[1200px] mx-auto">
        <div className="flex items-center space-x-2">
          <SidebarTrigger className="mr-4" />
          <h1 className="text-xl font-bold">{title}</h1>
          <span className="text-xs text-muted-foreground">Renders: {renderCount.current}</span>
        </div>
        <div className="flex items-center gap-2">
          {onReset && (
            <Button onClick={onReset} variant="ghost" disabled={isResetDisabled}>
              Reset
            </Button>
          )}
          {savedJobsButtonProps && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={savedJobsButtonProps.onClick}
            >
              <Bookmark className="h-4 w-4 text-primary" />
              <span className="text-primary">Saved Jobs</span>
              {!savedJobsButtonProps.isLoadingSavedJobs && savedJobsButtonProps.savedJobsCount > 0 && (
                <span className="ml-1 bg-foreground/50 text-white rounded-full text-xs px-1.5 py-0.5 min-w-5 text-center">
                  {savedJobsButtonProps.savedJobsCount}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
