import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Palette,
  Eye,
  Check,
  Download,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import WordIcon from "@/assets/WordIcon";
import PdfIcon from "@/assets/PdfIcon";
import {
  resumeTemplates,
  colorSchemes,
  type Template,
  type ColorScheme,
} from "@/lib/resume-templates";
import { useDocumentStore } from "@/store/useResumeStore";

const formatIcons = {
  pdf: PdfIcon,
  word: WordIcon,
  html: Download,
};

const formatLabels = {
  pdf: " You can export to PDF",
  word: "You can export to Word",
  html: "HTML",
};

interface TemplateSelectorProps {
  onTemplateSelect: (template: Template, colors: ColorScheme) => void;
  onContinue: () => void;
  isGenerating: boolean;
}

export function TemplateSelector({
  onTemplateSelect,
  onContinue,
  isGenerating,
}: TemplateSelectorProps) {
  const {
    selectedTemplate,
    selectedColors,
    setSelectedTemplate,
    setSelectedColors,
  } = useDocumentStore();
  
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    if (selectedColors) onTemplateSelect(template, selectedColors);
  };

  const handleColorSelect = (colors: ColorScheme) => {
    setSelectedColors(colors);
    if (selectedTemplate) onTemplateSelect(selectedTemplate, colors);
  };

  const isReadyToContinue = selectedTemplate && selectedColors;

  const handleContinue = () => {
    if (isReadyToContinue) onContinue();
  };
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Resume Design</h2>
        <p className="text-muted-foreground">
          Select a template and color scheme that matches your style and
          industry
        </p>
      </div>

      {/* Templates Section */}
      <div className="space-y-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => selectedTemplate && setSelectedTemplate(null)}
        >
          <SectionHeader
            icon={<Eye className="h-5 w-5" />}
            title="Resume Templates"
          />
          {selectedTemplate && (
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ChevronDown className="h-4 w-4 mr-1" />
              Change Selection
            </Button>
          )}
        </div>

        <AnimatePresence>
          {!selectedTemplate ? (
            <motion.div
              initial={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {resumeTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 hover:scale-102"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {template.name}
                        </CardTitle>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="w-fit">
                          {template.category}
                        </Badge>
                        <div className="flex gap-1">
                          {template.supportedFormats.map((format) => {
                            const IconComponent = formatIcons[format];
                            return (
                              <TooltipIcon
                                key={format}
                                Icon={IconComponent}
                                label={formatLabels[format]}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="bg-muted rounded border overflow-hidden">
                        <iframe
                          srcDoc={template.htmlContent}
                          className="w-full h-full border-0 pointer-events-none"
                          title={`${template.name} preview`}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTemplate(template);
                        }}
                      >
                        Full Preview
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">
                      Template Selected
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {selectedTemplate.name} - {selectedTemplate.category}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewTemplate(selectedTemplate)}
                >
                  Preview
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Colors Section */}
      <div className="space-y-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => selectedColors && setSelectedColors(null)}
        >
          <SectionHeader
            icon={<Palette className="h-5 w-5" />}
            title="Color Palette"
          />
          {selectedColors && (
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ChevronDown className="h-4 w-4 mr-1" />
              Change Selection
            </Button>
          )}
        </div>

        <AnimatePresence>
          {!selectedColors ? (
            <motion.div
              initial={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
            >
              {colorSchemes.map((scheme) => (
                <motion.div
                  key={scheme.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                    onClick={() => handleColorSelect(scheme)}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {scheme.name}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {["primary", "secondary", "accent", "text"].map(
                          (key) => (
                            <div
                              key={key}
                              className="w-4 h-4 rounded-full border border-border"
                              style={{
                                backgroundColor:
                                  scheme[key as keyof ColorScheme],
                              }}
                            />
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      Color Palette Selected
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {selectedColors.name}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {["primary", "secondary", "accent", "text"].map((key) => (
                    <div
                      key={key}
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{
                        backgroundColor:
                          selectedColors[key as keyof ColorScheme],
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Generate Button */}
      <AnimatePresence>
        {isReadyToContinue && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center pt-4"
          >
            <Button
              size="lg"
              onClick={handleContinue}
              disabled={isGenerating}
              className="min-w-[200px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Documents...
                </>
              ) : (
                "Generate Documents"
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <TemplatePreviewModal
            template={previewTemplate}
            onClose={() => setPreviewTemplate(null)}
            onSelect={() => {
              handleTemplateSelect(previewTemplate);
              setPreviewTemplate(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
  );
}

function TooltipIcon({ Icon, label }: { Icon: any; label: string }) {
  return (
    <div className="group relative">
      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 hover:w-10 hover:h-10 rounded-full transition-all duration-200">
        <Icon className="h-5 w-5 items-center justify-center" />
      </div>
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {label}
      </div>
    </div>
  );
}

interface TemplatePreviewModalProps {
  template: Template;
  onClose: () => void;
  onSelect: () => void;
}

function TemplatePreviewModal({
  template,
  onClose,
  onSelect,
}: TemplatePreviewModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{template.name}</h3>
            <p className="text-sm text-muted-foreground">
              {template.description}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={onSelect}>Select Template</Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        <div className="h-[calc(90vh-120px)]">
          <iframe
            srcDoc={template.htmlContent}
            className="w-full h-full border-0"
            title={`${template.name} full preview`}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
