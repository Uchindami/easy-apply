import { Skeleton } from "@/components/ui/skeleton"
import { Header } from "@/components/Header"

export function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Header title="Career Intelligence Hub" />
      <div className="container mx-auto px-6 py-16 max-w-5xl">
        <div className="space-y-12">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-40 w-full rounded-lg" />
          <div className="space-y-6">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
