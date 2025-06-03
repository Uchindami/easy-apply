import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  step: number;
  totalSteps: number;
  labels?: string[];
}

export function ProgressIndicator({ 
  step, 
  totalSteps, 
  labels = [] 
}: ProgressIndicatorProps) {
  return (
    <div className="flex items-center space-x-2">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isCompleted = index + 1 < step;
        const isActive = index + 1 === step;
        const label = labels[index] || `Step ${index + 1}`;
        
        return (
          <div key={index} className="flex items-center">
            {index > 0 && (
              <div 
                className={cn(
                  "h-[2px] w-8 mx-1",
                  isCompleted ? "bg-primary" : "bg-muted"
                )}
              />
            )}
            
            <div className="flex flex-col items-center">
              <div 
                className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium",
                  isCompleted ? "bg-primary text-primary-foreground" : 
                  isActive ? "bg-primary/20 text-primary border border-primary" : 
                  "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? "✓" : index + 1}
              </div>
              
              <span 
                className={cn(
                  "text-xs mt-1",
                  isActive ? "text-primary font-medium" : 
                  isCompleted ? "text-primary" : 
                  "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}