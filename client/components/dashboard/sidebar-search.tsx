import { SidebarInput } from "@/components/ui/sidebar"

interface SidebarSearchProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export function SidebarSearch({ searchQuery, setSearchQuery }: SidebarSearchProps) {
  return (
    <div className="group-data-[collapsible=icon]:hidden">
      <SidebarInput
        placeholder="Search Applications..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  )
}
