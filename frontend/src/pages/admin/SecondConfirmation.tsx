import { useState } from 'react';
import { 
  useReconfirmationMetrics, 
  useGuestsForReconfirmation, 
  useSendSecondConfirmation,
  useSendSecondConfirmationToAll 
} from '@/hooks/useReconfirmation';
import { useEvent } from '@/contexts/EventContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Users, 
  Check, 
  X, 
  Clock, 
  Send, 
  Copy, 
  MessageCircle,
  Loader2,
  Search,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FeatureGuard } from '@/components/common/FeatureGuard';

type FilterStatus = 'all' | 'sent' | 'not-sent' | 'confirmed' | 'declined' | 'pending';

export default function SecondConfirmationPage() {
  const { currentEvent } = useEvent();
  const { data: metrics, isLoading: metricsLoading } = useReconfirmationMetrics(currentEvent?.id);
  const { data: guests, isLoading: guestsLoading } = useGuestsForReconfirmation(currentEvent?.id);
  const sendSecondConfirmation = useSendSecondConfirmation();
  const sendToAll = useSendSecondConfirmationToAll();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const metricCards = [
    { 
      label: '1ª Confirmação', 
      value: metrics?.firstConfirmed || 0,
      detail: `${metrics?.firstConfirmedGuests || 0} conv. + ${metrics?.firstConfirmedCompanions || 0} acomp.`,
      icon: UserCheck, 
      color: 'text-primary' 
    },
    { 
      label: '2ª Confirmados', 
      value: metrics?.secondConfirmed || 0,
      detail: `${metrics?.secondConfirmedGuests || 0} conv. + ${metrics?.secondConfirmedCompanions || 0} acomp.`,
      icon: Check, 
      color: 'text-sage' 
    },
    { 
      label: '2ª Desistências', 
      value: metrics?.secondDeclined || 0,
      detail: `${metrics?.secondDeclinedGuests || 0} conv. + ${metrics?.secondDeclinedCompanions || 0} acomp.`,
      icon: UserX, 
      color: 'text-destructive' 
    },
    { 
      label: '2ª Pendentes', 
      value: metrics?.secondPending || 0,
      detail: `${metrics?.secondPendingGuests || 0} conv. + ${metrics?.secondPendingCompanions || 0} acomp.`,
      icon: Clock, 
      color: 'text-champagne' 
    },
    { 
      label: 'Não Enviados', 
      value: metrics?.notSent || 0,
      detail: `${metrics?.notSentGuests || 0} conv. + ${metrics?.notSentCompanions || 0} acomp.`,
      icon: AlertTriangle, 
      color: 'text-muted-foreground' 
    },
    { 
      label: 'Total Confirmados', 
      value: metrics?.totalConfirmedPeople || 0,
      detail: `${metrics?.totalConfirmedGuests || 0} conv. + ${metrics?.totalConfirmedCompanions || 0} acomp.`,
      icon: Users, 
      color: 'text-primary', 
      highlight: true 
    },
  ];

  const getReconfirmationLink = (token: string) => {
    return `${window.location.origin}/reconfirmar/${token}`;
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(getReconfirmationLink(token));
    toast.success('Link copiado!');
  };

  const openWhatsApp = (phone: string, name: string, token: string) => {
    const link = getReconfirmationLink(token);
    const message = 
      `Olá ${name}!\n\n` +
      `Estamos nos aproximando do grande dia do nosso evento!\n\n` +
      `Poderia revalidar sua presença? Acesse o link:\n${link}\n\n` +
      `Contamos com você!`;
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSendToGuest = async (guestId: string) => {
    try {
      await sendSecondConfirmation.mutateAsync(guestId);
      toast.success('Segunda confirmação enviada!');
    } catch (err) {
      toast.error('Erro ao enviar');
    }
  };

  const handleSendToAll = async () => {
    try {
      const count = await sendToAll.mutateAsync();
      toast.success(`Segunda confirmação enviada para ${count} convidado(s)!`);
    } catch (err) {
      toast.error('Erro ao enviar');
    }
  };

  const filteredGuests = guests?.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    switch (filterStatus) {
      case 'sent':
        matchesFilter = guest.second_confirmation_sent;
        break;
      case 'not-sent':
        matchesFilter = !guest.second_confirmation_sent;
        break;
      case 'confirmed':
        matchesFilter = guest.second_confirmation_status === 'accepted';
        break;
      case 'declined':
        matchesFilter = guest.second_confirmation_status === 'declined';
        break;
      case 'pending':
        matchesFilter = guest.second_confirmation_sent && guest.second_confirmation_status === null;
        break;
    }
    
    return matchesSearch && matchesFilter;
  }) || [];

  const getStatusBadge = (guest: typeof filteredGuests[0]) => {
    if (!guest.second_confirmation_sent) {
      return <Badge variant="secondary">Não enviado</Badge>;
    }
    if (guest.second_confirmation_status === 'accepted') {
      return <Badge variant="default" className="bg-sage text-secondary-foreground">Reconfirmado</Badge>;
    }
    if (guest.second_confirmation_status === 'declined') {
      return <Badge variant="destructive">Desistiu</Badge>;
    }
    return <Badge variant="outline">Pendente</Badge>;
  };

  if (!currentEvent) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Selecione um evento para gerenciar confirmações</p>
      </div>
    );
  }

  return (
    <FeatureGuard feature="segunda_confirmacao">
      <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl mb-2">Segunda Confirmação de Presença</h1>
        <p className="text-muted-foreground">Gerencie a reconfirmação de presença dos convidados</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricCards.map((card) => (
          <Card key={card.label} variant={card.highlight ? 'default' : 'elegant'} className={card.highlight ? 'border-primary' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground flex items-center gap-2">
                <card.icon className={`w-4 h-4 ${card.color}`} />
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-serif ${card.color}`}>
                {metricsLoading ? '...' : card.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {metricsLoading ? '' : card.detail}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <Card variant="elegant">
        <CardHeader>
          <CardTitle>Enviar Segunda Confirmação</CardTitle>
          <CardDescription>
            Envie a solicitação de reconfirmação para os convidados que confirmaram na primeira etapa
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Send className="w-4 h-4" /> Enviar para Todos
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar envio em massa</DialogTitle>
                <DialogDescription>
                  Isso irá gerar links de reconfirmação para todos os {metrics?.notSent || 0} convidados 
                  que confirmaram na primeira etapa e ainda não receberam a segunda confirmação.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={handleSendToAll} disabled={sendToAll.isPending}>
                    {sendToAll.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirmar Envio
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="sent">Enviados</SelectItem>
            <SelectItem value="not-sent">Não enviados</SelectItem>
            <SelectItem value="confirmed">Reconfirmados</SelectItem>
            <SelectItem value="declined">Desistências</SelectItem>
            <SelectItem value="pending">Aguardando resposta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Guests Table */}
      <Card variant="elegant">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>1ª Confirmação</TableHead>
                <TableHead>2ª Confirmação</TableHead>
                <TableHead>Acompanhantes</TableHead>
                <TableHead>Data Resposta</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guestsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredGuests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum convidado encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredGuests.map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium">{guest.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sage">
                        <Check className="w-4 h-4" />
                        <span>{1 + (guest.companions || 0)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(guest)}</TableCell>
                    <TableCell>
                      {guest.second_confirmation_status === 'accepted' 
                        ? `${guest.second_confirmation_companions ?? guest.companions ?? 0}`
                        : guest.second_confirmation_sent
                        ? '-'
                        : `${guest.companions ?? 0}`}
                    </TableCell>
                    <TableCell>
                      {guest.second_confirmation_responded_at 
                        ? format(new Date(guest.second_confirmation_responded_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!guest.second_confirmation_sent ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSendToGuest(guest.id)}
                            disabled={sendSecondConfirmation.isPending}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        ) : guest.reconfirmation_token && guest.second_confirmation_status === null ? (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => copyLink(guest.reconfirmation_token!)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            {guest.phone && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openWhatsApp(guest.phone!, guest.name, guest.reconfirmation_token!)}
                              >
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </FeatureGuard>
  );
}