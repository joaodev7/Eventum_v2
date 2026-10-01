import { ReactNode } from 'react';
import { useFeatureGate } from '@/hooks/useSubscription';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { planLabels } from '@/hooks/useSubscription';

interface FeatureGuardProps {
  feature: string;
  children: ReactNode;
  title?: string;
  description?: string;
}

export function FeatureGuard({ feature, children, title, description }: FeatureGuardProps) {
  const { hasAccess, isLoading, requiredPlan, featureName } = useFeatureGate(feature);

  if (isLoading) {
    return (
      <div className="w-full flex justify-center p-8">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Fallback UI when user does not have access
  return (
    <div className="p-6 bg-muted/30 rounded-lg text-center border border-dashed">
      <h3 className="text-lg font-semibold mb-2">{title || featureName || 'Funcionalidade Indisponível'}</h3>
      <p className="text-muted-foreground mb-4 text-sm max-w-md mx-auto">
        {description || `Esta funcionalidade requer o plano "${planLabels[requiredPlan]}" ou superior.`}
      </p>
      <Button asChild>
        <Link to="/admin/subscription">Ver Planos e Fazer Upgrade</Link>
      </Button>
    </div>
  );
}
