import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"

export function LoadingCard() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Analyzing your profile and finding the best matches...</span>
        </div>
      </CardContent>
    </Card>
  )
}
