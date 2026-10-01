import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/api/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useImageUpload } from '@/hooks/useImageUpload';

const UserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { uploadAvatar } = useImageUpload();

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.full_name || user.fullName || '');
      setEmail(user.email || '');
      setAvatarUrl(user.avatarUrl || null);
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      await authApi.updateProfile({
        fullName: name,
        email: email !== user.email ? email : undefined,
      });
      toast({ title: 'Perfil atualizado com sucesso!' });
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar perfil',
        description: err.response?.data?.error || err.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePassword = async () => {
    if (!password) {
      toast({ title: 'Por favor, insira uma nova senha.', variant: 'destructive' });
      return;
    }

    try {
      await authApi.updateProfile({
        currentPassword: currentPassword || undefined,
        newPassword: password,
      });
      setPassword('');
      setCurrentPassword('');
      toast({ title: 'Senha atualizada com sucesso!' });
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar senha',
        description: err.response?.data?.error || err.message,
        variant: 'destructive',
      });
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    if (!user) return;

    setUploading(true);
    try {
      const file = event.target.files[0];
      const newAvatarUrl = await uploadAvatar(user.id, file);
      setAvatarUrl(newAvatarUrl);
      toast({ title: 'Avatar atualizado com sucesso!' });
    } catch (error: any) {
      toast({ title: 'Erro ao fazer upload do avatar', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={avatarUrl || undefined} alt="User Avatar" />
          <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <Label htmlFor="avatar-upload" className="cursor-pointer">
            <Button as="span" variant="outline" disabled={uploading}>
              {uploading ? 'Enviando...' : 'Trocar Foto'}
            </Button>
          </Label>
          <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploading} />
        </div>
      </div>
      <div>
        <Label htmlFor="name">Nome</Label>
        <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <Button onClick={handleUpdateProfile}>Salvar Alterações</Button>

      <hr className="my-6" />

      <div>
        <h3 className="text-lg font-medium">Alterar Senha</h3>
        <div className="space-y-2 mt-2">
          <Label htmlFor="current-password">Senha Atual</Label>
          <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <Label htmlFor="password">Nova Senha</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button onClick={handleUpdatePassword}>Atualizar Senha</Button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
