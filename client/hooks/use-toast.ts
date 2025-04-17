import { toast, useToast as useToastPrimitive } from "@/components/ui/use-toast"
import type { Toast, ToastActionElement, ToastProps } from "@/components/ui/toast"

export const useToast = useToastPrimitive

export type { Toast, ToastActionElement, ToastProps }
export { toast }
