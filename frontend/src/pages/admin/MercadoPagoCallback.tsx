import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useProcessMercadoPagoCallback } from '@/hooks/useMercadoPago';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function MercadoPagoCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const processCallback = useProcessMercadoPagoCallback();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMessage('A autorização foi cancelada ou ocorreu um erro.');
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setErrorMessage('Parâmetros de callback inválidos.');
      return;
    }

    // Process the OAuth callback
    processCallback.mutate(
      { code, state },
      {
        onSuccess: () => {
          setStatus('success');
        },
        onError: (error) => {
          setStatus('error');
          setErrorMessage(error.message || 'Erro ao processar conexão.');
        },
      }
    );
  }, [searchParams]);

  const handleContinue = () => {
    navigate('/admin/mercadopago');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'processing' && 'Conectando...'}
            {status === 'success' && 'Conexão Realizada!'}
            {status === 'error' && 'Erro na Conexão'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'processing' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground text-center">
                Estamos conectando sua conta Mercado Pago...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="text-center">
                Sua conta Mercado Pago foi conectada com sucesso! 
                Agora você pode receber pagamentos dos presentes.
              </p>
              <Button onClick={handleContinue} className="w-full">
                Continuar
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-destructive" />
              <p className="text-center text-muted-foreground">
                {errorMessage}
              </p>
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline" 
                  onClick={handleContinue}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button 
                  onClick={() => navigate('/admin/mercadopago')}
                  className="flex-1"
                >
                  Tentar Novamente
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
