import React from "react"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  return (
    <div className="border rounded-md p-4 flex-1 min-h-0">
      <textarea
        className="w-full min-h-[400px] md:min-w-2xl font-mono p-2 rounded border"
        value={content}
        onChange={e => onChange(e.target.value)}
        spellCheck={false}
        wrap="off"
      />
    </div>
  )
}
