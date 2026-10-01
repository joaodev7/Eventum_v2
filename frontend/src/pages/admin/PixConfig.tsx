import { useState, useEffect, useRef } from 'react';
import { FeatureGuard } from '@/components/common/FeatureGuard';
import { useEvent } from '@/contexts/EventContext';
import { usePixConfig, useUpdatePixConfig } from '@/hooks/useGifts';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, QrCode, Copy, Check, AlertCircle, Upload, X, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminPixConfigPage() {
  const { currentEvent, isLoadingEvents } = useEvent();
  const { data: pixConfig, isLoading } = usePixConfig(currentEvent?.id);
  const updatePixConfig = useUpdatePixConfig();
  const { uploadImage, isUploading } = useImageUpload();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    pix_key: '',
    qr_code_url: '',
    recipient_name: '',
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (pixConfig) {
      setFormData({
        pix_key: pixConfig.pix_key || '',
        qr_code_url: pixConfig.qr_code_url || '',
        recipient_name: pixConfig.recipient_name || '',
      });
    }
  }, [pixConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent) return;
    
    await updatePixConfig.mutateAsync({
      eventId: currentEvent.id,
      pix_key: formData.pix_key || null,
      qr_code_url: formData.qr_code_url || null,
      recipient_name: formData.recipient_name || null,
    });
  };

  const handleCopyPix = async () => {
    if (formData.pix_key) {
      await navigator.clipboard.writeText(formData.pix_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Chave PIX copiada!' });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Arquivo inválido', description: 'Selecione uma imagem', variant: 'destructive' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'Máximo 5MB', variant: 'destructive' });
      return;
    }

    const url = await uploadImage(file, 'pix-qrcode');
    if (url) {
      setFormData({ ...formData, qr_code_url: url });
      toast({ title: 'QR Code enviado com sucesso!' });
    }
  };

  const handleRemoveQrCode = () => {
    setFormData({ ...formData, qr_code_url: '' });
  };

  if (isLoadingEvents || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum evento selecionado</p>
      </div>
    );
  }

  return (
    <FeatureGuard feature="usuarios_extra">
      <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-serif">Configuração PIX</h1>
        <p className="text-muted-foreground">Configure a chave PIX para receber os presentes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Dados do PIX
          </CardTitle>
          <CardDescription>
            Configure sua chave PIX e QR Code para que os convidados possam fazer pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="recipient_name">Nome do Destinatário</Label>
              <Input
                id="recipient_name"
                value={formData.recipient_name}
                onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                placeholder="Nome que aparecerá para os convidados"
              />
              <p className="text-sm text-muted-foreground">
                Nome que será exibido aos convidados ao fazer o PIX
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pix_key">Chave PIX (Copia e Cola)</Label>
              <div className="flex gap-2">
                <Input
                  id="pix_key"
                  value={formData.pix_key}
                  onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                  placeholder="Chave PIX ou código copia e cola"
                  className="font-mono"
                />
                {formData.pix_key && (
                  <Button type="button" variant="outline" size="icon" onClick={handleCopyPix}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Pode ser uma chave PIX (CPF, email, telefone, aleatória) ou código copia e cola
              </p>
            </div>

            <div className="space-y-2">
              <Label>Imagem do QR Code</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {formData.qr_code_url ? (
                <div className="space-y-3">
                  <div className="relative inline-block">
                    <div className="p-4 bg-muted rounded-lg">
                      <img
                        src={formData.qr_code_url}
                        alt="QR Code PIX"
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 w-8 h-8"
                      onClick={handleRemoveQrCode}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Trocar imagem
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  {isUploading ? (
                    <Loader2 className="w-10 h-10 mx-auto text-muted-foreground animate-spin" />
                  ) : (
                    <Image className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  )}
                  <p className="text-muted-foreground">
                    {isUploading ? 'Enviando...' : 'Clique para fazer upload do QR Code'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    PNG, JPG ou WEBP (máx. 5MB)
                  </p>
                </div>
              )}
            </div>

            {!formData.pix_key && !formData.qr_code_url && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">PIX não configurado</p>
                  <p className="text-sm text-amber-700">
                    Configure pelo menos a chave PIX ou o QR Code para que os convidados possam fazer pagamentos.
                  </p>
                </div>
              </div>
            )}

            <Button type="submit" disabled={updatePixConfig.isPending}>
              {updatePixConfig.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Configurações
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como funciona?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            1. O convidado escolhe um presente na lista
          </p>
          <p>
            2. O convidado vê o QR Code e/ou a chave PIX que você configurou
          </p>
          <p>
            3. Após fazer o PIX, o convidado confirma o pagamento
          </p>
          <p>
            4. O presente fica "reservado" automaticamente
          </p>
          <p>
            5. Você confirma manualmente na aba "Pagamentos" quando receber o valor
          </p>
          <p className="font-medium text-foreground">
            Dica: Use o QR Code gerado pelo seu banco para facilitar!
          </p>
        </CardContent>
      </Card>
      </div>
    </FeatureGuard>
  );
}
