import { useState } from 'react';
import { useAllUsers, useUpdateUserRole, UserWithDetails } from '@/hooks/useUsersManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Search, Eye, Shield, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function UsersManagement() {
  const { data: users, isLoading } = useAllUsers();
  const updateRole = useUpdateUserRole();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user'>('user');

  const filteredUsers = users?.filter((user) => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const userRole = user.user_roles?.[0]?.role || 'user';
    const matchesRole = roleFilter === 'all' || userRole === roleFilter;
    
    return matchesSearch && matchesRole;
  }) || [];

  const handleEditRole = (user: UserWithDetails) => {
    const currentRole = user.user_roles?.[0]?.role || 'user';
    if (currentRole === 'superadmin') {
      toast.error('Não é possível alterar a role de um superadmin');
      return;
    }
    setEditingUser(user);
    setSelectedRole(currentRole as 'admin' | 'user');
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    
    try {
      await updateRole.mutateAsync({
        userId: editingUser.id,
        role: selectedRole,
      });
      toast.success('Role atualizada com sucesso!');
      setEditingUser(null);
    } catch (error) {
      toast.error('Erro ao atualizar role');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestão de Usuários</h2>
        <p className="text-muted-foreground">Gerencie os cerimonialistas e usuários da plataforma</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>
            Total: {users?.length || 0} usuários cadastrados
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
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
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
                    <TableHead>Role</TableHead>
                    <TableHead>Assinatura</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => {
                      const role = user.user_roles?.[0]?.role || 'user';
                      const subscription = user.subscriptions?.[0];
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.full_name || 'Sem nome'}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                role === 'superadmin' ? 'destructive' :
                                role === 'admin' ? 'default' : 'secondary'
                              }
                            >
                              {role === 'superadmin' ? 'Super Admin' :
                               role === 'admin' ? 'Cerimonialista' : 'Usuário'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {subscription ? (
                              <Badge 
                                variant={subscription.status === 'active' ? 'default' : 'outline'}
                              >
                                {subscription.status}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">Sem assinatura</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link to={`/superadmin/users/${user.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditRole(user)}
                                disabled={role === 'superadmin'}
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                            </div>
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

      {/* Edit Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Permissão</DialogTitle>
            <DialogDescription>
              Altere a role do usuário {editingUser?.full_name || editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label className="text-sm font-medium mb-3 block">Role do Sistema</Label>
            <RadioGroup 
              value={selectedRole} 
              onValueChange={(value) => setSelectedRole(value as 'admin' | 'user')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="user" id="user" />
                <Label htmlFor="user" className="flex-1 cursor-pointer">
                  <div className="font-medium">Usuário</div>
                  <div className="text-sm text-muted-foreground">
                    Sem acesso ao portal de gestão
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="admin" id="admin" />
                <Label htmlFor="admin" className="flex-1 cursor-pointer">
                  <div className="font-medium">Cerimonialista (Admin)</div>
                  <div className="text-sm text-muted-foreground">
                    Acesso completo ao portal de gestão de eventos
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRole} disabled={updateRole.isPending}>
              {updateRole.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
