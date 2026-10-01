import { useSubscription, useCreateCustomerPortal } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlanBadge } from '@/components/subscription/PlanBadge';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const SubscriptionManagement = () => {
  const { user } = useAuth();
  const { subscription, isLoading } = useSubscription();
  const createPortal = useCreateCustomerPortal();

  const handleManageSubscription = async () => {
    if (!user) return;

    try {
      const data = await createPortal.mutateAsync();
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error creating customer portal:', error);
      toast.error('Erro ao abrir portal de assinatura');
    }
  };

  if (isLoading) {
    return <div>Carregando informações da assinatura...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Assinatura</CardTitle>
        <CardDescription>Veja e gerencie seu plano de assinatura.</CardDescription>
      </CardHeader>
      <CardContent>
        {subscription ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Seu Plano Atual:</p>
                <PlanBadge planId={subscription.plan_id} />
              </div>
              <p className="text-muted-foreground">
                Status: <span className="font-semibold text-green-600">{subscription.status}</span>
              </p>
            </div>
            {subscription.current_period_end && (
              <p>
                {subscription.cancel_at_period_end
                  ? `Sua assinatura será cancelada em: ${new Date(subscription.current_period_end).toLocaleDateString()}`
                  : `Sua próxima renovação é em: ${new Date(subscription.current_period_end).toLocaleDateString()}`}
              </p>
            )}
            <Button onClick={handleManageSubscription} disabled={createPortal.isPending}>
              {createPortal.isPending ? 'Carregando...' : 'Gerenciar Assinatura'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Você será redirecionado para o nosso parceiro de pagamentos para gerenciar sua assinatura.
            </p>
          </div>
        ) : (
          <div>
            <p className="mb-4">Você não tem uma assinatura ativa.</p>
            <Button onClick={() => window.location.href = '/pricing'}>Ver Planos</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionManagement;
