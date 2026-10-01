import { useState } from 'react';
import { useEvent } from '@/contexts/EventContext';
import { useGifts, useCreateGift, useUpdateGift, useDeleteGift } from '@/hooks/useGifts';
import { Gift } from '@/lib/types';
import { FeatureGuard } from '@/components/common/FeatureGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Gift as GiftIcon, Plus, Pencil, Trash2, Loader2, Image, Heart } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface GiftFormData {
  name: string;
  description: string;
  value: string;
  image_url: string;
  status: 'available' | 'reserved' | 'received';
  is_flexible_value: boolean;
  min_value: string;
}

const initialFormData: GiftFormData = {
  name: '',
  description: '',
  value: '',
  image_url: '',
  status: 'available',
  is_flexible_value: false,
  min_value: '1',
};

export default function AdminGiftsPage() {
  const { currentEvent, isLoadingEvents } = useEvent();
  const { data: gifts, isLoading } = useGifts(currentEvent?.id);
  const createGift = useCreateGift();
  const updateGift = useUpdateGift();
  const deleteGift = useDeleteGift();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [formData, setFormData] = useState<GiftFormData>(initialFormData);

  const handleOpenCreate = () => {
    setEditingGift(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (gift: Gift) => {
    setEditingGift(gift);
    setFormData({
      name: gift.name,
      description: gift.description || '',
      value: gift.value.toString(),
      image_url: gift.image_url || '',
      status: gift.status,
      is_flexible_value: gift.is_flexible_value || false,
      min_value: (gift.min_value || 1).toString(),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentEvent) return;

    const giftData = {
      name: formData.name,
      description: formData.description || null,
      value: formData.is_flexible_value ? 0 : parseFloat(formData.value),
      image_url: formData.image_url || null,
      status: formData.status,
      event_id: currentEvent.id,
      is_flexible_value: formData.is_flexible_value,
      min_value: formData.is_flexible_value ? parseFloat(formData.min_value) : null,
    };

    if (editingGift) {
      await updateGift.mutateAsync({ id: editingGift.id, ...giftData });
    } else {
      await createGift.mutateAsync(giftData);
    }

    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteGift.mutateAsync(id);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="secondary" className="bg-sage-light">Disponível</Badge>;
      case 'reserved':
        return <Badge variant="outline" className="bg-champagne-light">Reservado</Badge>;
      case 'received':
        return <Badge className="bg-dusty-rose">Recebido</Badge>;
      default:
        return null;
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

  // Stats
  const stats = {
    total: gifts?.length || 0,
    available: gifts?.filter(g => g.status === 'available').length || 0,
    reserved: gifts?.filter(g => g.status === 'reserved').length || 0,
    received: gifts?.filter(g => g.status === 'received').length || 0,
    totalValue: gifts?.reduce((acc, g) => acc + g.value, 0) || 0,
    receivedValue: gifts?.filter(g => g.status === 'received').reduce((acc, g) => acc + g.value, 0) || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif">Lista de Presentes</h1>
          <p className="text-muted-foreground">Gerencie os presentes do evento</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Presente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.available}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Recebidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{stats.received}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Valor Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.receivedValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gifts Table */}
      <Card>
        <CardContent className="p-0">
          {!gifts || gifts.length === 0 ? (
            <div className="text-center py-12">
              <GiftIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum presente cadastrado</p>
              <Button onClick={handleOpenCreate} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Presente
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Imagem</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gifts.map((gift) => (
                  <TableRow key={gift.id}>
                    <TableCell>
                      {gift.image_url ? (
                        <img
                          src={gift.image_url}
                          alt={gift.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Image className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{gift.name}</p>
                        {gift.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {gift.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {gift.is_flexible_value ? (
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-primary" />
                          <span className="text-sm text-muted-foreground">
                            A partir de {formatCurrency(gift.min_value || 1)}
                          </span>
                        </div>
                      ) : (
                        formatCurrency(gift.value)
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(gift.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(gift)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir presente?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O presente "{gift.name}" será removido permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(gift.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingGift ? 'Editar Presente' : 'Novo Presente'}
            </DialogTitle>
            <DialogDescription>
              {editingGift ? 'Atualize as informações do presente' : 'Adicione um novo presente à lista'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Jogo de Panelas"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do presente"
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2 py-2">
              <Checkbox
                id="is_flexible_value"
                checked={formData.is_flexible_value}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_flexible_value: checked === true })
                }
              />
              <Label htmlFor="is_flexible_value" className="cursor-pointer">
                Valor aberto (o convidado escolhe o valor)
              </Label>
            </div>

            {formData.is_flexible_value ? (
              <div className="space-y-2">
                <Label htmlFor="min_value">Valor mínimo (R$) *</Label>
                <Input
                  id="min_value"
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.min_value}
                  onChange={(e) => setFormData({ ...formData, min_value: e.target.value })}
                  placeholder="1.00"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  O convidado poderá escolher qualquer valor a partir deste mínimo
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="value">Valor (R$) *</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="150.00"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="image_url">URL da Imagem</Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            {editingGift && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'available' | 'reserved' | 'received') => 
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="reserved">Reservado</SelectItem>
                    <SelectItem value="received">Recebido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createGift.isPending || updateGift.isPending}>
                {(createGift.isPending || updateGift.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingGift ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
