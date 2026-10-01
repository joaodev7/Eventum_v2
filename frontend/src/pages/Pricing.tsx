import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EventumLogo } from '@/components/common/EventumLogo';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSubscriptionPlans, useCreateCheckoutSession } from '@/hooks/useSubscription';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SeoHead } from '@/components/common/SeoHead';

function PricingCardSkeleton() {
  return (
    <div className="flex flex-col border rounded-lg bg-card shadow-sm p-6">
      <div className="text-center mb-2">
        <Skeleton className="h-7 w-32 mx-auto mb-2" />
        <Skeleton className="h-4 w-48 mx-auto mb-2" />
        <Skeleton className="h-8 w-24 mx-auto mb-2" />
      </div>
      <div className="space-y-2 mb-6 mt-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-2">
            <Skeleton className="h-4 w-4 rounded-full mt-1" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-full mt-auto" />
    </div>
  );
}

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { data: plans, isLoading, error } = useSubscriptionPlans();
  const { user } = useAuth();
  const navigate = useNavigate();

  const createCheckoutSession = useCreateCheckoutSession();

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { url } = await createCheckoutSession.mutateAsync({ planId, billingCycle });
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error(err);
      // Aqui você pode usar um toast para exibir o erro
    }
  };
  
  const activePlans = plans?.filter(plan => plan.name !== 'free') || [];


  const pricingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': 'Eventum Planos',
    'description': 'Planos de assinatura para gestão de eventos, casamentos, RSVP e lista de presentes.',
    'brand': {
      '@type': 'Brand',
      'name': 'Eventum'
    },
    'offers': {
      '@type': 'AggregateOffer',
      'priceCurrency': 'BRL',
      'lowPrice': '0',
      'highPrice': '299',
      'offerCount': '4'
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="Planos & Preços — Eventum"
        description="Conheça os planos do Eventum para cerimonialistas e anfitriões. Gestão de convidados, RSVP, lista de presentes PIX e organização de mesas. Compare!"
        keywords={['preços eventum', 'planos cerimonialista', 'software casamento', 'gestão eventos planos']}
        jsonLd={pricingJsonLd}
      />
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <EventumLogo size="md" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/auth">
              <Button>Criar Conta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <p className="text-sm font-medium tracking-widest uppercase text-accent-foreground/70 mb-3">
            Planos
          </p>
          <h1 className="font-serif text-4xl md:text-5xl mb-4">
            Escolha o plano ideal para sua operação
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Soluções flexíveis para profissionais que exigem excelência na gestão de eventos
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Label
            htmlFor="billing-toggle"
            className={billingCycle === 'monthly' ? 'font-medium' : 'text-muted-foreground'}
          >
            Mensal
          </Label>
          <Switch
            id="billing-toggle"
            checked={billingCycle === 'yearly'}
            onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
          />
          <Label
            htmlFor="billing-toggle"
            className={billingCycle === 'yearly' ? 'font-medium' : 'text-muted-foreground'}
          >
            Anual
            <span className="ml-2 text-xs text-primary font-medium">
              Melhor valor
            </span>
          </Label>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {isLoading && (
            <>
              <PricingCardSkeleton />
              <PricingCardSkeleton />
              <PricingCardSkeleton />
            </>
          )}

          {error && (
            <div className="col-span-3">
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Erro ao carregar os planos</AlertTitle>
                <AlertDescription>
                  Ocorreu um erro ao buscar os planos de assinatura. Por favor, tente novamente mais tarde.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {activePlans.map((plan: any) => (
            <div
              key={plan.id}
              className={`relative flex flex-col border rounded-lg bg-card shadow-sm p-6 ${plan.is_popular ? 'border-primary shadow-lg scale-105 z-10' : ''}`}
            >
              {plan.is_popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">Mais Popular</span>
              )}
              <div className="text-center mb-2">
                <h3 className="font-serif text-2xl mb-1">{plan.display_name}</h3>
                <p className="text-muted-foreground text-sm mb-2">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-3xl font-bold">R${billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly}</span>
                  <span className="text-muted-foreground">/{billingCycle === 'monthly' ? 'mês' : 'ano'}</span>
                </div>
                {billingCycle === 'yearly' && (
                  <span className="text-xs text-primary font-medium">2 meses de incentivo</span>
                )}
              </div>
              <ul className="space-y-2 mb-6 mt-4">
                {(plan.features as string[]).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="inline-block w-4 h-4 mt-1 bg-primary rounded-full flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full mt-auto"
                variant={plan.is_popular ? 'default' : 'outline'}
                onClick={() => handleSubscribe(plan.id)}
                disabled={createCheckoutSession.isPending}
              >
                {createCheckoutSession.isPending ? 'Aguarde...' : `Assinar ${plan.display_name}`}
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ or Features Comparison could go here */}
        <div className="mt-16 text-center">
          <h2 className="font-serif text-2xl mb-4">Dúvidas?</h2>
          <p className="text-muted-foreground">
            Entre em contato pelo e-mail{' '}
            <a href="mailto:contato@eventum.com.br" className="text-primary hover:underline">
              contato@eventum.com.br
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

