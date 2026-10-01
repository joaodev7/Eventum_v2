import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAvailableGifts, usePixConfig, useReserveGift, useConfirmGiftPayment, Gift } from '@/hooks/useGifts';
import { useCreateMercadoPagoPayment } from '@/hooks/useMercadoPago';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Gift as GiftIcon, ArrowLeft, Loader2, Copy, Check, AlertCircle, CreditCard, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SeoHead } from '@/components/common/SeoHead';

type PaymentMethod = 'pix' | 'mercadopago';

export default function GiftsPage() {
  const [searchParams] = useSearchParams();
  const { data: gifts, isLoading, refetch } = useAvailableGifts();
  const { data: pixConfig } = usePixConfig();
  const reserveGift = useReserveGift();
  const confirmPayment = useConfirmGiftPayment();
  const createMPPayment = useCreateMercadoPagoPayment();
  const { toast } = useToast();

  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [step, setStep] = useState<'select' | 'method' | 'payment' | 'confirm' | 'success'>('select');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mercadopago');
  const [guestName, setGuestName] = useState('');
  const [message, setMessage] = useState('');
  
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle Mercado Pago callback
  useEffect(() => {
    const status = searchParams.get('status');
    const giftId = searchParams.get('gift_id');

    if (status && giftId) {
      if (status === 'success') {
        toast({
          title: 'Pagamento aprovado!',
          description: 'Seu presente foi confirmado com sucesso. Muito obrigado!',
        });
        refetch();
      } else if (status === 'failure') {
        toast({
          title: 'Pagamento não aprovado',
          description: 'O pagamento não foi processado. Por favor, tente novamente.',
          variant: 'destructive',
        });
      } else if (status === 'pending') {
        toast({
          title: 'Pagamento pendente',
          description: 'Seu pagamento está sendo processado. Você será notificado quando for aprovado.',
        });
      }
      // Clean URL
      window.history.replaceState({}, '', '/presentes');
    }
  }, [searchParams, toast, refetch]);

  const handleSelectGift = (gift: Gift) => {
    if (gift.status !== 'available') {
      toast({ title: 'Presente não disponível', variant: 'destructive' });
      return;
    }

    setSelectedGift(gift);
    setStep('method');
  };

  const handleCopyPix = async () => {
    if (pixConfig?.pix_key) {
      await navigator.clipboard.writeText(pixConfig.pix_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Chave PIX copiada!' });
    }
  };

  const handleMercadoPagoPayment = async () => {
    if (!selectedGift) return;

    // Esta página legada não tem contexto de evento
    // Pagamento via Mercado Pago não está disponível sem evento
    toast({
      title: 'Mercado Pago não disponível',
      description: 'Use a página de presentes do evento para pagar com Mercado Pago',
      variant: 'destructive',
    });
    return;
  };

  const handleConfirmPixPayment = async () => {
    if (!selectedGift) return;

    setIsProcessing(true);
    try {
      await reserveGift.mutateAsync(selectedGift.id);
      await confirmPayment.mutateAsync({
        giftId: selectedGift.id,
        guestName: guestName || undefined,
        message: message || undefined,
      });
      setStep('success');
    } catch {
      // Error handled by mutation
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedGift(null);
    setStep('select');
    setPaymentMethod('mercadopago');
    setGuestName('');
    setMessage('');
    
    setCopied(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="secondary" className="bg-sage-light text-sage-foreground">Disponível</Badge>;
      case 'reserved':
        return <Badge variant="outline" className="bg-champagne-light">Reservado</Badge>;
      case 'received':
        return <Badge className="bg-dusty-rose">Recebido</Badge>;
      default:
        return null;
    }
  };

  const calculateInstallmentValue = (value: number, numInstallments: number) => {
    return formatCurrency(value / numInstallments);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <SeoHead
        title="Lista de Presentes — Eventum"
        description="Contribua com presentes especiais de forma rápida e segura através de PIX ou cartão de crédito ✓"
      />
      {/* Header */}
      <header className="bg-card/80 backdrop-blur border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-dusty-rose" fill="currentColor" />
            <span className="font-serif text-xl">Lista de Presentes</span>
          </div>
          <div className="w-20" />
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 text-center">
        <div className="container mx-auto px-4">
          <GiftIcon className="w-12 h-12 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-serif mb-4">Lista de Presentes</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Sua presença é o nosso maior presente! Mas se desejar nos presentear, 
            escolha um item da nossa lista. Você pode pagar via PIX ou parcelar no cartão!
          </p>
        </div>
      </section>

      {/* Gifts Grid */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          {!gifts || gifts.length === 0 ? (
            <div className="text-center py-12">
              <GiftIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum presente cadastrado ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {gifts.map((gift) => (
                <Card key={gift.id} className="overflow-hidden hover:shadow-elegant transition-shadow">
                  <div className="aspect-square bg-muted relative">
                    {gift.image_url ? (
                      <img
                        src={gift.image_url}
                        alt={gift.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <GiftIcon className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(gift.status)}
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-serif">{gift.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    {gift.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {gift.description}
                      </p>
                    )}
                    <p className="text-xl font-semibold text-primary">
                      {formatCurrency(gift.value)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ou até 12x de {calculateInstallmentValue(gift.value, 12)}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      disabled={gift.status !== 'available' || isProcessing}
                      onClick={() => handleSelectGift(gift)}
                    >
                      {gift.status === 'available' ? (
                        <>
                          <Heart className="w-4 h-4 mr-2" />
                          Presentear
                        </>
                      ) : gift.status === 'reserved' ? (
                        'Reservado'
                      ) : (
                        'Já Recebido'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Payment Dialog */}
      <Dialog open={step !== 'select'} onOpenChange={() => step !== 'success' && handleClose()}>
        <DialogContent className="max-w-md">
          {/* Step: Choose Payment Method */}
          {step === 'method' && selectedGift && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Como deseja pagar?</DialogTitle>
                <DialogDescription>
                  <strong>{selectedGift.name}</strong> - {formatCurrency(selectedGift.value)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Seu nome (opcional)</Label>
                  <Input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Como você quer ser identificado"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mensagem para os noivos (opcional)</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Deixe uma mensagem carinhosa..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('mercadopago')}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      paymentMethod === 'mercadopago'
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                  >
                    <CreditCard className="w-8 h-8 text-primary" />
                    <span className="font-medium text-sm">Cartão</span>
                    <span className="text-xs text-muted-foreground">Até 12x</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      paymentMethod === 'pix'
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                  >
                    <QrCode className="w-8 h-8 text-primary" />
                    <span className="font-medium text-sm">PIX</span>
                    <span className="text-xs text-muted-foreground">À vista</span>
                  </button>
                </div>

              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  className="w-full"
                  onClick={() => {
                    if (paymentMethod === 'mercadopago') {
                      handleMercadoPagoPayment();
                    } else {
                      setStep('payment');
                    }
                  }}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : paymentMethod === 'mercadopago' ? (
                    <CreditCard className="w-4 h-4 mr-2" />
                  ) : (
                    <QrCode className="w-4 h-4 mr-2" />
                  )}
                  {paymentMethod === 'mercadopago' ? 'Pagar com Cartão' : 'Continuar com PIX'}
                </Button>
                <Button variant="outline" className="w-full" onClick={handleClose}>
                  Cancelar
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Step: PIX Payment */}
          {step === 'payment' && selectedGift && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Pagamento via PIX</DialogTitle>
                <DialogDescription>
                  <strong>{selectedGift.name}</strong> - {formatCurrency(selectedGift.value)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {!pixConfig?.pix_key && !pixConfig?.qr_code_url ? (
                  <div className="text-center p-4 bg-destructive/10 rounded-lg">
                    <AlertCircle className="w-8 h-8 mx-auto text-destructive mb-2" />
                    <p className="text-sm text-destructive">
                      PIX não configurado. Entre em contato com os noivos.
                    </p>
                  </div>
                ) : (
                  <>
                    {pixConfig?.qr_code_url && (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Escaneie o QR Code:</p>
                        <img
                          src={pixConfig.qr_code_url}
                          alt="QR Code PIX"
                          className="w-48 h-48 mx-auto border rounded-lg"
                        />
                      </div>
                    )}

                    {pixConfig?.pix_key && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Ou copie a chave PIX:</p>
                        <div className="flex gap-2">
                          <Input value={pixConfig.pix_key} readOnly className="font-mono text-sm" />
                          <Button variant="outline" size="icon" onClick={handleCopyPix}>
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    )}

                    {pixConfig?.recipient_name && (
                      <p className="text-sm text-muted-foreground text-center">
                        Destinatário: <strong>{pixConfig.recipient_name}</strong>
                      </p>
                    )}

                    <div className="p-4 bg-champagne-light rounded-lg">
                      <p className="text-sm font-medium mb-2">Instruções:</p>
                      <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Abra o app do seu banco</li>
                        <li>Escaneie o QR Code ou use a chave PIX</li>
                        <li>Confirme o valor de {formatCurrency(selectedGift.value)}</li>
                        <li>Finalize o pagamento</li>
                        <li>Envie o comprovante para o contato que te enviou o convite</li>
                        <li>Clique em "Já paguei" abaixo</li>
                      </ol>
                    </div>
                  </>
                )}
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  className="w-full"
                  onClick={() => setStep('confirm')}
                  disabled={!pixConfig?.pix_key && !pixConfig?.qr_code_url}
                >
                  Já realizei o pagamento
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setStep('method')}>
                  Voltar
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Step: Confirm PIX */}
          {step === 'confirm' && selectedGift && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Confirmar Presente</DialogTitle>
                <DialogDescription>
                  Confirme que realizou o pagamento PIX para registrar seu presente.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="font-medium">{selectedGift.name}</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(selectedGift.value)}</p>
                  {guestName && <p className="text-sm text-muted-foreground mt-2">De: {guestName}</p>}
                </div>
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  className="w-full"
                  onClick={handleConfirmPixPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Confirmar Presente
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setStep('payment')}>
                  Voltar
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <>
              <DialogHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-sage-light rounded-full flex items-center justify-center mb-4">
                  <Heart className="w-8 h-8 text-sage" fill="currentColor" />
                </div>
                <DialogTitle className="font-serif text-2xl">Muito Obrigado!</DialogTitle>
                <DialogDescription className="text-base">
                  Seu presente foi registrado com sucesso! Os noivos irão confirmar o recebimento em breve.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="pt-4">
                <Button className="w-full" onClick={handleClose}>
                  Voltar para a Lista
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
