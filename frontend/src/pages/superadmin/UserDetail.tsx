import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUserById, useUpdateUserProfile, useUpdateUserRole } from '@/hooks/useUsersManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Loader2, CalendarDays, ExternalLink, Save } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading } = useUserById(id);
  const updateProfile = useUpdateUserProfile();
  const updateRole = useUpdateUserRole();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user'>('user');
  const [isEditing, setIsEditing] = useState(false);

  // Set initial values when user data loads
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      const role = user.user_roles?.[0]?.role;
      if (role && role !== 'superadmin') {
        setSelectedRole(role as 'admin' | 'user');
      }
    }
  }, [user]);

  const currentRole = user?.user_roles?.[0]?.role || 'user';
  const isSuperAdmin = currentRole === 'superadmin';

  const handleSave = async () => {
    if (!id) return;
    
    try {
      // Update profile
      await updateProfile.mutateAsync({
        userId: id,
        fullName,
        email,
      });
      
      // Update role if changed and not superadmin
      if (!isSuperAdmin && selectedRole !== currentRole) {
        await updateRole.mutateAsync({
          userId: id,
          role: selectedRole,
        });
      }
      
      toast.success('Usuário atualizado com sucesso!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erro ao atualizar usuário');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Usuário não encontrado</p>
        <Button variant="outline" onClick={() => navigate('/superadmin/users')} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/superadmin/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{user.full_name || 'Usuário'}</h2>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Perfil</CardTitle>
            <CardDescription>Dados cadastrais do usuário</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                value={isEditing ? fullName : (user.full_name || '')}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!isEditing}
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={isEditing ? email : (user.email || '')}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isEditing}
              />
            </div>
            
            <div>
              <Label>Cadastrado em</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(user.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>

            <Separator className="my-4" />

            <div>
              <Label className="mb-3 block">Permissão do Sistema</Label>
              {isSuperAdmin ? (
                <Badge variant="destructive">Super Admin (não editável)</Badge>
              ) : (
                <RadioGroup 
                  value={isEditing ? selectedRole : (currentRole as string)}
                  onValueChange={(value) => setSelectedRole(value as 'admin' | 'user')}
                  disabled={!isEditing}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="user" id="user" disabled={!isEditing} />
                    <Label htmlFor="user" className="cursor-pointer">
                      Usuário (sem acesso ao portal)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="admin" id="admin" disabled={!isEditing} />
                    <Label htmlFor="admin" className="cursor-pointer">
                      Cerimonialista (acesso ao portal)
                    </Label>
                  </div>
                </RadioGroup>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              {isEditing ? (
                <>
                  <Button 
                    onClick={handleSave} 
                    disabled={updateProfile.isPending || updateRole.isPending}
                  >
                    {(updateProfile.isPending || updateRole.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button onClick={() => {
                  setFullName(user.full_name || '');
                  setEmail(user.email || '');
                  const role = user.user_roles?.[0]?.role;
                  if (role && role !== 'superadmin') {
                    setSelectedRole(role as 'admin' | 'user');
                  }
                  setIsEditing(true);
                }}>
                  Editar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Subscription & Events */}
        <div className="space-y-6">
          {/* Subscription */}
          <Card>
            <CardHeader>
              <CardTitle>Assinatura</CardTitle>
              <CardDescription>Status da assinatura do usuário</CardDescription>
            </CardHeader>
            <CardContent>
              {user.subscriptions && user.subscriptions.length > 0 ? (
                <div className="space-y-2">
                  {user.subscriptions.map((sub, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Badge 
                          variant={sub.status === 'active' ? 'default' : 'secondary'}
                        >
                          {sub.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          Ciclo: {sub.billing_cycle === 'monthly' ? 'Mensal' : 'Anual'}
                        </p>
                      </div>
                      {sub.current_period_end && (
                        <p className="text-sm text-muted-foreground">
                          Expira: {format(new Date(sub.current_period_end), 'dd/MM/yyyy')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Sem assinatura ativa</p>
              )}
            </CardContent>
          </Card>

          {/* Events */}
          <Card>
            <CardHeader>
              <CardTitle>Eventos</CardTitle>
              <CardDescription>Eventos gerenciados por este usuário</CardDescription>
            </CardHeader>
            <CardContent>
              {user.events && user.events.length > 0 ? (
                <div className="space-y-2">
                  {user.events.map((event: any) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{event.event_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="capitalize">
                            {event.event_type}
                          </Badge>
                          <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                            {event.status}
                          </Badge>
                          <Badge variant="outline">
                            {event.userRole}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.event_date && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <CalendarDays className="h-4 w-4 mr-1" />
                            {format(new Date(event.event_date), 'dd/MM/yyyy')}
                          </div>
                        )}
                        <Link to={`/evento/${event.slug}`} target="_blank">
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Nenhum evento encontrado</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
