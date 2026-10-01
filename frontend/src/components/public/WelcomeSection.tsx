import { Heart, Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CountdownTimer } from './CountdownTimer';
import { Button } from '@/components/ui/button';
import { Event } from '@/contexts/EventContext';

interface WelcomeSectionProps {
  event?: Event;
}

export function WelcomeSection({ event }: WelcomeSectionProps) {
  // Parse date without timezone issues - treat as local date
  const eventDate = event?.event_date ? (() => {
    const dateStr = event.event_date.split('T')[0]; // Get just the date part YYYY-MM-DD
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // Create date in local timezone
  })() : null;
  
  const eventTime = event?.event_time || null;
  
  const formattedDate = eventDate ? format(eventDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR }) : null;
  
  // Biblical quote from theme config
  const biblicalQuote = event?.theme_config?.biblicalQuote || 'O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.';
  const biblicalQuoteReference = event?.theme_config?.biblicalQuoteReference || '1 Coríntios 13:4';

  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-[hsl(var(--event-background,var(--background)))] to-[hsl(var(--event-background,var(--champagne-light)))]/20">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center animate-slide-up">
          <div className="inline-flex items-center gap-2 mb-8">
            <div className="h-px w-12 bg-[hsl(var(--event-primary,var(--primary)))]/30" />
            <Heart className="w-5 h-5 text-[hsl(var(--event-accent,var(--dusty-rose)))]" />
            <div className="h-px w-12 bg-[hsl(var(--event-primary,var(--primary)))]/30" />
          </div>

          <h2 className="font-serif text-4xl md:text-5xl text-[hsl(var(--event-foreground,var(--foreground)))] mb-8">
            Bem-vindos
          </h2>

          <p className="text-lg md:text-xl text-[hsl(var(--event-muted-foreground,var(--muted-foreground)))] leading-relaxed max-w-2xl mx-auto mb-6">
            {event?.welcome_message || 
              'Estamos muito felizes em compartilhar este momento especial com você! Será uma honra ter sua presença em nossa celebração de amor.'}
          </p>

          {/* Biblical Quote */}
          {biblicalQuote && (
            <div className="bg-[hsl(var(--event-card,var(--card)))]/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 mb-12 border border-[hsl(var(--event-primary,var(--primary)))]/10 max-w-2xl mx-auto">
              <p className="font-serif text-lg md:text-xl text-[hsl(var(--event-foreground,var(--foreground)))] italic leading-relaxed">
                "{biblicalQuote}"
              </p>
              {biblicalQuoteReference && (
                <p className="text-sm text-[hsl(var(--event-muted-foreground,var(--muted-foreground)))] mt-3 font-medium">
                  {biblicalQuoteReference}
                </p>
              )}
            </div>
          )}

          {/* Countdown Timer */}
          {event?.settings?.showCountdown !== false && eventDate && (
            <div className="mb-12">
              <p className="text-sm text-[hsl(var(--event-muted-foreground,var(--muted-foreground)))] uppercase tracking-widest mb-6">
                Contagem Regressiva
              </p>
              <CountdownTimer targetDate={eventDate} />
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {/* Date Card */}
            {formattedDate && (
              <div className="flex flex-col items-center p-6 rounded-xl bg-[hsl(var(--event-card,var(--card)))] shadow-soft">
                <Calendar className="w-8 h-8 text-[hsl(var(--event-primary,var(--primary)))] mb-3" />
                <p className="text-sm text-[hsl(var(--event-muted-foreground,var(--muted-foreground)))] uppercase tracking-wider mb-1">Data</p>
                <p className="font-serif text-lg text-[hsl(var(--event-foreground,var(--foreground)))] capitalize">{formattedDate}</p>
              </div>
            )}

            {/* Time Card */}
            {eventTime && (
              <div className="flex flex-col items-center p-6 rounded-xl bg-[hsl(var(--event-card,var(--card)))] shadow-soft">
                <Clock className="w-8 h-8 text-[hsl(var(--event-primary,var(--primary)))] mb-3" />
                <p className="text-sm text-[hsl(var(--event-muted-foreground,var(--muted-foreground)))] uppercase tracking-wider mb-1">Horário</p>
                <p className="font-serif text-lg text-[hsl(var(--event-foreground,var(--foreground)))]">A partir das {eventTime}</p>
              </div>
            )}

            {/* Location Card */}
            {event?.settings?.showLocation !== false && event?.venue_name && (
              <div className="flex flex-col items-center p-6 rounded-xl bg-[hsl(var(--event-card,var(--card)))] shadow-soft">
                <MapPin className="w-8 h-8 text-[hsl(var(--event-primary,var(--primary)))] mb-3" />
                <p className="text-sm text-[hsl(var(--event-muted-foreground,var(--muted-foreground)))] uppercase tracking-wider mb-1">Local</p>
                <p className="font-serif text-lg text-[hsl(var(--event-foreground,var(--foreground)))]">{event.venue_name}</p>
                {event.venue_address && (
                  <p className="text-sm text-[hsl(var(--event-muted-foreground,var(--muted-foreground)))] mt-1 text-center">
                    {event.venue_address}
                  </p>
                )}
                {event.venue_maps_link && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="mt-2 text-[hsl(var(--event-primary,var(--primary)))]"
                    asChild
                  >
                    <a 
                      href={event.venue_maps_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Ver no mapa
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
