import { Heart } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import heroImage from '@/assets/wedding-hero.jpg';
import { Event } from '@/contexts/EventContext';

interface HeroSectionProps {
  event?: Event;
}

export function HeroSection({ event }: HeroSectionProps) {
  // Parse date without timezone issues - treat as local date
  const formattedDate = event?.event_date
    ? (() => {
        const dateStr = event.event_date.split('T')[0];
        const [year, month, day] = dateStr.split('-').map(Number);
        return format(new Date(year, month - 1, day), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
      })()
    : null;

  const eventName = event?.event_name || 'João & Jamily';
  const heroSubtitle = event?.theme_config?.heroSubtitle || 'Celebração de Amor';

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={event?.hero_image_url || heroImage}
          alt={eventName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--event-foreground,var(--foreground)))]/30 via-[hsl(var(--event-foreground,var(--foreground)))]/20 to-[hsl(var(--event-foreground,var(--foreground)))]/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 py-20 animate-fade-in">
        <div className="mb-6">
          <Heart className="w-12 h-12 mx-auto text-[hsl(var(--event-accent,var(--dusty-rose)))] animate-float" fill="currentColor" />
        </div>

        <p className="text-[hsl(var(--event-background,var(--champagne-light)))] text-lg md:text-xl font-light tracking-widest uppercase mb-4">
          {heroSubtitle}
        </p>

        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-[hsl(var(--event-primary-foreground,var(--ivory)))] mb-6 tracking-wide">
          {eventName}
        </h1>

        {formattedDate && (
          <p className="text-[hsl(var(--event-background,var(--champagne-light)))] text-xl md:text-2xl font-light tracking-wider mb-8">
            {formattedDate}
          </p>
        )}

        {event?.venue_name && (
          <div className="text-[hsl(var(--event-primary-foreground,var(--ivory)))]/90 text-base md:text-lg font-light">
            <p>{event.venue_name}</p>
            {event.venue_address && (
              <p className="text-[hsl(var(--event-primary-foreground,var(--ivory)))]/70 mt-1">{event.venue_address}</p>
            )}
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-[hsl(var(--event-primary-foreground,var(--ivory)))]/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-[hsl(var(--event-primary-foreground,var(--ivory)))]/70 rounded-full mt-2" />
        </div>
      </div>
    </section>
  );
}
