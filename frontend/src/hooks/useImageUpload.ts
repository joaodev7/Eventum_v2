import { useState } from 'react';
import { uploadApi } from '@/api/upload';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const uploadAvatar = async (userId: string, file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const url = await uploadApi.uploadAvatar(file);
      return url;
    } catch (error: any) {
      toast({
        title: 'Erro no Upload do Avatar',
        description: error.response?.data?.error || error.message || 'Falha no envio da imagem',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const getAvatarUrl = async (userId: string): Promise<string | null> => {
    return user?.avatarUrl || null;
  };

  const uploadImage = async (file: File, folder: string = 'general', eventId?: string): Promise<string | null> => {
    if (!file) return null;

    setIsUploading(true);
    try {
      const url = await uploadApi.uploadEventImage(file, eventId);
      return url;
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer upload',
        description: error.response?.data?.error || error.message || 'Falha no envio da imagem',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (url: string): Promise<boolean> => {
    try {
      return await uploadApi.deleteFile(url);
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir imagem',
        description: error.response?.data?.error || error.message || 'Falha ao remover imagem',
        variant: 'destructive',
      });
      return false;
    }
  };

  return { uploadImage, deleteImage, isUploading, uploadAvatar, getAvatarUrl };
}
