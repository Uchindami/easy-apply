import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"

interface HeaderProps {
  onReset: () => void
  isResetDisabled: boolean
}

export function Header({ onReset, isResetDisabled }: HeaderProps) {
  return (
    <header className="border-b p-4 flex items-center justify-between bg-white dark:bg-gray-800">
      <div className="flex items-center">
        <FileText className="h-6 w-6 mr-2 text-red-600" />
        <h1 className="text-xl font-semibold">Easy Apply</h1>
      </div>
      <Button variant="outline" size="sm" onClick={onReset} disabled={isResetDisabled}>
        Start New
      </Button>
    </header>
  )
} 