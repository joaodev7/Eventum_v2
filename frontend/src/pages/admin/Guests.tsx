import { useState, useEffect } from 'react';
import { useEvent } from '@/contexts/EventContext';
import { useGuests, useCreateGuest, useDeleteGuest, useRegenerateToken, useDashboardMetrics, useUpdateGuest } from '@/hooks/useGuests';
import { useGuestCompanions, useCreateCompanion, useDeleteCompanion } from '@/hooks/useGuestCompanions';
import { useTables } from '@/hooks/useTables';
import { useSendInviteEmail } from '@/hooks/useInviteEmail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, RefreshCw, Copy, MessageCircle, Eye, Users, UserPlus, X, Loader2, Mail, MailCheck, Send, Download, Check, Clock, User, UsersRound, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { GuestGroup, InviteStatus, guestGroupLabels, inviteStatusLabels, inviteStatusColors, GuestWithTable, Table } from '@/lib/types';
import { FeatureGuard } from '@/components/common/FeatureGuard';

// Component to manage companions for a guest
function CompanionManager({ guest }: { guest: GuestWithTable }) {
  const [newName, setNewName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { data: companions, isLoading } = useGuestCompanions(guest.id);
  const createCompanion = useCreateCompanion();
  const deleteCompanion = useDeleteCompanion();

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await createCompanion.mutateAsync({ guest_id: guest.id, name: newName.trim(), event_id: guest.event_id });
      setNewName('');
      toast.success('Acompanhante adicionado!');
    } catch {
      toast.error('Erro ao adicionar');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCompanion.mutateAsync({ id, guest_id: guest.id });
      toast.success('Acompanhante removido');
    } catch {
      toast.error('Erro ao remover');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" title="Gerenciar acompanhantes">
          <UserPlus className="w-4 h-4" />
          {companions && companions.length > 0 && (
            <span className="ml-1 text-xs">{companions.length}</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Acompanhantes de {guest.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Add new companion */}
          <div className="flex gap-2">
            <Input
              placeholder="Nome do acompanhante"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={createCompanion.isPending || !newName.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* List companions */}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : companions && companions.length > 0 ? (
            <div className="space-y-2">
              {companions.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span>{c.name}</span>
                    {c.will_attend === true && (
                      <Badge variant="outline" className="text-xs bg-sage/20 text-sage-dark">Confirmado</Badge>
                    )}
                    {c.will_attend === false && (
                      <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive">Não vai</Badge>
                    )}
                    {c.will_attend === null && (
                      <Badge variant="outline" className="text-xs">Pendente</Badge>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)}>
                    <X className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum acompanhante cadastrado
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Modal for bulk email sending
function BulkEmailModal({ 
  guests, 
  eventId, 
  isOpen, 
  onClose 
}: { 
  guests: GuestWithTable[];
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [onlyPending, setOnlyPending] = useState(false);
  const [onlyNotSent, setOnlyNotSent] = useState(true);
  const sendInviteEmail = useSendInviteEmail();

  // Filter guests with email
  const guestsWithEmail = guests.filter(g => g.email);
  
  // Apply additional filters
  const filteredGuests = guestsWithEmail.filter(g => {
    if (onlyPending && g.status !== 'pending') return false;
    if (onlyNotSent && (g as GuestWithTable & { invite_email_sent_at?: string | null }).invite_email_sent_at) return false;
    return true;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredGuests.map(g => g.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggle = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleSend = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos um convidado');
      return;
    }

    await sendInviteEmail.mutateAsync({ guest_ids: selectedIds, event_id: eventId });
    onClose();
    setSelectedIds([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Enviar Convites por Email
          </DialogTitle>
          <DialogDescription>
            Selecione os convidados que receberão o convite por email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox 
                checked={onlyPending} 
                onCheckedChange={(c) => setOnlyPending(c === true)} 
              />
              Apenas pendentes
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox 
                checked={onlyNotSent} 
                onCheckedChange={(c) => setOnlyNotSent(c === true)} 
              />
              Nunca receberam email
            </label>
          </div>

          {/* Select all */}
          <div className="flex items-center justify-between border-b pb-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox 
                checked={selectedIds.length === filteredGuests.length && filteredGuests.length > 0}
                onCheckedChange={handleSelectAll}
              />
              Selecionar todos ({filteredGuests.length})
            </label>
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} selecionado(s)
            </span>
          </div>

          {/* Guest list */}
          <div className="overflow-y-auto max-h-[300px] space-y-2">
            {filteredGuests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum convidado corresponde aos filtros
              </p>
            ) : (
              filteredGuests.map(guest => (
                <label 
                  key={guest.id} 
                  className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer"
                >
                  <Checkbox 
                    checked={selectedIds.includes(guest.id)}
                    onCheckedChange={(c) => handleToggle(guest.id, c === true)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{guest.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{guest.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={inviteStatusColors[guest.status]} variant="outline">
                      {inviteStatusLabels[guest.status]}
                    </Badge>
                    {(guest as GuestWithTable & { invite_email_sent_at?: string | null }).invite_email_sent_at && (
                      <MailCheck className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleSend} 
            disabled={selectedIds.length === 0 || sendInviteEmail.isPending}
          >
            {sendInviteEmail.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar para {selectedIds.length}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Modal for editing guest
function EditGuestModal({
  guest,
  tables,
  isOpen,
  onClose
}: {
  guest: GuestWithTable;
  tables: Table[] | undefined;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: guest.name,
    email: guest.email || '',
    phone: guest.phone || '',
    guest_group: guest.guest_group,
    table_id: guest.table_id,
    status: guest.status,
    notes: guest.notes || '',
  });

  const updateGuest = useUpdateGuest();

  // Reset form when guest changes
  useEffect(() => {
    setFormData({
      name: guest.name,
      email: guest.email || '',
      phone: guest.phone || '',
      guest_group: guest.guest_group,
      table_id: guest.table_id,
      status: guest.status,
      notes: guest.notes || '',
    });
  }, [guest]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    try {
      await updateGuest.mutateAsync({
        id: guest.id,
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        guest_group: formData.guest_group,
        table_id: formData.table_id,
        status: formData.status,
        notes: formData.notes || null,
      });
      toast.success('Convidado atualizado!');
      onClose();
    } catch {
      toast.error('Erro ao atualizar convidado');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Convidado</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <Label>Telefone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <Label>Grupo</Label>
            <Select
              value={formData.guest_group}
              onValueChange={(v) => setFormData({ ...formData, guest_group: v as GuestGroup })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(guestGroupLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData({ ...formData, status: v as InviteStatus })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(inviteStatusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Mesa</Label>
            <Select
              value={formData.table_id || 'none'}
              onValueChange={(v) => setFormData({ ...formData, table_id: v === 'none' ? null : v })}
            >
              <SelectTrigger><SelectValue placeholder="Sem mesa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem mesa</SelectItem>
                {tables?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre o convidado..."
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={updateGuest.isPending}>
              {updateGuest.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function GuestsPage() {
  const { currentEvent, isLoadingEvents } = useEvent();
  const [statusFilter, setStatusFilter] = useState<InviteStatus | 'all'>('all');
  const [groupFilter, setGroupFilter] = useState<GuestGroup | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestWithTable | null>(null);

  const filters = statusFilter !== 'all' || groupFilter !== 'all'
    ? { 
        status: statusFilter !== 'all' ? statusFilter : undefined,
        group: groupFilter !== 'all' ? groupFilter : undefined 
      }
    : undefined;

  const { data: guests, isLoading } = useGuests(currentEvent?.id, filters);
  const { data: tables } = useTables(currentEvent?.id);
  const { data: metrics } = useDashboardMetrics(currentEvent?.id);
  const createGuest = useCreateGuest();
  const deleteGuest = useDeleteGuest();
  const regenerateToken = useRegenerateToken();
  const sendInviteEmail = useSendInviteEmail();

  const [newGuest, setNewGuest] = useState({
    name: '', email: '', phone: '', guest_group: 'other' as GuestGroup, table_id: null as string | null,
  });

  const handleCreate = async () => {
    if (!newGuest.name.trim() || !currentEvent) {
      toast.error('Nome é obrigatório');
      return;
    }
    try {
      await createGuest.mutateAsync({ 
        ...newGuest, 
        status: 'pending', 
        companions: 0, 
        notes: null,
        event_id: currentEvent.id
      });
      toast.success('Convidado adicionado!');
      setDialogOpen(false);
      setNewGuest({ name: '', email: '', phone: '', guest_group: 'other', table_id: null });
    } catch {
      toast.error('Erro ao adicionar convidado');
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/convite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const openWhatsApp = (phone: string, name: string, token: string) => {
    const baseUrl = window.location.origin;
    const siteUrl = `${baseUrl}/evento/${currentEvent?.slug}`;
    const confirmUrl = `${baseUrl}/convite/${token}`;
    const giftsUrl = `${baseUrl}/evento/${currentEvent?.slug}/presentes`;
    const message = 
      `Olá ${name}!\n\n` +
      `Venha celebrar conosco nesse dia especial, o nosso casamento!\n\n` +
      `Visite nosso site: ${siteUrl}\n\n` +
      `Confirme sua presença: ${confirmUrl}\n\n` +
      `Lista de presentes: ${giftsUrl}\n\n` +
      `Com amor,\nJoão e Jamily`;
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSendEmail = async (guest: GuestWithTable) => {
    if (!guest.email || !currentEvent) return;
    await sendInviteEmail.mutateAsync({ 
      guest_ids: [guest.id], 
      event_id: currentEvent.id 
    });
  };

  // Count guests with email
  const guestsWithEmail = guests?.filter(g => g.email).length || 0;

  // Export guests and companions to CSV
  const handleExportCSV = async () => {
    if (!guests || guests.length === 0) {
      toast.error('Nenhum convidado para exportar');
      return;
    }

    // CSV header
    const headers = [
      'Tipo',
      'Nome',
      'Email',
      'Telefone',
      'Grupo',
      'Status',
      'Mesa',
      'Visualizou',
      'Respondeu Em',
      'Convidado Principal'
    ];

    const rows: string[][] = [];

    // For each guest, add their row and their companions
    for (const guest of guests) {
      // Guest row
      rows.push([
        'Convidado',
        guest.name,
        guest.email || '',
        guest.phone || '',
        guestGroupLabels[guest.guest_group],
        inviteStatusLabels[guest.status],
        guest.table?.name || 'Sem mesa',
        guest.has_viewed ? 'Sim' : 'Não',
        guest.responded_at ? new Date(guest.responded_at).toLocaleDateString('pt-BR') : '',
        ''
      ]);

      // Use companions already loaded on guest
      const companions = guest.companions_list || [];

      if (companions && companions.length > 0) {
        for (const companion of companions) {
          rows.push([
            'Acompanhante',
            companion.name,
            '',
            '',
            '',
            companion.will_attend === true ? 'Confirmado' : companion.will_attend === false ? 'Recusado' : 'Pendente',
            '',
            '',
            '',
            guest.name
          ]);
        }
      }
    }

    // Build CSV content
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    // Add BOM for Excel UTF-8 compatibility
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `convidados-${currentEvent?.slug || 'evento'}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Lista exportada com sucesso!');
  };

  if (isLoadingEvents || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum evento selecionado</p>
      </div>
    );
  }

  const metricCards = [
    { 
      label: 'Total', 
      value: metrics?.total || 0,
      detail: `${metrics?.totalGuests || 0} conv. + ${metrics?.totalCompanions || 0} acomp.`,
      icon: Users, 
      color: 'text-primary' 
    },
    { 
      label: 'Confirmados', 
      value: metrics?.accepted || 0,
      detail: `${metrics?.acceptedGuests || 0} conv. + ${metrics?.acceptedCompanions || 0} acomp.`,
      icon: Check, 
      color: 'text-sage' 
    },
    { 
      label: 'Recusados', 
      value: metrics?.declined || 0,
      detail: `${metrics?.declinedGuests || 0} conv. + ${metrics?.declinedCompanions || 0} acomp.`,
      icon: X, 
      color: 'text-destructive' 
    },
    { 
      label: 'Pendentes', 
      value: metrics?.pending || 0,
      detail: `${metrics?.pendingGuests || 0} conv. + ${metrics?.pendingCompanions || 0} acomp.`,
      icon: Clock, 
      color: 'text-muted-foreground' 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FeatureGuard feature="convidados">
            {metricCards.map((card) => (
          <Card key={card.label} variant="elegant">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground flex items-center gap-2">
                <card.icon className={`w-4 h-4 ${card.color}`} />
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-serif ${card.color}`}>{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.detail}</p>
            </CardContent>
          </Card>
        ))}
          </FeatureGuard>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl mb-1">Convidados</h1>
          <p className="text-muted-foreground">{guests?.length || 0} convidados cadastrados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={!guests || guests.length === 0}>
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          {guestsWithEmail > 0 && (
            <Button variant="outline" onClick={() => setBulkEmailOpen(true)}>
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar Emails</span>
              <Badge variant="secondary" className="ml-1">{guestsWithEmail}</Badge>
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold"><Plus className="w-4 h-4" /> Adicionar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Convidado</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome *</Label><Input value={newGuest.name} onChange={e => setNewGuest({...newGuest, name: e.target.value})} /></div>
                <div><Label>Email</Label><Input type="email" value={newGuest.email} onChange={e => setNewGuest({...newGuest, email: e.target.value})} /></div>
                <div><Label>Telefone</Label><Input value={newGuest.phone} onChange={e => setNewGuest({...newGuest, phone: e.target.value})} /></div>
                <div><Label>Grupo</Label>
                  <Select value={newGuest.guest_group} onValueChange={v => setNewGuest({...newGuest, guest_group: v as GuestGroup})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(guestGroupLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Mesa</Label>
                  <Select value={newGuest.table_id || 'none'} onValueChange={v => setNewGuest({...newGuest, table_id: v === 'none' ? null : v})}>
                    <SelectTrigger><SelectValue placeholder="Sem mesa" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem mesa</SelectItem>
                      {tables?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Após criar o convidado, você pode adicionar acompanhantes clicando no ícone <UserPlus className="w-3 h-3 inline" />
                </p>
                <Button onClick={handleCreate} className="w-full" disabled={createGuest.isPending}>Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as InviteStatus | 'all')}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(inviteStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={groupFilter} onValueChange={v => setGroupFilter(v as GuestGroup | 'all')}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Grupo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os grupos</SelectItem>
            {Object.entries(guestGroupLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Guests List */}
      <div className="grid gap-3">
        {guests?.map(guest => (
          <Card key={guest.id} variant="default">
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{guest.name}</span>
                  <Badge className={inviteStatusColors[guest.status]}>{inviteStatusLabels[guest.status]}</Badge>
                  <Badge variant="outline">{guestGroupLabels[guest.guest_group]}</Badge>
                  {guest.has_viewed && <Eye className="w-4 h-4 text-muted-foreground" />}
                  {(guest as GuestWithTable & { invite_email_sent_at?: string | null }).invite_email_sent_at && (
                    <MailCheck className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                  {guest.email && <span>{guest.email}</span>}
                  {guest.phone && <span>{guest.phone}</span>}
                  {guest.table && <span>Mesa: {guest.table.name}</span>}
                  {guest.companions > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> +{guest.companions}</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="ghost" onClick={() => setEditingGuest(guest)} title="Editar convidado">
                  <Pencil className="w-4 h-4" />
                </Button>
                <CompanionManager guest={guest} />
                <Button size="sm" variant="ghost" onClick={() => copyLink(guest.token)} title="Copiar link">
                  <Copy className="w-4 h-4" />
                </Button>
                {guest.email && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleSendEmail(guest)}
                    disabled={sendInviteEmail.isPending}
                    title="Enviar convite por email"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    {sendInviteEmail.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                  </Button>
                )}
                {guest.phone && (
                  <Button size="sm" variant="whatsapp" onClick={() => openWhatsApp(guest.phone!, guest.name, guest.token)} title="Enviar via WhatsApp">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => regenerateToken.mutate(guest.id)} title="Regenerar token">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { if(confirm('Excluir?')) deleteGuest.mutate(guest.id); }} title="Excluir">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bulk Email Modal */}
      {guests && (
        <BulkEmailModal 
          guests={guests} 
          eventId={currentEvent.id}
          isOpen={bulkEmailOpen} 
          onClose={() => setBulkEmailOpen(false)} 
        />
      )}

      {/* Edit Guest Modal */}
      {editingGuest && (
        <EditGuestModal
          guest={editingGuest}
          tables={tables}
          isOpen={!!editingGuest}
          onClose={() => setEditingGuest(null)}
        />
      )}
    </div>
  );
}
