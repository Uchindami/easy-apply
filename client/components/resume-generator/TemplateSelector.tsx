
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Check } from "lucide-react"

interface TemplateSelectorProps {
  selectedTemplate: string
  accentColor: string
  onTemplateChange: (template: string) => void
  onColorChange: (color: string) => void
}

const templates = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean and professional with a modern touch",
  },
  {
    id: "classic",
    name: "Classic",
    description: "Traditional and widely accepted format",
  },
  {
    id: "creative",
    name: "Creative",
    description: "Stand out with a unique design",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and focused on content",
  },
]

export function TemplateSelector({
  selectedTemplate,
  accentColor,
  onTemplateChange,
  onColorChange,
}: TemplateSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume Template</CardTitle>
        <CardDescription>Choose a template and customize the accent color</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <RadioGroup value={selectedTemplate} onValueChange={onTemplateChange} className="grid grid-cols-2 gap-4">
            {templates.map((template) => (
              <div key={template.id} className="relative">
                <RadioGroupItem value={template.id} id={template.id} className="peer sr-only" />
                <Label
                  htmlFor={template.id}
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <div className="mb-2 h-24 w-full rounded bg-muted/50 flex items-center justify-center">
                    {/* Template preview image or icon could go here */}
                    <div className="text-2xl font-bold">{template.name[0]}</div>
                  </div>
                  <div className="w-full text-center">
                    <p className="font-medium">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                  <Check className="absolute top-3 right-3 h-5 w-5 text-primary opacity-0 peer-data-[state=checked]:opacity-100" />
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="accent-color">Accent Color</Label>
            <div className="flex items-center gap-3">
              <Input
                type="color"
                id="accent-color"
                value={accentColor}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={accentColor}
                onChange={(e) => onColorChange(e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
