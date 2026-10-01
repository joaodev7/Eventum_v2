import { ReactNode, useMemo } from 'react';
import { ThemeConfig } from '@/contexts/EventContext';

interface EventThemeProviderProps {
  themeConfig?: ThemeConfig;
  children: ReactNode;
}

// Default color palette
const defaultTheme: Required<Pick<ThemeConfig, 'primaryColor' | 'secondaryColor' | 'accentColor' | 'backgroundColor' | 'textColor' | 'cardBackgroundColor'>> = {
  primaryColor: '#2D5A5A',
  secondaryColor: '#8B7355',
  accentColor: '#C17F59',
  backgroundColor: '#FAF8F5',
  textColor: '#1F3D3D',
  cardBackgroundColor: '#FFFFFF',
};

// Convert HEX to HSL format for CSS variables
function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Calculate HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Calculate appropriate foreground color (light or dark)
function getForegroundColor(hex: string): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark backgrounds, dark color for light backgrounds
  return luminance > 0.5 ? '210 10% 15%' : '40 20% 97%';
}

// Generate muted version of a color
function getMutedColor(hex: string): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / (max - min) + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / (max - min) + 2) / 6;
        break;
      case b:
        h = ((r - g) / (max - min) + 4) / 6;
        break;
    }
  }
  
  return `${Math.round(h * 360)} 15% ${Math.round(l * 100 * 0.95)}%`;
}

export function EventThemeProvider({ themeConfig, children }: EventThemeProviderProps) {
  const cssVariables = useMemo(() => {
    const config = {
      primaryColor: themeConfig?.primaryColor || defaultTheme.primaryColor,
      secondaryColor: themeConfig?.secondaryColor || defaultTheme.secondaryColor,
      accentColor: themeConfig?.accentColor || defaultTheme.accentColor,
      backgroundColor: themeConfig?.backgroundColor || defaultTheme.backgroundColor,
      textColor: themeConfig?.textColor || defaultTheme.textColor,
      cardBackgroundColor: themeConfig?.cardBackgroundColor || defaultTheme.cardBackgroundColor,
    };

    return `
      .event-theme {
        --event-primary: ${hexToHsl(config.primaryColor)};
        --event-primary-foreground: ${getForegroundColor(config.primaryColor)};
        --event-secondary: ${hexToHsl(config.secondaryColor)};
        --event-secondary-foreground: ${getForegroundColor(config.secondaryColor)};
        --event-accent: ${hexToHsl(config.accentColor)};
        --event-accent-foreground: ${getForegroundColor(config.accentColor)};
        --event-background: ${hexToHsl(config.backgroundColor)};
        --event-foreground: ${hexToHsl(config.textColor)};
        --event-card: ${hexToHsl(config.cardBackgroundColor)};
        --event-card-foreground: ${hexToHsl(config.textColor)};
        --event-muted: ${getMutedColor(config.backgroundColor)};
        --event-muted-foreground: ${getMutedColor(config.textColor)};
        
        /* Override global CSS variables within event theme */
        --primary: ${hexToHsl(config.primaryColor)};
        --primary-foreground: ${getForegroundColor(config.primaryColor)};
        --accent: ${hexToHsl(config.accentColor)};
        --accent-foreground: ${getForegroundColor(config.accentColor)};
        --background: ${hexToHsl(config.backgroundColor)};
        --foreground: ${hexToHsl(config.textColor)};
        --card: ${hexToHsl(config.cardBackgroundColor)};
        --card-foreground: ${hexToHsl(config.textColor)};
        --muted: ${getMutedColor(config.backgroundColor)};
        --muted-foreground: ${getMutedColor(config.textColor)};
        
        /* Special colors derived from theme */
        --dusty-rose: ${hexToHsl(config.accentColor)};
        --champagne-light: ${hexToHsl(config.backgroundColor)};
        --ivory: ${getForegroundColor(config.primaryColor)};
        --sage: ${hexToHsl(config.secondaryColor)};
      }
    `;
  }, [themeConfig]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      <div className="event-theme">
        {children}
      </div>
    </>
  );
}

// Predefined color palettes
export const colorPalettes = [
  {
    id: 'petrol-terracotta',
    name: 'Petróleo & Terracota',
    description: 'Elegante e moderno',
    colors: {
      primaryColor: '#2D5A5A',
      secondaryColor: '#8B7355',
      accentColor: '#C17F59',
      backgroundColor: '#FAF8F5',
      textColor: '#1F3D3D',
      cardBackgroundColor: '#FFFFFF',
    },
  },
  {
    id: 'rose-gold',
    name: 'Rosa & Dourado',
    description: 'Romântico e luxuoso',
    colors: {
      primaryColor: '#B48B78',
      secondaryColor: '#D4AF37',
      accentColor: '#D4AF37',
      backgroundColor: '#FDF8F5',
      textColor: '#3D2F2C',
      cardBackgroundColor: '#FFFFFF',
    },
  },
  {
    id: 'sage-champagne',
    name: 'Sage & Champagne',
    description: 'Natural e sofisticado',
    colors: {
      primaryColor: '#7D9A87',
      secondaryColor: '#D4A574',
      accentColor: '#D4A574',
      backgroundColor: '#F9F6F2',
      textColor: '#3D4A3F',
      cardBackgroundColor: '#FFFFFF',
    },
  },
  {
    id: 'navy-coral',
    name: 'Marinho & Coral',
    description: 'Clássico e vibrante',
    colors: {
      primaryColor: '#2C3E50',
      secondaryColor: '#BDC3C7',
      accentColor: '#E17055',
      backgroundColor: '#F8F9FA',
      textColor: '#2C3E50',
      cardBackgroundColor: '#FFFFFF',
    },
  },
  {
    id: 'lavender-gold',
    name: 'Lavanda & Ouro',
    description: 'Delicado e elegante',
    colors: {
      primaryColor: '#9B7EBD',
      secondaryColor: '#D4AF37',
      accentColor: '#D4AF37',
      backgroundColor: '#FAF8FC',
      textColor: '#4A3F5C',
      cardBackgroundColor: '#FFFFFF',
    },
  },
  {
    id: 'blush-burgundy',
    name: 'Blush & Bordô',
    description: 'Romântico e intenso',
    colors: {
      primaryColor: '#722F37',
      secondaryColor: '#D4A5A5',
      accentColor: '#D4A5A5',
      backgroundColor: '#FFF8F8',
      textColor: '#4A2C2C',
      cardBackgroundColor: '#FFFFFF',
    },
  },
];

// Export default theme for use elsewhere
export { defaultTheme };
