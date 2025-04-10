import { cn } from "@/lib/utils"

interface DiffViewerProps {
  originalText: string
  newText: string
  className?: string
}

interface DiffLine {
  content: string
  type: "added" | "removed" | "unchanged"
}

export function DiffViewer({ originalText, newText, className }: DiffViewerProps) {
  // Simple diff algorithm to identify added, removed, and unchanged lines
  const computeDiff = (original: string, modified: string): DiffLine[] => {
    const originalLines = original.split("\n")
    const modifiedLines = modified.split("\n")

    const diff: DiffLine[] = []

    // Create a map of lines for faster lookup
    const originalMap = new Map<string, number>()
    originalLines.forEach((line, index) => {
      originalMap.set(line, index)
    })

    // Track which original lines have been matched
    const matchedOriginal = new Set<number>()

    // First pass: find unchanged and added lines
    modifiedLines.forEach((line) => {
      if (originalMap.has(line)) {
        const originalIndex = originalMap.get(line)!
        if (!matchedOriginal.has(originalIndex)) {
          diff.push({ content: line, type: "unchanged" })
          matchedOriginal.add(originalIndex)
        } else {
          // This is a duplicate line in the modified text
          diff.push({ content: line, type: "added" })
        }
      } else {
        // Line doesn't exist in original, so it's added
        diff.push({ content: line, type: "added" })
      }
    })

    // Second pass: find removed lines
    originalLines.forEach((line, index) => {
      if (!matchedOriginal.has(index)) {
        // This line was in the original but not in the modified text
        // Find the right position to insert it
        let insertPosition = 0
        while (insertPosition < diff.length && originalLines.indexOf(diff[insertPosition].content) < index) {
          insertPosition++
        }
        diff.splice(insertPosition, 0, { content: line, type: "removed" })
      }
    })

    return diff
  }

  const diffLines = computeDiff(originalText, newText)

  return (
    <div className={cn("font-mono text-sm whitespace-pre-wrap", className)}>
      {diffLines.map((line, index) => (
        <div
          key={index}
          className={cn(
            "py-1 px-2 border-l-2",
            line.type === "added"
              ? "bg-green-50 text-green-800 border-green-500"
              : line.type === "removed"
                ? "bg-red-50 text-red-800 border-red-500"
                : "border-gray-200",
          )}
        >
          <span className="mr-2">{line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}</span>
          {line.content || " "}
        </div>
      ))}
    </div>
  )
}
