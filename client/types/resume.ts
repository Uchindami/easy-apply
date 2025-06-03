export interface DesignTemplate {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  colorSchemes: Array<{
    id: string;
    name: string;
    colors: string[];
  }>;
  defaultColorScheme: string;
  accentColors: Array<{
    id: string;
    value: string;
  }>;
  defaultAccentColor: string;
  fontStyles: Array<{
    id: string;
    name: string;
    className: string;
  }>;
  defaultFontStyle: string;
  defaultTextDensity: 'compact' | 'balanced' | 'spacious';
  headerStyles: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  defaultHeaderStyle: string;
  defaultSectionOrder: Array<{
    id: string;
    name: string;
  }>;
}

export interface ResumeDesignConfig {
  templateId: string;
  colorSchemeId: string;
  accentColorId: string;
  fontStyleId: string;
  textDensity: 'compact' | 'balanced' | 'spacious';
  headerStyleId: string;
  sectionOrder: Array<{
    id: string;
    name: string;
  }>;
}