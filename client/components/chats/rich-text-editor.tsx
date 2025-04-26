import type React from "react"
import { useCallback, useMemo } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Code,
  Quote,
  Minus,
} from "lucide-react"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
}

// MenuButton component for toolbar actions
interface MenuButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  icon: React.ReactNode
  title: string
}

function MenuButton({ onClick, isActive, disabled, icon, title }: MenuButtonProps) {
  return (
    <Button
      type="button"
      variant={isActive ? "default" : "ghost"}
      size="icon"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="h-8 w-8"
    >
      {icon}
    </Button>
  )
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  console.log(content)

  // Memoize menu button configs to avoid unnecessary re-renders
  const menuButtons = useMemo(() => [
    {
      onClick: () => editor?.chain().focus().toggleBold().run(),
      isActive: editor?.isActive("bold"),
      icon: <Bold className="h-4 w-4" />, title: "Bold"
    },
    {
      onClick: () => editor?.chain().focus().toggleItalic().run(),
      isActive: editor?.isActive("italic"),
      icon: <Italic className="h-4 w-4" />, title: "Italic"
    },
    {
      onClick: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor?.isActive("heading", { level: 1 }),
      icon: <Heading1 className="h-4 w-4" />, title: "Heading 1"
    },
    {
      onClick: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor?.isActive("heading", { level: 2 }),
      icon: <Heading2 className="h-4 w-4" />, title: "Heading 2"
    },
    {
      onClick: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor?.isActive("heading", { level: 3 }),
      icon: <Heading3 className="h-4 w-4" />, title: "Heading 3"
    },
    {
      onClick: () => editor?.chain().focus().toggleBulletList().run(),
      isActive: editor?.isActive("bulletList"),
      icon: <List className="h-4 w-4" />, title: "Bullet List"
    },
    {
      onClick: () => editor?.chain().focus().toggleOrderedList().run(),
      isActive: editor?.isActive("orderedList"),
      icon: <ListOrdered className="h-4 w-4" />, title: "Ordered List"
    },
    {
      onClick: () => editor?.chain().focus().toggleCodeBlock().run(),
      isActive: editor?.isActive("codeBlock"),
      icon: <Code className="h-4 w-4" />, title: "Code Block"
    },
    {
      onClick: () => editor?.chain().focus().toggleBlockquote().run(),
      isActive: editor?.isActive("blockquote"),
      icon: <Quote className="h-4 w-4" />, title: "Quote"
    },
    {
      onClick: () => editor?.chain().focus().setHorizontalRule().run(),
      isActive: false,
      icon: <Minus className="h-4 w-4" />, title: "Horizontal Rule"
    },
  ], [editor])

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    editor?.chain().focus().undo().run()
  }, [editor])
  const handleRedo = useCallback(() => {
    editor?.chain().focus().redo().run()
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="border rounded-md">
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
        {menuButtons.map((btn, idx) => (
          <MenuButton
            key={btn.title}
            onClick={btn.onClick}
            isActive={btn.isActive}
            icon={btn.icon}
            title={btn.title}
          />
        ))}
        <div className="ml-auto flex gap-1">
          <MenuButton
            onClick={handleUndo}
            disabled={!editor.can().undo()}
            icon={<Undo className="h-4 w-4" />}
            title="Undo"
          />
          <MenuButton
            onClick={handleRedo}
            disabled={!editor.can().redo()}
            icon={<Redo className="h-4 w-4" />}
            title="Redo"
          />
        </div>
      </div>
      <EditorContent editor={editor} className="p-4 min-h-[400px] prose max-w-none dark:prose-invert" />
    </div>
  )
}
