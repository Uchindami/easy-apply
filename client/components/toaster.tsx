import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="flex-1 space-y-1">
            {title && (
              <ToastTitle className="text-sm text-primary font-semibold leading-none tracking-tight">
                {title}
              </ToastTitle>
            )}
            {description && (
              <ToastDescription className="text-sm opacity-90 leading-relaxed">
                {description}
              </ToastDescription>
            )}
          </div>
          {action && <div className="flex-shrink-0 ml-3">{action}</div>}
          <ToastClose className="flex-shrink-0" />
        </Toast>
      ))}
      <ToastViewport className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]" />
    </ToastProvider>
  );
}
