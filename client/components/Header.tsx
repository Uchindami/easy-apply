import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "./ui/sidebar";
import { useRef } from "react";

interface HeaderProps {
  title: string;
  onReset?: () => void;
  isResetDisabled?: boolean;
}

export function Header({ title, onReset, isResetDisabled }: HeaderProps) {
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
        {onReset && (
          <Button onClick={onReset} variant="ghost" disabled={isResetDisabled}>
            Reset
          </Button>
        )}
      </div>
    </header>
  );
}
