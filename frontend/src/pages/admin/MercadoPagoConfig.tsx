import { useEvent } from '@/contexts/EventContext';
import { 
  useMercadoPagoConnection, 
  useStartMercadoPagoOAuth, 
  useDisconnectMercadoPago,
  useRefreshMercadoPagoToken 
} from '@/hooks/useMercadoPago';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Link2, Unlink, RefreshCw, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FeatureGuard } from '@/components/common/FeatureGuard';

export default function MercadoPagoConfig() {
  const { currentEvent } = useEvent();
  const { data: connection, isLoading } = useMercadoPagoConnection(currentEvent?.id);
  const startOAuth = useStartMercadoPagoOAuth();
  const disconnect = useDisconnectMercadoPago();
  const refreshToken = useRefreshMercadoPagoToken();

  const handleConnect = async () => {
    if (!currentEvent?.id) return;
    
    try {
      const authUrl = await startOAuth.mutateAsync(currentEvent.id);
      // Redirect to Mercado Pago OAuth
      window.location.href = authUrl;
    } catch {
      // Error handled by mutation
    }
  };

  const handleDisconnect = async () => {
    if (!currentEvent?.id) return;
    
    if (!confirm('Tem certeza que deseja desconectar sua conta Mercado Pago?')) {
      return;
    }
    
    try {
      await disconnect.mutateAsync(currentEvent.id);
    } catch {
      // Error handled by mutation
    }
  };

  const handleRefreshToken = async () => {
    if (!currentEvent?.id) return;
    
    try {
      await refreshToken.mutateAsync(currentEvent.id);
    } catch {
      // Error handled by mutation
    }
  };

  // Check if token is expiring soon (within 7 days)
  const isTokenExpiringSoon = connection?.token_expires_at 
    ? new Date(connection.token_expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    : false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mercado Pago</h1>
        <p className="text-muted-foreground">
          Configure sua conta Mercado Pago para receber pagamentos dos presentes
        </p>
      </div>

      <FeatureGuard
        feature="mercado_pago"
        title="Integração Mercado Pago"
        description="Receba pagamentos via Cartão e Boleto diretamente na sua conta com o plano Pro."
      >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#00bcff] rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Mercado Pago</CardTitle>
                <CardDescription>
                  Receba pagamentos com cartão de crédito, Pix e boleto
                </CardDescription>
              </div>
            </div>
            {connection ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="w-3 h-3 mr-1" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertCircle className="w-3 h-3 mr-1" />
                Não conectado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {connection ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Conta</p>
                  <p className="font-medium">{connection.mp_email || 'Email não disponível'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conectado em</p>
                  <p className="font-medium">
                    {connection.connected_at 
                      ? format(new Date(connection.connected_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : '-'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Token expira em</p>
                  <p className={`font-medium ${isTokenExpiringSoon ? 'text-yellow-600' : ''}`}>
                    {connection.token_expires_at 
                      ? format(new Date(connection.token_expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                      : '-'
                    }
                    {isTokenExpiringSoon && (
                      <span className="ml-2 text-xs text-yellow-600">(expirando em breve)</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ID do Vendedor</p>
                  <p className="font-medium font-mono text-sm">{connection.mp_user_id}</p>
                </div>
              </div>

              {isTokenExpiringSoon && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    Seu token está expirando em breve. Clique em "Renovar Token" para evitar interrupções nos pagamentos.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRefreshToken}
                  disabled={refreshToken.isPending}
                >
                  {refreshToken.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Renovar Token
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={disconnect.isPending}
                >
                  {disconnect.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Unlink className="w-4 h-4 mr-2" />
                  )}
                  Desconectar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Conecte sua conta Mercado Pago para começar a receber pagamentos dos presentes. 
                O dinheiro vai direto para sua conta, sem intermediários.
              </p>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Como funciona:</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Clique em "Conectar com Mercado Pago"</li>
                  <li>Faça login na sua conta Mercado Pago</li>
                  <li>Autorize a conexão</li>
                  <li>Pronto! Você já pode receber pagamentos</li>
                </ol>
              </div>

              <Button 
                onClick={handleConnect}
                disabled={startOAuth.isPending}
                className="w-full bg-[#00bcff] hover:bg-[#00a8e8]"
              >
                {startOAuth.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4 mr-2" />
                )}
                Conectar com Mercado Pago
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      </FeatureGuard>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            • Os pagamentos são processados diretamente pelo Mercado Pago e depositados na sua conta.
          </p>
          <p>
            • O token de acesso é renovado automaticamente, mas pode expirar após 180 dias de inatividade.
          </p>
          <p>
            • Se os pagamentos pararem de funcionar, tente renovar o token ou reconectar sua conta.
          </p>
          <p>
            • Taxas do Mercado Pago se aplicam conforme seu plano na plataforma deles.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
