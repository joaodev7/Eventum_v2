import { useGiftPayments, useApprovePayment } from '@/hooks/useGifts';
import { useEvent } from '@/contexts/EventContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Clock, DollarSign, Gift } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FeatureGuard } from '@/components/common/FeatureGuard';

export default function AdminPaymentsPage() {
  const { currentEvent } = useEvent();
  const { data: payments, isLoading } = useGiftPayments(currentEvent?.id);
  const approvePayment = useApprovePayment();

  const handleApprove = async (paymentId: string) => {
    await approvePayment.mutateAsync(paymentId);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  // Stats
  const pendingPayments = payments?.filter(p => p.status === 'pending') || [];
  const confirmedPayments = payments?.filter(p => p.status === 'confirmed') || [];
  const totalReceived = confirmedPayments.reduce((acc, p) => acc + (p.gift?.value || 0), 0);
  const totalPending = pendingPayments.reduce((acc, p) => acc + (p.gift?.value || 0), 0);

  if (!currentEvent) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Selecione um evento para ver os pagamentos</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <FeatureGuard feature="pagamentos">
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif">Pagamentos</h1>
        <p className="text-muted-foreground">Gerencie os pagamentos de presentes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{pendingPayments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Check className="w-4 h-4" />
              Confirmados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{confirmedPayments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalReceived)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Aguardando
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">{formatCurrency(totalPending)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!payments || payments.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum pagamento registrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Presente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Convidado</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {payment.gift?.image_url ? (
                          <img
                            src={payment.gift.image_url}
                            alt={payment.gift.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            <Gift className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium">{payment.gift?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(payment.gift?.value || 0)}</TableCell>
                    <TableCell>{payment.guest_name || <span className="text-muted-foreground">Anônimo</span>}</TableCell>
                    <TableCell>
                      {payment.message ? (
                        <span className="line-clamp-1 max-w-[200px]">{payment.message}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(payment.created_at)}</TableCell>
                    <TableCell>
                      {payment.status === 'pending' ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          <Clock className="w-3 h-3 mr-1" />
                          Aguardando
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <Check className="w-3 h-3 mr-1" />
                          Confirmado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(payment.id)}
                          disabled={approvePayment.isPending}
                        >
                          {approvePayment.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Confirmar
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  </FeatureGuard>
  );
}