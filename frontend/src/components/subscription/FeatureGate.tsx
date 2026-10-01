import { ReactNode } from 'react';
import { useFeatureGate, PlanName, planLabels } from '@/hooks/useSubscription';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
}: FeatureGateProps) {
  const { hasAccess, requiredPlan, isLoading, featureName } = useFeatureGate(feature);
  const navigate = useNavigate();

  if (isLoading) {
    return null;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg bg-muted/30">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
        <Lock className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{featureName}</h3>
      <p className="text-muted-foreground mb-4">
        Esta funcionalidade está disponível a partir do plano{' '}
        <span className="font-medium text-foreground">{planLabels[requiredPlan]}</span>
      </p>
      <Button onClick={() => navigate('/pricing')} className="gap-2">
        <Sparkles className="h-4 w-4" />
        Ver Planos
      </Button>
    </div>
  );
}

interface FeatureButtonProps {
  feature: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
}

export function FeatureButton({
  feature,
  children,
  onClick,
  className,
  variant = 'default',
  size = 'default',
  disabled = false,
}: FeatureButtonProps) {
  const { hasAccess, requiredPlan } = useFeatureGate(feature);
  const navigate = useNavigate();

  const handleClick = () => {
    if (hasAccess) {
      onClick?.();
    } else {
      navigate('/pricing');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={disabled}
    >
      {!hasAccess && <Lock className="h-4 w-4 mr-2" />}
      {children}
      {!hasAccess && (
        <span className="ml-2 text-xs opacity-70">
          ({planLabels[requiredPlan]})
        </span>
      )}
    </Button>
  );
}
