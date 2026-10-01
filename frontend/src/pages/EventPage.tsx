import { useParams, Link } from 'react-router-dom';
import { useEventBySlug } from '@/contexts/EventContext';
import { EventThemeProvider } from '@/components/public/EventThemeProvider';
import { HeroSection } from '@/components/public/HeroSection';
import { WelcomeSection } from '@/components/public/WelcomeSection';
import { GallerySection } from '@/components/public/GallerySection';
import { Footer } from '@/components/public/Footer';
import { SeoHead } from '@/components/common/SeoHead';
import { Button } from '@/components/ui/button';
import { Gift, Loader2 } from 'lucide-react';

const EventPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { event, isLoading, error } = useEventBySlug(slug || '');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-3xl font-serif text-foreground">Evento não encontrado</h1>
          <p className="text-muted-foreground">
            O evento que você procura não existe ou não está disponível.
          </p>
          <Button asChild>
            <Link to="/">Voltar ao Início</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Get customizable texts from theme_config
  const giftsTitle = event.theme_config?.giftsTitle || 'Lista de Presentes';
  const giftsDescription = event.theme_config?.giftsDescription || 
    'Sua presença é nosso maior presente! Mas se desejar nos presentear, acesse nossa lista e escolha um item especial.';
  const giftsButtonText = event.theme_config?.giftsButtonText || 'Ver Lista de Presentes';

  const eventJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    'name': event.event_name,
    'startDate': event.event_date ? `${event.event_date}${event.event_time ? `T${event.event_time}` : ''}` : undefined,
    'location': {
      '@type': 'Place',
      'name': event.venue_name || 'Local da Celebração',
      'address': event.venue_address || undefined,
    },
    'image': event.hero_image_url ? [event.hero_image_url] : undefined,
    'description': event.welcome_message || `Celebração e convite para o evento ${event.event_name}`,
    'eventStatus': 'https://schema.org/EventScheduled',
    'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
  };

  return (
    <EventThemeProvider themeConfig={event.theme_config}>
      <SeoHead
        title={`${event.event_name} — Informações & Celebração`}
        description={event.welcome_message ? event.welcome_message.slice(0, 155) : `Celebração de ${event.event_name}. Veja data, local, mapas e lista de presentes online.`}
        ogImage={event.hero_image_url || undefined}
        ogType="event"
        jsonLd={eventJsonLd}
      />
      <main className="min-h-screen">
        <HeroSection event={event} />
        <WelcomeSection event={event} />
        {event.settings?.showGallery !== false && event.gallery_images?.length > 0 && (
          <GallerySection event={event} />
        )}
        
        {event.settings?.showGifts !== false && (
          <section className="py-16 bg-[hsl(var(--event-background,var(--champagne-light)))]">
            <div className="container mx-auto px-4 text-center">
              <Gift className="w-12 h-12 mx-auto text-[hsl(var(--event-primary,var(--primary)))] mb-4" />
              <h2 className="text-3xl font-serif mb-4 text-[hsl(var(--event-foreground,var(--foreground)))]">{giftsTitle}</h2>
              <p className="text-[hsl(var(--event-muted-foreground,var(--muted-foreground)))] mb-6 max-w-xl mx-auto">
                {giftsDescription}
              </p>
              <Button asChild size="lg">
                <Link to={`/evento/${event.slug}/presentes`}>
                  <Gift className="w-4 h-4 mr-2" />
                  {giftsButtonText}
                </Link>
              </Button>
            </div>
          </section>
        )}
        
        <Footer event={event} />
      </main>
    </EventThemeProvider>
  );
};

export default EventPage;
