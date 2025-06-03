// import React from "react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Label } from "@/components/ui/label";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Button } from "@/components/ui/button";
// import { motion } from "framer-motion";
// import { type DesignTemplate } from "@/types/resume";
// import { designTemplates } from "@/lib/resume-templates";

// interface ResumeDesignSelectorProps {
//   selectedTemplate: DesignTemplate | null;
//   onSelectTemplate: (template: DesignTemplate) => void;
//   onContinue: () => void;
// }

// export function ResumeDesignSelector({
//   selectedTemplate,
//   onSelectTemplate,
//   onContinue,
// }: ResumeDesignSelectorProps) {
//   return (
//     <div className="space-y-6">
//       <div className="grid gap-6">
//         <div>
//           <h3 className="text-lg font-medium mb-3">Choose a Design Template</h3>
//           <p className="text-muted-foreground mb-6">
//             Select a professional template that best represents your personal
//             brand.
//           </p>

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {designTemplates.map((template) => (
//               <TemplateCard
//                 key={template.id}
//                 template={template}
//                 isSelected={selectedTemplate?.id === template.id}
//                 onSelect={() => onSelectTemplate(template)}
//               />
//             ))}
//           </div>
//         </div>

//         {selectedTemplate && (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.3 }}
//           >
//             <CustomizationOptions template={selectedTemplate} />
//           </motion.div>
//         )}
//       </div>

//       <div className="flex justify-center mt-8">
//         <Button
//           size="lg"
//           onClick={onContinue}
//           disabled={!selectedTemplate}
//           className="w-full sm:w-auto min-w-[200px]"
//         >
//           Continue to Preview
//         </Button>
//       </div>
//     </div>
//   );
// }

// interface TemplateCardProps {
//   template: DesignTemplate;
//   isSelected: boolean;
//   onSelect: () => void;
// }

// function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
//   return (
//     <Card
//       className={`overflow-hidden cursor-pointer transition-all duration-200 ${
//         isSelected ? "ring-2 ring-primary ring-offset-2" : "hover:shadow-md"
//       }`}
//       onClick={onSelect}
//     >
//       <div className="relative aspect-[3/4] overflow-hidden bg-muted">
//         <img
//           src={template.previewImage}
//           alt={template.name}
//           className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
//         />
//         {isSelected && (
//           <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
//             <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-5 w-5 text-primary-foreground"
//                 viewBox="0 0 20 20"
//                 fill="currentColor"
//               >
//                 <path
//                   fillRule="evenodd"
//                   d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
//                   clipRule="evenodd"
//                 />
//               </svg>
//             </div>
//           </div>
//         )}
//       </div>
//       <CardContent className="p-4">
//         <h4 className="font-medium text-base">{template.name}</h4>
//         <p className="text-sm text-muted-foreground mt-1">
//           {template.description}
//         </p>
//       </CardContent>
//     </Card>
//   );
// }

// interface CustomizationOptionsProps {
//   template: DesignTemplate;
// }

// function CustomizationOptions({ template }: CustomizationOptionsProps) {
//   return (
//     <Card className="mt-6">
//       <CardHeader>
//         <CardTitle>Customize Your Design</CardTitle>
//         <CardDescription>
//           Personalize the design to match your preferences and industry
//           standards.
//         </CardDescription>
//       </CardHeader>
//       <CardContent>
//         <Tabs defaultValue="colors" className="w-full">
//           <TabsList className="grid w-full grid-cols-3">
//             <TabsTrigger value="colors">Colors</TabsTrigger>
//             <TabsTrigger value="typography">Typography</TabsTrigger>
//             <TabsTrigger value="layout">Layout</TabsTrigger>
//           </TabsList>

//           <TabsContent value="colors" className="pt-4 space-y-4">
//             <div>
//               <Label className="mb-2 block">Color Scheme</Label>
//               <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//                 {template.colorSchemes.map((scheme) => (
//                   <ColorSchemeOption
//                     key={scheme.id}
//                     scheme={scheme}
//                     isSelected={scheme.id === template.defaultColorScheme}
//                   />
//                 ))}
//               </div>
//             </div>

//             <div>
//               <Label className="mb-2 block">Accent Color</Label>
//               <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
//                 {template.accentColors.map((color) => (
//                   <AccentColorOption
//                     key={color.id}
//                     color={color.value}
//                     isSelected={color.id === template.defaultAccentColor}
//                   />
//                 ))}
//               </div>
//             </div>
//           </TabsContent>

//           <TabsContent value="typography" className="pt-4 space-y-4">
//             <div>
//               <Label className="mb-2 block">Font Style</Label>
//               <RadioGroup
//                 defaultValue={template.defaultFontStyle}
//                 className="grid grid-cols-1 sm:grid-cols-2 gap-2"
//               >
//                 {template.fontStyles.map((font) => (
//                   <div key={font.id} className="flex items-start space-x-2">
//                     <RadioGroupItem value={font.id} id={`font-${font.id}`} />
//                     <div className="grid gap-1.5">
//                       <Label
//                         htmlFor={`font-${font.id}`}
//                         className="font-medium"
//                       >
//                         {font.name}
//                       </Label>
//                       <p
//                         className={`text-sm text-muted-foreground ${font.className}`}
//                       >
//                         This is how your text will appear
//                       </p>
//                     </div>
//                   </div>
//                 ))}
//               </RadioGroup>
//             </div>

//             <div>
//               <Label className="mb-2 block">Text Density</Label>
//               <RadioGroup
//                 defaultValue={template.defaultTextDensity}
//                 className="flex space-x-4"
//               >
//                 <div className="flex items-center space-x-2">
//                   <RadioGroupItem value="compact" id="density-compact" />
//                   <Label htmlFor="density-compact">Compact</Label>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <RadioGroupItem value="balanced" id="density-balanced" />
//                   <Label htmlFor="density-balanced">Balanced</Label>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <RadioGroupItem value="spacious" id="density-spacious" />
//                   <Label htmlFor="density-spacious">Spacious</Label>
//                 </div>
//               </RadioGroup>
//             </div>
//           </TabsContent>

//           <TabsContent value="layout" className="pt-4 space-y-4">
//             <div>
//               <Label className="mb-2 block">Section Order</Label>
//               <div className="border rounded-md p-4">
//                 <p className="text-sm text-muted-foreground mb-3">
//                   Drag sections to reorder them in your resume
//                 </p>
//                 <div className="space-y-2">
//                   {template.defaultSectionOrder.map((section, index) => (
//                     <div
//                       key={section.id}
//                       className="flex items-center justify-between p-2 bg-muted rounded-md"
//                     >
//                       <span>{section.name}</span>
//                       <div className="flex space-x-1">
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           disabled={index === 0}
//                         >
//                           ↑
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           disabled={
//                             index === template.defaultSectionOrder.length - 1
//                           }
//                         >
//                           ↓
//                         </Button>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             <div>
//               <Label className="mb-2 block">Header Style</Label>
//               <RadioGroup
//                 defaultValue={template.defaultHeaderStyle}
//                 className="grid grid-cols-1 sm:grid-cols-2 gap-2"
//               >
//                 {template.headerStyles.map((style) => (
//                   <div key={style.id} className="flex items-start space-x-2">
//                     <RadioGroupItem
//                       value={style.id}
//                       id={`header-${style.id}`}
//                     />
//                     <div className="grid gap-1.5">
//                       <Label
//                         htmlFor={`header-${style.id}`}
//                         className="font-medium"
//                       >
//                         {style.name}
//                       </Label>
//                       <p className="text-sm text-muted-foreground">
//                         {style.description}
//                       </p>
//                     </div>
//                   </div>
//                 ))}
//               </RadioGroup>
//             </div>
//           </TabsContent>
//         </Tabs>
//       </CardContent>
//       <CardFooter className="flex justify-between">
//         <Button variant="outline">Reset to Default</Button>
//         <Button>Save Configuration</Button>
//       </CardFooter>
//     </Card>
//   );
// }

// interface ColorSchemeOptionProps {
//   scheme: {
//     id: string;
//     name: string;
//     colors: string[];
//   };
//   isSelected: boolean;
// }

// function ColorSchemeOption({ scheme, isSelected }: ColorSchemeOptionProps) {
//   return (
//     <div
//       className={`cursor-pointer rounded-md border p-2 transition-all ${
//         isSelected ? "ring-2 ring-primary border-primary" : "hover:border-input"
//       }`}
//     >
//       <div className="space-y-2">
//         <div className="flex gap-1">
//           {scheme.colors.map((color, index) => (
//             <div
//               key={index}
//               className="h-4 w-full rounded-sm"
//               style={{ backgroundColor: color }}
//             />
//           ))}
//         </div>
//         <span className="text-xs">{scheme.name}</span>
//       </div>
//     </div>
//   );
// }

// interface AccentColorOptionProps {
//   color: string;
//   isSelected: boolean;
// }

// function AccentColorOption({ color, isSelected }: AccentColorOptionProps) {
//   return (
//     <div
//       className={`h-8 w-8 rounded-full cursor-pointer transition-all ${
//         isSelected ? "ring-2 ring-offset-2 ring-primary" : ""
//       }`}
//       style={{ backgroundColor: color }}
//     />
//   );
// }
