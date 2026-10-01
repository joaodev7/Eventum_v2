import { useState } from 'react';
import { useEvent } from '@/contexts/EventContext';
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, Supplier, supplierCategories } from '@/hooks/useSuppliers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Phone, Mail, Globe, Instagram, MapPin, Loader2, Users, CheckCircle2, Clock, Building2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { FeatureGuard } from '@/components/common/FeatureGuard';

interface SupplierFormData {
  name: string;
  category: string;
  contact_name: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  address: string;
  notes: string;
  contracted: boolean;
  contract_value: string;
  paid_amount: string;
}

const emptyFormData: SupplierFormData = {
  name: '',
  category: '',
  contact_name: '',
  phone: '',
  email: '',
  website: '',
  instagram: '',
  address: '',
  notes: '',
  contracted: false,
  contract_value: '',
  paid_amount: '',
};

export default function SuppliersPage() {
  const { currentEvent: event, isLoadingEvents: eventLoading } = useEvent();
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers(event?.id);
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>(emptyFormData);
  const [deleteConfirm, setDeleteConfirm] = useState<Supplier | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormData(emptyFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      category: supplier.category || '',
      contact_name: supplier.contact_name || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      website: supplier.website || '',
      instagram: supplier.instagram || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
      contracted: supplier.contracted,
      contract_value: supplier.contract_value?.toString() || '',
      paid_amount: supplier.paid_amount?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!event?.id || !formData.name.trim()) {
      toast.error('Nome do fornecedor é obrigatório');
      return;
    }

    const payload = {
      event_id: event.id,
      name: formData.name.trim(),
      category: formData.category || null,
      contact_name: formData.contact_name || null,
      phone: formData.phone || null,
      email: formData.email || null,
      website: formData.website || null,
      instagram: formData.instagram || null,
      address: formData.address || null,
      notes: formData.notes || null,
      contracted: formData.contracted,
      contract_value: formData.contract_value ? parseFloat(formData.contract_value) : null,
      paid_amount: formData.paid_amount ? parseFloat(formData.paid_amount) : 0,
    };

    try {
      if (editingSupplier) {
        await updateSupplier.mutateAsync({ id: editingSupplier.id, ...payload });
        toast.success('Fornecedor atualizado!');
      } else {
        await createSupplier.mutateAsync(payload);
        toast.success('Fornecedor cadastrado!');
      }
      setIsDialogOpen(false);
    } catch {
      toast.error('Erro ao salvar fornecedor');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm || !event?.id) return;
    
    try {
      await deleteSupplier.mutateAsync({ id: deleteConfirm.id, eventId: event.id });
      toast.success('Fornecedor removido!');
      setDeleteConfirm(null);
    } catch {
      toast.error('Erro ao remover fornecedor');
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getPaymentStatus = (supplier: Supplier) => {
    if (!supplier.contract_value) return null;
    const paid = supplier.paid_amount || 0;
    const total = supplier.contract_value;
    const percentage = (paid / total) * 100;
    
    if (percentage >= 100) return { label: 'Pago', color: 'bg-green-100 text-green-800' };
    if (percentage > 0) return { label: `${percentage.toFixed(0)}% pago`, color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Pendente', color: 'bg-red-100 text-red-800' };
  };

  const filteredSuppliers = suppliers?.filter(s => 
    categoryFilter === 'all' || s.category === categoryFilter
  ) || [];

  const contractedCount = suppliers?.filter(s => s.contracted).length || 0;
  const totalContractValue = suppliers?.reduce((sum, s) => sum + (s.contracted ? (s.contract_value || 0) : 0), 0) || 0;
  const totalPaidValue = suppliers?.reduce((sum, s) => sum + (s.paid_amount || 0), 0) || 0;

  const usedCategories = [...new Set(suppliers?.map(s => s.category).filter(Boolean) || [])];

  if (eventLoading || suppliersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Selecione um evento para gerenciar fornecedores.</p>
      </div>
    );
  }

  return (
    <FeatureGuard feature="fornecedores">
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif">Fornecedores</h1>
          <p className="text-muted-foreground">Gerencie os fornecedores do seu evento</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Fornecedores</CardDescription>
            <CardTitle className="text-2xl">{suppliers?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Contratados</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              {contractedCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Valor Total Contratado</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalContractValue)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Pago</CardDescription>
            <CardTitle className="text-2xl text-green-600">{formatCurrency(totalPaidValue)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      {usedCategories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Badge 
            variant={categoryFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setCategoryFilter('all')}
          >
            Todos
          </Badge>
          {usedCategories.map(cat => (
            <Badge 
              key={cat}
              variant={categoryFilter === cat ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setCategoryFilter(cat!)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      )}

      {/* Suppliers List */}
      {filteredSuppliers.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum fornecedor cadastrado ainda.</p>
            <Button className="mt-4" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Fornecedor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map(supplier => {
            const paymentStatus = getPaymentStatus(supplier);
            return (
              <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                      {supplier.category && (
                        <Badge variant="secondary">{supplier.category}</Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(supplier)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteConfirm(supplier)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {supplier.contact_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{supplier.contact_name}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${supplier.phone}`} className="hover:underline">{supplier.phone}</a>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${supplier.email}`} className="hover:underline truncate">{supplier.email}</a>
                    </div>
                  )}
                  {supplier.instagram && (
                    <div className="flex items-center gap-2 text-sm">
                      <Instagram className="w-4 h-4 text-muted-foreground" />
                      <a 
                        href={`https://instagram.com/${supplier.instagram.replace('@', '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center gap-1"
                      >
                        {supplier.instagram}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {supplier.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a 
                        href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center gap-1 truncate"
                      >
                        {supplier.website}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">{supplier.address}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {supplier.contracted ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Contratado
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          Em análise
                        </Badge>
                      )}
                    </div>
                    {paymentStatus && (
                      <Badge className={paymentStatus.color}>{paymentStatus.label}</Badge>
                    )}
                  </div>

                  {supplier.contract_value && (
                    <div className="text-sm text-muted-foreground">
                      Valor: <span className="font-semibold text-foreground">{formatCurrency(supplier.contract_value)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
            <DialogDescription>
              Preencha os dados do fornecedor
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do fornecedor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={v => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {supplierCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Nome do Contato</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="Pessoa responsável"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@fornecedor.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.instagram}
                  onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="@usuario"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={e => setFormData({ ...formData, website: e.target.value })}
                  placeholder="www.fornecedor.com.br"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Cidade, Estado"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Anotações sobre o fornecedor..."
                rows={2}
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Contratado</Label>
                  <p className="text-sm text-muted-foreground">Marque se já fechou contrato</p>
                </div>
                <Switch
                  checked={formData.contracted}
                  onCheckedChange={v => setFormData({ ...formData, contracted: v })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contract_value">Valor do Contrato</Label>
                  <Input
                    id="contract_value"
                    type="number"
                    step="0.01"
                    value={formData.contract_value}
                    onChange={e => setFormData({ ...formData, contract_value: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paid_amount">Valor Pago</Label>
                  <Input
                    id="paid_amount"
                    type="number"
                    step="0.01"
                    value={formData.paid_amount}
                    onChange={e => setFormData({ ...formData, paid_amount: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={createSupplier.isPending || updateSupplier.isPending}
            >
              {(createSupplier.isPending || updateSupplier.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingSupplier ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Fornecedor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deleteConfirm?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </FeatureGuard>
  );
}
