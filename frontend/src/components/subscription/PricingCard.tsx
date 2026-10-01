import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SubscriptionPlan, useSubscription, useCreateCheckoutSession } from '@/hooks/useSubscription';
import { toast } from 'sonner';

interface PricingCardProps {
  plan: SubscriptionPlan;
  billingCycle: 'monthly' | 'yearly';
  isPopular?: boolean;
}

export function PricingCard({ plan, billingCycle, isPopular = false }: PricingCardProps) {
  const { plan: currentPlan, isActive } = useSubscription();
  const { mutate: createCheckout, isPending } = useCreateCheckoutSession();

  const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
  const monthlyEquivalent = billingCycle === 'yearly' ? plan.price_yearly / 12 : plan.price_monthly;
  const isCurrentPlan = currentPlan === plan.name && isActive;
  const isFree = plan.name === 'free';

  const handleSubscribe = () => {
    if (isFree || isCurrentPlan) return;

    createCheckout(
      { planId: plan.id, billingCycle },
      {
        onSuccess: (data) => {
          if (data.url) {
            window.location.href = data.url;
          }
        },
        onError: (error) => {
          toast.error('Erro ao iniciar checkout: ' + error.message);
        },
      }
    );
  };

  return (
    <Card
      className={cn(
        'relative flex flex-col',
        isPopular && 'border-primary shadow-lg scale-105 z-10',
        isCurrentPlan && 'ring-2 ring-primary'
      )}
    >
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gap-1">
          <Sparkles className="h-3 w-3" />
          Mais Popular
        </Badge>
      )}

      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl">{plan.display_name}</CardTitle>
        <CardDescription>
          {plan.name === 'free' && 'Para começar a organizar seu evento'}
          {plan.name === 'starter' && 'Para casais que querem mais recursos'}
          {plan.name === 'pro' && 'O plano ideal para a maioria dos eventos'}
          {plan.name === 'premium' && 'Para eventos maiores e profissionais'}
          {plan.name === 'enterprise' && 'Para cerimonialistas e agências'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold">
              R${monthlyEquivalent.toFixed(0)}
            </span>
            <span className="text-muted-foreground">/mês</span>
          </div>
          {billingCycle === 'yearly' && !isFree && (
            <p className="text-sm text-muted-foreground mt-1">
              R${price.toFixed(0)}/ano (economize 17%)
            </p>
          )}
        </div>

        <ul className="space-y-3">
          {(plan.features as string[]).map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {plan.platform_fee_percent > 0 && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Taxa de {plan.platform_fee_percent}% sobre presentes monetizados
          </p>
        )}
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isPopular ? 'default' : 'outline'}
          disabled={isCurrentPlan || isPending}
          onClick={handleSubscribe}
        >
          {isCurrentPlan
            ? 'Plano Atual'
            : isFree
            ? 'Começar Grátis'
            : isPending
            ? 'Processando...'
            : 'Assinar Agora'}
        </Button>
      </CardFooter>
    </Card>
  );
}
