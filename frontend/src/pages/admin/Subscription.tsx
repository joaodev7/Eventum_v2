import { useSubscription, useCreateCustomerPortal, planLabels, useSubscriptionPlans } from '@/hooks/useSubscription';
import { PlanBadge } from '@/components/subscription/PlanBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Calendar, ArrowUpRight, Loader2, Check, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FeatureGuard } from '@/components/common/FeatureGuard';

export default function AdminSubscription() {
  const navigate = useNavigate();
  const { subscription, plan, isTrialing, daysRemaining, limits, isLoading } = useSubscription();
  const { data: plans } = useSubscriptionPlans();
  const { mutate: createPortal, isPending: isCreatingPortal } = useCreateCustomerPortal();

  const handleManageSubscription = () => {
    createPortal(undefined, {
      onSuccess: (data) => {
        if (data.url) {
          window.location.href = data.url;
        }
      },
      onError: (error) => {
        toast.error('Erro ao abrir portal: ' + error.message);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPlan = plans?.find((p) => p.name === plan);
  const nextPlan = plans?.find((p) => p.sort_order === (currentPlan?.sort_order || 0) + 1);

  return (
    <FeatureGuard feature="assinatura">
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assinatura</h1>
        <p className="text-muted-foreground">
          Gerencie sua assinatura e plano
        </p>
      </div>

      {isTrialing && daysRemaining !== null && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você está no período de teste. Restam {daysRemaining} dias para escolher um plano.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Plano Atual
              <PlanBadge />
            </CardTitle>
            <CardDescription>
              Informações sobre seu plano atual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">{planLabels[plan]}</p>
                <p className="text-sm text-muted-foreground">
                  {currentPlan?.price_monthly
                    ? `R$${currentPlan.price_monthly}/mês`
                    : 'Gratuito'}
                </p>
              </div>
            </div>

            {subscription?.current_period_end && (
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Próxima cobrança</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(subscription.current_period_end), "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            )}

            <Separator />

            {plan !== 'free' && subscription?.stripe_subscription_id && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleManageSubscription}
                disabled={isCreatingPortal}
              >
                {isCreatingPortal ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                )}
                Gerenciar Assinatura
              </Button>
            )}

            {(plan === 'free' || !subscription?.stripe_subscription_id) && (
              <Button className="w-full" onClick={() => navigate('/pricing')}>
                Ver Planos
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Limites do Plano</CardTitle>
            <CardDescription>
              Uso atual vs. limite disponível
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Eventos</span>
                <span className="text-sm text-muted-foreground">
                  {limits.max_events === -1 ? 'Ilimitado' : `Até ${limits.max_events}`}
                </span>
              </div>
              <Progress value={limits.max_events === -1 ? 10 : 50} />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Convidados por evento</span>
                <span className="text-sm text-muted-foreground">
                  {limits.max_guests === -1 ? 'Ilimitado' : `Até ${limits.max_guests}`}
                </span>
              </div>
              <Progress value={limits.max_guests === -1 ? 10 : 30} />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Imagens na galeria</span>
                <span className="text-sm text-muted-foreground">
                  {limits.max_gallery_images === -1 ? 'Ilimitado' : `Até ${limits.max_gallery_images}`}
                </span>
              </div>
              <Progress value={limits.max_gallery_images === -1 ? 10 : 20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Prompt */}
      {nextPlan && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="font-semibold text-lg">
                Faça upgrade para {nextPlan.display_name}
              </h3>
              <p className="text-muted-foreground">
                Desbloqueie mais recursos por apenas R${nextPlan.price_monthly}/mês
              </p>
            </div>
            <Button onClick={() => navigate('/pricing')}>
              Ver Planos
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Recursos do seu plano</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 md:grid-cols-2">
            {(currentPlan?.features as string[] || []).map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  </FeatureGuard>
  );
}
