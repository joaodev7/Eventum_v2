import { useSubscription, planLabels, planColors, PlanName } from '@/hooks/useSubscription';
import { Badge } from '@/components/ui/badge';
import { Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanBadgeProps {
  className?: string;
  showIcon?: boolean;
}

export function PlanBadge({ className, showIcon = true }: PlanBadgeProps) {
  const { plan, isTrialing, daysRemaining } = useSubscription();

  const getIcon = (planName: PlanName) => {
    switch (planName) {
      case 'premium':
      case 'enterprise':
        return <Crown className="h-3 w-3" />;
      case 'pro':
      case 'starter':
        return <Sparkles className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge variant="secondary" className={cn('gap-1', planColors[plan])}>
        {showIcon && getIcon(plan)}
        {planLabels[plan]}
      </Badge>
      {isTrialing && daysRemaining !== null && daysRemaining > 0 && (
        <Badge variant="outline" className="text-xs">
          {daysRemaining} dias restantes
        </Badge>
      )}
    </div>
  );
}
