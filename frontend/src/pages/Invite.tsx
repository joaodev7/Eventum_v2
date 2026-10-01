import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useGuestByToken, useMarkInviteViewed } from '@/hooks/useGuests';
import { useRespondWithCompanions } from '@/hooks/useGuestCompanions';
import { EventThemeProvider } from '@/components/public/EventThemeProvider';
import { SeoHead } from '@/components/common/SeoHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Heart, Check, X, Loader2, Calendar, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import heroImage from '@/assets/wedding-hero.jpg';

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { data: guest, isLoading: guestLoading, error } = useGuestByToken(token || '');
  const markViewed = useMarkInviteViewed();
  const respondWithCompanions = useRespondWithCompanions();
  const [selectedCompanions, setSelectedCompanions] = useState<string[]>([]);
  const [responded, setResponded] = useState(false);

  // Get event info from guest data
  const eventInfo = guest?.event_info;

  // Calculate if already responded based on current guest OR local state after responding
  const hasResponded = responded || (guest?.status !== 'pending');
  const hasCompanions = guest?.companions_list && guest.companions_list.length > 0;

  useEffect(() => {
    if (guest && !guest.has_viewed && token) {
      markViewed.mutate(token);
    }
    // Pre-select companions that are already marked as attending
    if (guest?.companions_list) {
      const attending = guest.companions_list
        .filter(c => c.will_attend === true)
        .map(c => c.id);
      setSelectedCompanions(attending);
    }
  }, [guest, token]);

  const toggleCompanion = (id: string) => {
    setSelectedCompanions(prev => 
      prev.includes(id) 
        ? prev.filter(cid => cid !== id)
        : [...prev, id]
    );
  };

  const handleResponse = async (status: 'accepted' | 'declined') => {
    if (!token) return;
    
    try {
      const companionIds = status === 'accepted' ? selectedCompanions : [];
      await respondWithCompanions.mutateAsync({ token, status, companion_ids: companionIds });
      setResponded(true);
      toast.success(status === 'accepted' ? 'Presença confirmada!' : 'Resposta registrada.');
    } catch (err) {
      toast.error('Erro ao registrar resposta');
    }
  };

  if (guestLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card variant="elegant" className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Convite não encontrado</CardTitle>
            <CardDescription>Este link de convite não é válido ou expirou.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')}>Voltar ao Início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formattedDate = eventInfo?.event_date
    ? (() => {
        // Extrair apenas a data (YYYY-MM-DD) ignorando timezone
        const dateStr = eventInfo.event_date;
        const datePart = dateStr.includes('T') 
          ? dateStr.split('T')[0] 
          : dateStr.split(' ')[0];
        // Usar meio-dia para evitar problemas de fuso horário
        return format(new Date(datePart + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
      })()
    : null;

  const formattedTime = eventInfo?.event_time
    ? eventInfo.event_time
    : eventInfo?.event_date
    ? (() => {
        const date = new Date(eventInfo.event_date);
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      })()
    : null;

  // Get confirmed companions for display after response
  const confirmedCompanions = guest.companions_list?.filter(c => c.will_attend === true) || [];

  // Build theme config from event info
  const themeConfig = eventInfo?.theme_config || {};

  return (
    <EventThemeProvider themeConfig={themeConfig}>
      <SeoHead
        title={`Convite Especial — ${eventInfo?.event_name || 'Evento'}`}
        description={`Convite personalizado e confirmação de presença (RSVP) para o evento ${eventInfo?.event_name || ''}.`}
        noIndex={true}
        ogImage={eventInfo?.hero_image_url || heroImage}
      />
      <div className="min-h-screen">
        {/* Hero */}
        <div className="relative h-64 md:h-80">
          <img src={eventInfo?.hero_image_url || heroImage} alt="Evento" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[hsl(var(--event-foreground,var(--foreground)))]/40 flex items-center justify-center">
            <div className="text-center">
              <Heart className="w-10 h-10 mx-auto text-[hsl(var(--event-accent,var(--dusty-rose)))] mb-3" fill="currentColor" />
              <h1 className="font-serif text-4xl md:text-5xl text-[hsl(var(--event-primary-foreground,var(--ivory)))]">{eventInfo?.event_name || 'Evento'}</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container max-w-lg mx-auto px-4 py-12 -mt-10 relative z-10">
          <Card variant="elegant" className="animate-scale-in">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Olá, {guest.name}!</CardTitle>
              <CardDescription>
                {hasResponded 
                  ? guest.status === 'accepted' 
                    ? 'Você confirmou presença!' 
                    : 'Você não poderá comparecer'
                  : 'Você está convidado(a) para nosso evento'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Event Info */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                {formattedDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-[hsl(var(--event-primary,var(--primary)))]" />
                    <span className="capitalize">
                      {formattedDate}{formattedTime && `, às ${formattedTime}`}
                    </span>
                  </div>
                )}
                {eventInfo?.venue_name && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-[hsl(var(--event-primary,var(--primary)))]" />
                    <span>{eventInfo.venue_name}</span>
                  </div>
                )}
              </div>

              {/* RSVP Form */}
              {!hasResponded ? (
                <div className="space-y-4">
                  {/* Companions selection */}
                  {hasCompanions && (
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Users className="w-4 h-4" /> Quem irá com você?
                      </Label>
                      <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                        {guest.companions_list!.map((companion) => (
                          <div key={companion.id} className="flex items-center space-x-3">
                            <Checkbox
                              id={companion.id}
                              checked={selectedCompanions.includes(companion.id)}
                              onCheckedChange={() => toggleCompanion(companion.id)}
                            />
                            <Label 
                              htmlFor={companion.id} 
                              className="text-sm font-normal cursor-pointer"
                            >
                              {companion.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="success" 
                      className="flex-1" 
                      size="lg"
                      onClick={() => handleResponse('accepted')}
                      disabled={respondWithCompanions.isPending}
                    >
                      <Check className="w-5 h-5" /> Confirmar
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      size="lg"
                      onClick={() => handleResponse('declined')}
                      disabled={respondWithCompanions.isPending}
                    >
                      <X className="w-5 h-5" /> Não poderei ir
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  {guest.status === 'accepted' ? (
                    <div className="space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-full bg-[hsl(var(--event-secondary,var(--sage)))] flex items-center justify-center">
                        <Check className="w-8 h-8 text-secondary-foreground" />
                      </div>
                      <p className="text-lg font-medium">Presença Confirmada!</p>
                      {confirmedCompanions.length > 0 && (
                        <div className="text-muted-foreground">
                          <p className="mb-1">Acompanhantes confirmados:</p>
                          <ul className="space-y-1">
                            {confirmedCompanions.map(c => (
                              <li key={c.id} className="text-sm">{c.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                        <X className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium">Sentiremos sua falta!</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </EventThemeProvider>
  );
}