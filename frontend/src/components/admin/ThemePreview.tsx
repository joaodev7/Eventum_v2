import { ThemeConfig } from '@/contexts/EventContext';
import { Heart, Calendar, MapPin, Gift } from 'lucide-react';

interface ThemePreviewProps {
  themeConfig: ThemeConfig;
  eventName?: string;
}

// Convert HEX to HSL format
function hexToHsl(hex: string): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function getForegroundColor(hex: string): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1F2937' : '#F9FAFB';
}

export function ThemePreview({ themeConfig, eventName = 'Nome do Evento' }: ThemePreviewProps) {
  const primary = themeConfig.primaryColor || '#2D5A5A';
  const accent = themeConfig.accentColor || '#C17F59';
  const background = themeConfig.backgroundColor || '#FAF8F5';
  const text = themeConfig.textColor || '#1F3D3D';
  const card = themeConfig.cardBackgroundColor || '#FFFFFF';
  const primaryFg = getForegroundColor(primary);

  return (
    <div 
      className="rounded-xl overflow-hidden border shadow-md"
      style={{ 
        backgroundColor: background,
        color: text,
        fontFamily: themeConfig.fontFamily || 'inherit'
      }}
    >
      {/* Mini Hero */}
      <div 
        className="p-6 text-center"
        style={{ 
          background: `linear-gradient(135deg, ${primary} 0%, ${primary}dd 100%)`,
          color: primaryFg
        }}
      >
        <Heart 
          className="w-6 h-6 mx-auto mb-2" 
          fill={accent} 
          style={{ color: accent }}
        />
        <p className="text-xs uppercase tracking-widest opacity-80 mb-1">
          {themeConfig.heroSubtitle || 'Celebração de Amor'}
        </p>
        <h3 
          className="text-xl font-serif"
          style={{ fontFamily: themeConfig.fontFamily || 'Playfair Display' }}
        >
          {eventName}
        </h3>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Info Cards */}
        <div className="flex gap-2">
          <div 
            className="flex-1 p-3 rounded-lg text-center"
            style={{ backgroundColor: card }}
          >
            <Calendar 
              className="w-4 h-4 mx-auto mb-1" 
              style={{ color: primary }}
            />
            <p className="text-[10px] opacity-60">Data</p>
            <p className="text-xs font-medium">25 Dez</p>
          </div>
          <div 
            className="flex-1 p-3 rounded-lg text-center"
            style={{ backgroundColor: card }}
          >
            <MapPin 
              className="w-4 h-4 mx-auto mb-1" 
              style={{ color: primary }}
            />
            <p className="text-[10px] opacity-60">Local</p>
            <p className="text-xs font-medium">Igreja</p>
          </div>
        </div>

        {/* Gift Section Preview */}
        <div className="text-center pt-2">
          <Gift 
            className="w-5 h-5 mx-auto mb-1" 
            style={{ color: primary }}
          />
          <p className="text-xs font-medium mb-2">
            {themeConfig.giftsTitle || 'Lista de Presentes'}
          </p>
          <button
            className="text-xs px-4 py-2 rounded-full transition-all"
            style={{ 
              backgroundColor: primary,
              color: primaryFg
            }}
          >
            {themeConfig.giftsButtonText || 'Ver Presentes'}
          </button>
        </div>

        {/* Footer Preview */}
        <div 
          className="mt-3 p-3 rounded-lg text-center"
          style={{ 
            backgroundColor: text,
            color: primaryFg
          }}
        >
          <Heart 
            className="w-4 h-4 mx-auto" 
            fill={accent}
            style={{ color: accent }}
          />
          <p className="text-[10px] mt-1 opacity-70">Footer</p>
        </div>
      </div>
    </div>
  );
}
