import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useUserRole';
import { useEvent, EventProvider } from '@/contexts/EventContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldX } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

function AdminLayoutContent() {
  const { user, loading, signOut } = useAuth();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { currentEvent, isLoadingEvents } = useEvent();

  if (loading || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <ShieldX className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-serif text-foreground">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar o painel administrativo.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={signOut}>
              Sair
            </Button>
            <Button asChild>
              <Link to="/">Voltar ao Site</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 bg-background border-b h-12 flex items-center px-4 gap-2">
            <SidebarTrigger />
            <span className="text-sm text-muted-foreground truncate">
              {currentEvent?.event_name}
            </span>
          </header>
          <main className="flex-1 p-6">
            {isLoadingEvents ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !currentEvent ? (
              <div className="text-center py-12">
                <h2 className="text-2xl font-serif mb-4">Nenhum evento selecionado</h2>
                <p className="text-muted-foreground mb-6">
                  Crie ou selecione um evento para começar.
                </p>
                <Button asChild>
                  <Link to="/admin/events/new">Criar Primeiro Evento</Link>
                </Button>
              </div>
            ) : (
              <Outlet />
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function AdminLayout() {
  return (
    <EventProvider>
      <AdminLayoutContent />
    </EventProvider>
  );
}
