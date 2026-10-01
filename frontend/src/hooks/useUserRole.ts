import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export function useIsAdmin() {
  const { user, session } = useAuth();
  
  return useQuery({
    queryKey: ['user-role', user?.id, session?.access_token],
    queryFn: async () => {
      if (!user?.id || !session?.access_token) {
        return false;
      }
      return user.role === 'admin' || user.role === 'superadmin';
    },
    enabled: !!user?.id && !!session?.access_token,
    staleTime: 5 * 60 * 1000,
  });
}
