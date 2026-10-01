import { useState } from 'react';
import { useEvent } from '@/contexts/EventContext';
import { useTables, useTablesWithGuests, useCreateTable, useUpdateTable, useDeleteTable } from '@/hooks/useTables';
import { useGuests, useUpdateGuest } from '@/hooks/useGuests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit, Users, LayoutGrid, UserPlus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Table } from '@/lib/types';
import { FeatureGuard } from '@/components/common/FeatureGuard';

export default function TablesPage() {
  const { currentEvent, isLoadingEvents } = useEvent();
  const { data: tablesWithGuests, isLoading } = useTablesWithGuests(currentEvent?.id);
  const { data: allGuests } = useGuests(currentEvent?.id);
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();
  const updateGuest = useUpdateGuest();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    capacity: 10,
    description: '',
  });

  const resetForm = () => {
    setFormData({ name: '', capacity: 10, description: '' });
    setEditingTable(null);
  };

  const handleOpenDialog = (table?: Table) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        name: table.name,
        capacity: table.capacity || 10,
        description: table.description || '',
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !currentEvent) {
      toast.error('Nome da mesa é obrigatório');
      return;
    }

    try {
      if (editingTable) {
        await updateTable.mutateAsync({
          id: editingTable.id,
          name: formData.name,
          capacity: formData.capacity,
          description: formData.description || null,
        });
        toast.success('Mesa atualizada!');
      } else {
        await createTable.mutateAsync({
          name: formData.name,
          capacity: formData.capacity,
          description: formData.description || null,
          event_id: currentEvent.id,
        });
        toast.success('Mesa criada!');
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      toast.error('Erro ao salvar mesa');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mesa? Os convidados serão desvinculados.')) return;
    try {
      await deleteTable.mutateAsync(id);
      toast.success('Mesa excluída!');
    } catch {
      toast.error('Erro ao excluir mesa');
    }
  };

  const handleAssignGuest = async (guestId: string, tableId: string | null) => {
    try {
      await updateGuest.mutateAsync({ id: guestId, table_id: tableId });
      toast.success(tableId ? 'Convidado adicionado à mesa!' : 'Convidado removido da mesa!');
    } catch {
      toast.error('Erro ao atualizar convidado');
    }
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

  // Guests without a table
  const unassignedGuests = allGuests?.filter(g => !g.table_id) || [];
  
  // Get selected table data
  const selectedTable = tablesWithGuests?.find(t => t.id === selectedTableId);

  const totalCapacity = tablesWithGuests?.reduce((sum, t) => sum + (t.capacity || 0), 0) || 0;
  const totalSeated = tablesWithGuests?.reduce((sum, t) => sum + t.guests.length, 0) || 0;

  return (
    <FeatureGuard feature="mesas">
      <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl mb-1">Mesas</h1>
          <p className="text-muted-foreground">
            {tablesWithGuests?.length || 0} mesas • {totalSeated}/{totalCapacity} lugares ocupados
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="gold" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4" /> Nova Mesa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTable ? 'Editar Mesa' : 'Nova Mesa'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Mesa 1, Mesa dos Padrinhos"
                />
              </div>
              <div>
                <Label>Capacidade</Label>
                <Input 
                  type="number" 
                  min={1}
                  max={50}
                  value={formData.capacity} 
                  onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 10 })}
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional da mesa"
                  rows={2}
                />
              </div>
              <Button 
                onClick={handleSave} 
                className="w-full" 
                disabled={createTable.isPending || updateTable.isPending}
              >
                {editingTable ? 'Salvar' : 'Criar Mesa'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tables Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tablesWithGuests?.map(table => {
          const occupancy = table.guests.length;
          const capacity = table.capacity || 10;
          const isFull = occupancy >= capacity;
          
          return (
            <Card key={table.id} variant="elegant">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <LayoutGrid className="w-5 h-5 text-primary" />
                      {table.name}
                    </CardTitle>
                    {table.description && (
                      <CardDescription className="mt-1">{table.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(table)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(table.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={isFull ? 'destructive' : 'secondary'} className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {occupancy}/{capacity}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => { setSelectedTableId(table.id); setAssignDialogOpen(true); }}
                  >
                    <UserPlus className="w-4 h-4" /> Adicionar
                  </Button>
                </div>
                
                {table.guests.length > 0 ? (
                  <div className="space-y-1">
                    {table.guests.map(guest => (
                      <div key={guest.id} className="flex items-center justify-between text-sm py-1 px-2 bg-muted/50 rounded">
                        <span>{guest.name}</span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6"
                          onClick={() => handleAssignGuest(guest.id, null)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum convidado nesta mesa
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {tablesWithGuests?.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <LayoutGrid className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Nenhuma mesa cadastrada</h3>
            <p className="text-muted-foreground mb-4">Comece criando sua primeira mesa</p>
            <Button variant="gold" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4" /> Criar Mesa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Unassigned Guests Section */}
      {unassignedGuests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Convidados sem mesa ({unassignedGuests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unassignedGuests.map(guest => (
                <Badge key={guest.id} variant="outline" className="py-1">
                  {guest.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assign Guest Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar convidado à {selectedTable?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {unassignedGuests.length > 0 ? (
              unassignedGuests.map(guest => (
                <div key={guest.id} className="flex items-center justify-between p-2 border rounded">
                  <span>{guest.name}</span>
                  <Button 
                    size="sm"
                    onClick={() => {
                      handleAssignGuest(guest.id, selectedTableId);
                    }}
                  >
                    Adicionar
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Todos os convidados já estão em mesas
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </FeatureGuard>
  );
}
