import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { eventsApi } from '@/api/events';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useUserRole';
import { useEvent } from '@/contexts/EventContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Heart, PartyPopper, GraduationCap, Cake, Building, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const eventTypes = [
  { value: 'wedding', label: 'Casamento', icon: Heart },
  { value: 'birthday', label: 'Aniversário', icon: Cake },
  { value: 'graduation', label: 'Formatura', icon: GraduationCap },
  { value: 'party', label: 'Festa', icon: PartyPopper },
  { value: 'corporate', label: 'Corporativo', icon: Building },
  { value: 'other', label: 'Outro', icon: Calendar },
];

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { refreshEvents } = useEvent();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    event_name: '',
    event_type: 'wedding',
    event_date: '',
    venue_name: '',
    venue_address: '',
  });

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.event_name.trim()) {
      toast.error('Nome do evento é obrigatório');
      return;
    }

    try {
      setIsCreating(true);
      
      await eventsApi.createEvent({
        eventName: formData.event_name,
        eventType: formData.event_type,
        eventDate: formData.event_date || undefined,
        venueName: formData.venue_name || undefined,
        venueAddress: formData.venue_address || undefined,
      });

      await refreshEvents();
      toast.success('Evento criado com sucesso!');
      navigate('/admin');
    } catch (err: any) {
      console.error('Error creating event:', err);
      toast.error(err.response?.data?.error || err.message || 'Erro ao criar evento');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/admin">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Painel
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Criar Novo Evento</CardTitle>
            <CardDescription>
              Preencha as informações básicas do seu evento. Você poderá editar tudo depois.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="event_name">Nome do Evento *</Label>
                <Input
                  id="event_name"
                  placeholder="Ex: Gala de Premiação Firenze"
                  value={formData.event_name}
                  onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_type">Tipo de Evento</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_date">Data do Evento</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue_name">Nome do Local</Label>
                <Input
                  id="venue_name"
                  placeholder="Ex: Espaço Jardins"
                  value={formData.venue_name}
                  onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue_address">Endereço</Label>
                <Input
                  id="venue_address"
                  placeholder="Ex: Rua das Flores, 123 - São Paulo"
                  value={formData.venue_address}
                  onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Criando...
                  </>
                ) : (
                  'Criar Evento'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
