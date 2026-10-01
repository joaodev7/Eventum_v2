import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useGuestByReconfirmationToken, useRespondToReconfirmation } from '@/hooks/useReconfirmation';
import { EventThemeProvider } from '@/components/public/EventThemeProvider';
import { SeoHead } from '@/components/common/SeoHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Heart, Check, X, Loader2, Calendar, MapPin, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import heroImage from '@/assets/wedding-hero.jpg';

export default function ReconfirmationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { data: guest, isLoading: guestLoading, error } = useGuestByReconfirmationToken(token || '');
  const respondToReconfirmation = useRespondToReconfirmation();
  const [selectedCompanions, setSelectedCompanions] = useState<string[]>([]);
  const [responded, setResponded] = useState(false);

  // Get event info from guest data
  const eventInfo = guest?.event_info;

  // Already responded check
  const hasResponded = responded || (guest?.second_confirmation_status !== null);
  const hasCompanions = guest?.companions_list && guest.companions_list.length > 0;

  // Pre-select companions that were attending in first confirmation
  useEffect(() => {
    if (guest?.companions_list) {
      const attending = guest.companions_list
        .filter(c => c.will_attend === true)
        .map(c => c.id);
      setSelectedCompanions(attending);
    }
  }, [guest]);

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
      await respondToReconfirmation.mutateAsync({ token, status, companion_ids: companionIds });
      setResponded(true);
      toast.success(status === 'accepted' ? 'Presença reconfirmada!' : 'Resposta registrada.');
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
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>
              Este link de reconfirmação não é válido, expirou ou você ainda não foi selecionado para a segunda confirmação.
            </CardDescription>
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
        title={`Reconfirmação de Presença — ${eventInfo?.event_name || 'Evento'}`}
        description={`Reconfirmação final de presença para o evento ${eventInfo?.event_name || ''}.`}
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
              {/* Revalidation badge */}
              <div className="flex justify-center mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--event-primary,var(--primary)))]/10 text-[hsl(var(--event-primary,var(--primary)))] text-sm font-medium">
                  <RefreshCw className="w-4 h-4" />
                  Revalidação de Presença
                </span>
              </div>
              <CardTitle className="text-2xl">Olá, {guest.name}!</CardTitle>
              <CardDescription className="text-base">
                {hasResponded 
                  ? guest.second_confirmation_status === 'accepted' 
                    ? 'Você reconfirmou sua presença!' 
                    : 'Você informou que não poderá comparecer'
                  : 'Estamos nos aproximando do grande dia! Poderia confirmar sua presença mais uma vez?'}
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

              {/* Reconfirmation Form */}
              {!hasResponded ? (
                <div className="space-y-5">
                  {/* Previous confirmation info */}
                  <div className="p-4 bg-[hsl(var(--event-secondary,var(--sage)))]/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Sua confirmação anterior:</p>
                    <p className="font-medium">
                      Você {guest.companions && guest.companions > 0 ? `+ ${guest.companions} acompanhante(s)` : '(sem acompanhantes)'}
                    </p>
                  </div>

                  {/* Companions selection - same as first confirmation */}
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
                      <p className="text-xs text-muted-foreground text-center">
                        Total: {1 + selectedCompanions.length} pessoa(s)
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="success" 
                      className="flex-1" 
                      size="lg"
                      onClick={() => handleResponse('accepted')}
                      disabled={respondToReconfirmation.isPending}
                    >
                      <Check className="w-5 h-5" /> Confirmar Presença
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      size="lg"
                      onClick={() => handleResponse('declined')}
                      disabled={respondToReconfirmation.isPending}
                    >
                      <X className="w-5 h-5" /> Não poderei ir
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  {guest.second_confirmation_status === 'accepted' ? (
                    <div className="space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-full bg-[hsl(var(--event-secondary,var(--sage)))] flex items-center justify-center">
                        <Check className="w-8 h-8 text-secondary-foreground" />
                      </div>
                      <p className="text-lg font-medium">Presença Reconfirmada!</p>
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