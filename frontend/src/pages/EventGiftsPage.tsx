import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useEventBySlug } from '@/contexts/EventContext';
import { useAvailableGifts, usePixConfig, useReserveGift, useConfirmGiftPayment, Gift } from '@/hooks/useGifts';
import { useCreateMercadoPagoPayment } from '@/hooks/useMercadoPago';
import { EventThemeProvider } from '@/components/public/EventThemeProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Heart, Gift as GiftIcon, ArrowLeft, Loader2, Copy, Check, AlertCircle, CreditCard, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SeoHead } from '@/components/common/SeoHead';

type PaymentMethod = 'pix' | 'mercadopago';

const EventGiftsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { event, isLoading: eventLoading, error: eventError } = useEventBySlug(slug || '');
  const { data: gifts, isLoading: giftsLoading, refetch } = useAvailableGifts(event?.id);
  const { data: pixConfig } = usePixConfig(event?.id);
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
  const [customValue, setCustomValue] = useState('');

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
      window.history.replaceState({}, '', `/evento/${slug}/presentes`);
    }
  }, [searchParams, toast, refetch, slug]);

  const handleSelectGift = (gift: Gift) => {
    if (gift.status !== 'available') {
      toast({ title: 'Presente não disponível', variant: 'destructive' });
      return;
    }
    setSelectedGift(gift);
    // Set initial custom value for flexible gifts
    if (gift.is_flexible_value) {
      setCustomValue((gift.min_value || 1).toString());
    }
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

    const paymentValue = selectedGift.is_flexible_value 
      ? parseFloat(customValue) 
      : selectedGift.value;

    // Validate minimum value for flexible gifts
    if (selectedGift.is_flexible_value) {
      const minValue = selectedGift.min_value || 1;
      if (paymentValue < minValue) {
        toast({ 
          title: 'Valor abaixo do mínimo', 
          description: `O valor mínimo é ${formatCurrency(minValue)}`,
          variant: 'destructive' 
        });
        return;
      }
    }

    setIsProcessing(true);
    try {
      const result = await createMPPayment.mutateAsync({
        giftId: selectedGift.id,
        giftName: selectedGift.name,
        giftValue: paymentValue,
        guestName: guestName || undefined,
        message: message || undefined,
        eventId: event.id,
      });

      // Redirect to Mercado Pago checkout
      window.location.href = result.initPoint;
    } catch {
      // Error handled by mutation
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPixPayment = async () => {
    if (!selectedGift || !event) return;

    setIsProcessing(true);
    try {
      await reserveGift.mutateAsync(selectedGift.id);
      await confirmPayment.mutateAsync({
        giftId: selectedGift.id,
        guestName: guestName || undefined,
        message: message || undefined,
        eventId: event.id,
      });
      setStep('success');
      refetch();
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
    setCustomValue('');
  };

  const getPaymentValue = () => {
    if (!selectedGift) return 0;
    return selectedGift.is_flexible_value 
      ? parseFloat(customValue) || 0 
      : selectedGift.value;
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
        return <Badge variant="secondary">Disponível</Badge>;
      case 'reserved':
        return <Badge variant="outline">Reservado</Badge>;
      case 'received':
        return <Badge>Recebido</Badge>;
      default:
        return null;
    }
  };

  const calculateInstallmentValue = (value: number, numInstallments: number) => {
    return formatCurrency(value / numInstallments);
  };

  if (eventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-3xl font-serif text-foreground">Evento não encontrado</h1>
          <Button asChild>
            <Link to="/">Voltar ao Início</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <EventThemeProvider themeConfig={event.theme_config}>
      <SeoHead
        title={`Lista de Presentes — ${event.event_name}`}
        description={`Presenteie ${event.event_name} escolhendo um item da lista exclusiva. Pagamento rápido, seguro e direto via PIX ou cartão ✓`}
        ogImage={event.hero_image_url || undefined}
        ogType="website"
      />
    <div className="min-h-screen bg-[hsl(var(--event-background,var(--background)))]">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/evento/${event.slug}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>
          <div className="text-center">
            <Heart className="w-8 h-8 mx-auto text-primary mb-2" fill="currentColor" />
            <h1 className="text-3xl font-serif mb-2">{event.event_name}</h1>
            <p className="text-muted-foreground">Lista de Presentes</p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-8 text-center bg-muted/30">
        <div className="container mx-auto px-4">
          <GiftIcon className="w-10 h-10 mx-auto text-primary mb-3" />
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Sua presença é o nosso maior presente! Mas se desejar nos presentear, 
            escolha um item da nossa lista. Você pode pagar via PIX ou parcelar no cartão!
          </p>
        </div>
      </section>

      {/* Gifts Grid */}
      <main className="container mx-auto px-4 py-8">
        {giftsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !gifts || gifts.length === 0 ? (
          <div className="text-center py-12">
            <GiftIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum presente cadastrado ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {gifts.map((gift) => (
              <Card key={gift.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{gift.description}</p>
                  )}
                  {gift.is_flexible_value ? (
                    <>
                      <div className="flex items-center gap-1 text-primary">
                        <Heart className="w-4 h-4" />
                        <span className="text-lg font-semibold">Valor livre</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        A partir de {formatCurrency(gift.min_value || 1)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-semibold text-primary">
                        {formatCurrency(gift.value)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ou até 12x de {calculateInstallmentValue(gift.value, 12)}
                      </p>
                    </>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => handleSelectGift(gift)}
                    disabled={gift.status !== 'available' || isProcessing}
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
      </main>

      {/* Payment Dialog */}
      <Dialog open={step !== 'select'} onOpenChange={() => step !== 'success' && handleClose()}>
        <DialogContent className="max-w-md">
          {/* Step: Choose Payment Method */}
          {step === 'method' && selectedGift && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Como deseja pagar?</DialogTitle>
                <DialogDescription>
                  <strong>{selectedGift.name}</strong>
                  {!selectedGift.is_flexible_value && ` - ${formatCurrency(selectedGift.value)}`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {selectedGift.is_flexible_value && (
                  <div className="space-y-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <Label htmlFor="customValue" className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-primary" />
                      Qual valor você deseja presentear?
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                      <Input
                        id="customValue"
                        type="number"
                        step="0.01"
                        min={selectedGift.min_value || 1}
                        value={customValue}
                        onChange={(e) => setCustomValue(e.target.value)}
                        className="pl-10 text-lg font-semibold"
                        placeholder={(selectedGift.min_value || 1).toString()}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Valor mínimo: {formatCurrency(selectedGift.min_value || 1)}
                    </p>
                  </div>
                )}

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
                  <strong>{selectedGift.name}</strong> - {formatCurrency(getPaymentValue())}
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

                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">Instruções:</p>
                      <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Abra o app do seu banco</li>
                        <li>Escaneie o QR Code ou use a chave PIX</li>
                        <li>Confirme o valor de {formatCurrency(getPaymentValue())}</li>
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
                  <p className="text-xl font-bold text-primary">{formatCurrency(getPaymentValue())}</p>
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
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Heart className="w-8 h-8 text-primary" fill="currentColor" />
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
    </EventThemeProvider>
  );
};

export default EventGiftsPage;
