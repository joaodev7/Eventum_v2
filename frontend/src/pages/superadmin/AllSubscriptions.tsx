import { useState } from 'react';
import { useAllSubscriptions, useAllUsers } from '@/hooks/useUsersManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusLabels: Record<string, string> = {
  active: 'Ativo',
  canceled: 'Cancelado',
  past_due: 'Atrasado',
  trialing: 'Trial',
  incomplete: 'Incompleto',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  canceled: 'destructive',
  past_due: 'destructive',
  trialing: 'secondary',
  incomplete: 'outline',
};

export default function AllSubscriptions() {
  const { data: subscriptions, isLoading: subsLoading } = useAllSubscriptions();
  const { data: users, isLoading: usersLoading } = useAllUsers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Map user_id to user info
  const userMap = new Map(users?.map(u => [u.id, u]) || []);

  const filteredSubscriptions = subscriptions?.filter((sub) => {
    const user = userMap.get(sub.user_id);
    const matchesSearch = 
      user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const isLoading = subsLoading || usersLoading;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Assinaturas</h2>
        <p className="text-muted-foreground">Gerencie as assinaturas da plataforma</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assinaturas</CardTitle>
          <CardDescription>
            Total: {subscriptions?.length || 0} assinaturas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="trialing">Trial</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
                <SelectItem value="past_due">Atrasado</SelectItem>
                <SelectItem value="incomplete">Incompleto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma assinatura encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscriptions.map((sub) => {
                      const user = userMap.get(sub.user_id);
                      const plan = sub.plan as any;
                      const price = sub.billing_cycle === 'monthly' 
                        ? plan?.price_monthly 
                        : plan?.price_yearly;
                      
                      return (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user?.full_name || 'Sem nome'}</div>
                              <div className="text-sm text-muted-foreground">{user?.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {plan?.display_name || plan?.name || 'Desconhecido'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariants[sub.status] || 'secondary'}>
                              {statusLabels[sub.status] || sub.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {sub.billing_cycle === 'monthly' ? 'Mensal' : 'Anual'}
                          </TableCell>
                          <TableCell>
                            {price ? formatCurrency(Number(price)) : '-'}
                          </TableCell>
                          <TableCell>
                            {sub.current_period_end ? (
                              format(new Date(sub.current_period_end), 'dd/MM/yyyy', { locale: ptBR })
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to={`/superadmin/users/${sub.user_id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
