import { useDashboardMetrics } from '@/hooks/useGuests';
import { useReconfirmationMetrics } from '@/hooks/useReconfirmation';
import { useEvent } from '@/contexts/EventContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Check, X, Clock, Eye, RefreshCw, UserCheck, UserX, AlertTriangle, User, UsersRound } from 'lucide-react';

export default function Dashboard() {
  const { currentEvent } = useEvent();
  const { data: metrics, isLoading } = useDashboardMetrics(currentEvent?.id);
  const { data: reconfirmationMetrics, isLoading: reconfirmationLoading } = useReconfirmationMetrics(currentEvent?.id);

  const formatMetric = (guests: number, companions: number) => {
    return `${guests + companions}`;
  };

  const formatDetail = (guests: number, companions: number) => {
    return `${guests} conv. + ${companions} acomp.`;
  };

  const firstConfirmationCards = [
    { 
      label: 'Total', 
      value: metrics ? formatMetric(metrics.totalGuests, metrics.totalCompanions) : '0',
      detail: metrics ? formatDetail(metrics.totalGuests, metrics.totalCompanions) : '',
      icon: Users, 
      color: 'text-primary' 
    },
    { 
      label: 'Confirmados', 
      value: metrics ? formatMetric(metrics.acceptedGuests, metrics.acceptedCompanions) : '0',
      detail: metrics ? formatDetail(metrics.acceptedGuests, metrics.acceptedCompanions) : '',
      icon: Check, 
      color: 'text-sage' 
    },
    { 
      label: 'Recusados', 
      value: metrics ? formatMetric(metrics.declinedGuests, metrics.declinedCompanions) : '0',
      detail: metrics ? formatDetail(metrics.declinedGuests, metrics.declinedCompanions) : '',
      icon: X, 
      color: 'text-destructive' 
    },
    { 
      label: 'Pendentes', 
      value: metrics ? formatMetric(metrics.pendingGuests, metrics.pendingCompanions) : '0',
      detail: metrics ? formatDetail(metrics.pendingGuests, metrics.pendingCompanions) : '',
      icon: Clock, 
      color: 'text-muted-foreground' 
    },
    { 
      label: 'Visualizaram', 
      value: metrics ? formatMetric(metrics.viewedGuests, metrics.viewedCompanions) : '0',
      detail: metrics ? formatDetail(metrics.viewedGuests, metrics.viewedCompanions) : '',
      icon: Eye, 
      color: 'text-champagne' 
    },
  ];

  const secondConfirmationCards = [
    { label: 'Enviados', value: (reconfirmationMetrics?.secondConfirmed || 0) + (reconfirmationMetrics?.secondDeclined || 0) + (reconfirmationMetrics?.secondPending || 0), icon: RefreshCw, color: 'text-primary' },
    { label: 'Reconfirmados', value: reconfirmationMetrics?.secondConfirmed || 0, icon: UserCheck, color: 'text-sage' },
    { label: 'Desistências', value: reconfirmationMetrics?.secondDeclined || 0, icon: UserX, color: 'text-destructive' },
    { label: 'Pendentes', value: reconfirmationMetrics?.secondPending || 0, icon: Clock, color: 'text-champagne' },
    { label: 'Não Enviados', value: reconfirmationMetrics?.notSent || 0, icon: AlertTriangle, color: 'text-muted-foreground' },
  ];

  if (!currentEvent) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Selecione um evento para ver o dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral dos convites do seu evento</p>
      </div>

      {/* First Confirmation Section */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl text-muted-foreground">1ª Confirmação</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {firstConfirmationCards.map((card) => (
            <Card key={card.label} variant="elegant">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground flex items-center gap-2">
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                  {card.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-serif ${card.color}`}>
                  {isLoading ? '...' : card.value}
                </p>
                {card.detail && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {isLoading ? '' : card.detail}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Second Confirmation Section */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl text-muted-foreground">2ª Confirmação (Revalidação)</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {secondConfirmationCards.map((card) => (
            <Card key={card.label} variant="elegant">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground flex items-center gap-2">
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                  {card.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-serif ${card.color}`}>
                  {reconfirmationLoading ? '...' : card.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Total Confirmed Highlight */}
      <Card variant="default" className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Total de Pessoas Confirmadas
          </CardTitle>
          <CardDescription>
            Considera a 2ª confirmação quando enviada, ou a 1ª quando ainda não enviada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-5xl font-serif text-primary">
            {reconfirmationLoading ? '...' : reconfirmationMetrics?.totalConfirmedPeople || 0}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}