import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvent, EventType, ThemeConfig, EventSettings } from '@/contexts/EventContext';
import { useImageUpload } from '@/hooks/useImageUpload';
import { eventsApi } from '@/api/events';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Loader2, Upload, X, Image, Plus, Calendar, MapPin, Heart, 
  Settings, Globe, Palette, Type, Eye, Trash2, Archive, EyeOff, Clock,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colorPalettes } from '@/components/public/EventThemeProvider';
import { ThemePreview } from '@/components/admin/ThemePreview';
import { FeatureGuard } from '@/components/common/FeatureGuard';

type EventStatus = 'draft' | 'active' | 'archived';

const statusLabels: Record<EventStatus, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  archived: 'Arquivado',
};

const statusDescriptions: Record<EventStatus, string> = {
  draft: 'Evento não está visível publicamente',
  active: 'Evento está ativo e acessível pelo público',
  archived: 'Evento arquivado, apenas para consulta',
};

const eventTypeLabels: Record<EventType, string> = {
  wedding: 'Casamento',
  birthday: 'Aniversário',
  graduation: 'Formatura',
  party: 'Festa',
  corporate: 'Corporativo',
  other: 'Outro',
};

const fontOptions = [
  { value: 'Playfair Display', label: 'Playfair Display (Elegante)' },
  { value: 'Montserrat', label: 'Montserrat (Moderna)' },
  { value: 'Roboto', label: 'Roboto (Clean)' },
  { value: 'Lora', label: 'Lora (Clássica)' },
  { value: 'Dancing Script', label: 'Dancing Script (Manuscrita)' },
  { value: 'Great Vibes', label: 'Great Vibes (Cursiva)' },
];

export default function AdminSettingsPage() {
  const { currentEvent, isLoadingEvents, refreshEvents, setCurrentEvent, isTrialActive, trialDaysLeft } = useEvent();
  const { uploadImage, isUploading } = useImageUpload();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const heroInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const inviteImageInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    event_name: '',
    event_type: 'wedding' as EventType,
    event_date: '',
    event_time: '',
    venue_name: '',
    venue_address: '',
    venue_maps_link: '',
    welcome_message: '',
    hero_image_url: '',
    invite_image_url: '',
    gallery_images: [] as string[],
    status: 'draft' as EventStatus,
  });

  const [themeConfig, setThemeConfig] = useState<ThemeConfig>({
    primaryColor: '#2D5A5A',
    secondaryColor: '#8B7355',
    accentColor: '#C17F59',
    backgroundColor: '#FAF8F5',
    textColor: '#1F3D3D',
    cardBackgroundColor: '#FFFFFF',
    fontFamily: 'Playfair Display',
    heroSubtitle: 'Celebração de Amor',
    giftsTitle: 'Lista de Presentes',
    giftsDescription: 'Sua presença é nosso maior presente! Mas se desejar nos presentear, acesse nossa lista e escolha um item especial.',
    giftsButtonText: 'Ver Lista de Presentes',
    biblicalQuote: 'O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.',
    biblicalQuoteReference: '1 Coríntios 13:4',
  });

  const [settings, setSettings] = useState<EventSettings>({
    showCountdown: true,
    showGallery: true,
    showGifts: true,
    showLocation: true,
  });

  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  useEffect(() => {
    if (currentEvent) {
      setFormData({
        event_name: currentEvent.event_name || '',
        event_type: currentEvent.event_type || 'wedding',
        event_date: currentEvent.event_date ? currentEvent.event_date.slice(0, 10) : '',
        event_time: currentEvent.event_time || '',
        venue_name: currentEvent.venue_name || '',
        venue_address: currentEvent.venue_address || '',
        venue_maps_link: currentEvent.venue_maps_link || '',
        welcome_message: currentEvent.welcome_message || '',
        hero_image_url: currentEvent.hero_image_url || '',
        invite_image_url: (currentEvent as any).invite_image_url || '',
        gallery_images: currentEvent.gallery_images || [],
        status: (currentEvent.status as EventStatus) || 'draft',
      });

      // Load theme config
      const tc = currentEvent.theme_config || {};
      setThemeConfig({
        primaryColor: tc.primaryColor || '#2D5A5A',
        secondaryColor: tc.secondaryColor || '#8B7355',
        accentColor: tc.accentColor || '#C17F59',
        backgroundColor: tc.backgroundColor || '#FAF8F5',
        textColor: tc.textColor || '#1F3D3D',
        cardBackgroundColor: tc.cardBackgroundColor || '#FFFFFF',
        fontFamily: tc.fontFamily || 'Playfair Display',
        heroSubtitle: tc.heroSubtitle || 'Celebração de Amor',
        giftsTitle: tc.giftsTitle || 'Lista de Presentes',
        giftsDescription: tc.giftsDescription || 'Sua presença é nosso maior presente! Mas se desejar nos presentear, acesse nossa lista e escolha um item especial.',
        giftsButtonText: tc.giftsButtonText || 'Ver Lista de Presentes',
        biblicalQuote: tc.biblicalQuote || 'O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.',
        biblicalQuoteReference: tc.biblicalQuoteReference || '1 Coríntios 13:4',
      });

      // Load settings
      const s = currentEvent.settings || {};
      setSettings({
        showCountdown: s.showCountdown !== false,
        showGallery: s.showGallery !== false,
        showGifts: s.showGifts !== false,
        showLocation: s.showLocation !== false,
      });
    }
  }, [currentEvent]);

  const updateEvent = useMutation({
    mutationFn: async (data: { formData: typeof formData; themeConfig: ThemeConfig; settings: EventSettings }) => {
      if (!currentEvent) throw new Error('No event selected');
      
      await eventsApi.updateEvent(currentEvent.id, {
        eventName: data.formData.event_name,
        eventType: data.formData.event_type,
        eventDate: data.formData.event_date || undefined,
        eventTime: data.formData.event_time || undefined,
        venueName: data.formData.venue_name || undefined,
        venueAddress: data.formData.venue_address || undefined,
        venueMapsLink: data.formData.venue_maps_link || undefined,
        welcomeMessage: data.formData.welcome_message || undefined,
        heroImageUrl: data.formData.hero_image_url || undefined,
        inviteImageUrl: data.formData.invite_image_url || undefined,
        galleryImages: data.formData.gallery_images,
        status: data.formData.status,
        themeConfigJson: JSON.stringify(data.themeConfig),
        settingsJson: JSON.stringify(data.settings),
      });
    },
    onSuccess: (_, variables) => {
      // Update currentEvent immediately with saved data
      if (currentEvent) {
        setCurrentEvent({
          ...currentEvent,
          ...variables.formData,
          theme_config: variables.themeConfig,
          settings: variables.settings,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['events'] });
      refreshEvents();
      toast({ title: 'Configurações salvas com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async () => {
      if (!currentEvent) throw new Error('No event selected');
      
      await eventsApi.deleteEvent(currentEvent.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setCurrentEvent(null);
      refreshEvents();
      toast({ title: 'Evento excluído com sucesso!' });
      navigate('/admin');
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateEvent.mutateAsync({ formData, themeConfig, settings });
  };

  const handleStatusChange = async (newStatus: EventStatus) => {
    setFormData({ ...formData, status: newStatus });
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Arquivo inválido', description: 'Selecione uma imagem', variant: 'destructive' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'Máximo 10MB', variant: 'destructive' });
      return;
    }

    const url = await uploadImage(file, 'hero');
    if (url) {
      setFormData({ ...formData, hero_image_url: url });
      toast({ title: 'Imagem enviada!' });
    }
  };

  const handleInviteImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Arquivo inválido', description: 'Selecione uma imagem', variant: 'destructive' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'Máximo 10MB', variant: 'destructive' });
      return;
    }

    const url = await uploadImage(file, 'invite');
    if (url) {
      setFormData({ ...formData, invite_image_url: url });
      toast({ title: 'Imagem do convite enviada!' });
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadPromises = Array.from(files).map(async (file) => {
      if (!file.type.startsWith('image/')) return null;
      if (file.size > 10 * 1024 * 1024) return null;
      return uploadImage(file, 'gallery');
    });

    const urls = await Promise.all(uploadPromises);
    const validUrls = urls.filter((url): url is string => url !== null);
    
    if (validUrls.length > 0) {
      setFormData({ 
        ...formData, 
        gallery_images: [...formData.gallery_images, ...validUrls] 
      });
      toast({ title: `${validUrls.length} imagem(s) adicionada(s)!` });
    }
  };

  const removeGalleryImage = (index: number) => {
    const newImages = formData.gallery_images.filter((_, i) => i !== index);
    setFormData({ ...formData, gallery_images: newImages });
  };

  if (isLoadingEvents) {
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

  const publicUrl = `${window.location.origin}/evento/${currentEvent.slug}`;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Banner de Trial Ativo */}
      {isTrialActive && (
        <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-primary">Teste gratuito ativo!</span>
            <span className="ml-2 text-muted-foreground">{trialDaysLeft === 1 ? 'Último dia!' : `Faltam ${trialDaysLeft} dias para expirar.`}</span>
          </div>
          <a href="/upgrade">
            <Button variant="default" className="bg-primary">Fazer upgrade</Button>
          </a>
        </div>
      )}
      <div>
        <h1 className="text-3xl font-serif">Configurações do Evento</h1>
        <p className="text-muted-foreground">Personalize completamente o site do seu evento</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Status & Visibility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Status e Visibilidade
            </CardTitle>
            <CardDescription>
              Controle se o evento está visível ao público
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status do Evento</Label>
              <Select
                value={formData.status}
                onValueChange={(value: EventStatus) => handleStatusChange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{statusLabels.draft}</SelectItem>
                  <SelectItem value="active">{statusLabels.active}</SelectItem>
                  <SelectItem value="archived">{statusLabels.archived}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {statusDescriptions[formData.status]}
              </p>
            </div>

            {formData.status === 'active' && (
              <div className="p-4 bg-sage/20 rounded-lg">
                <p className="text-sm font-medium mb-2">Link público do evento:</p>
                <div className="flex items-center gap-2">
                  <Input value={publicUrl} readOnly className="font-mono text-sm" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(publicUrl);
                      toast({ title: 'Link copiado!' });
                    }}
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_name">Nome do Evento</Label>
                <Input
                  id="event_name"
                  value={formData.event_name}
                  onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                  placeholder="Ex: João & Maria"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_type">Tipo de Evento</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(value: EventType) => setFormData({ ...formData, event_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(eventTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Data
                </Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_time" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Horário
                </Label>
                <Input
                  id="event_time"
                  type="time"
                  value={formData.event_time}
                  onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="venue_name" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Local do Evento
              </Label>
              <Input
                id="venue_name"
                value={formData.venue_name}
                onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                placeholder="Nome do local"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue_address">Endereço</Label>
              <Input
                id="venue_address"
                value={formData.venue_address}
                onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
                placeholder="Endereço completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue_maps_link">Link do Google Maps</Label>
              <Input
                id="venue_maps_link"
                value={formData.venue_maps_link}
                onChange={(e) => setFormData({ ...formData, venue_maps_link: e.target.value })}
                placeholder="https://maps.google.com/..."
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="welcome_message">Mensagem de Boas-vindas</Label>
              <Textarea
                id="welcome_message"
                value={formData.welcome_message}
                onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                placeholder="Uma mensagem especial para os convidados..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Theme & Appearance */}
        <FeatureGuard feature="personalizacao_visual">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Aparência e Tema
            </CardTitle>
            <CardDescription>
              Personalize as cores e fontes do site do evento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Color Palettes */}
            <div className="space-y-3">
              <Label>Paletas Sugeridas</Label>
              <p className="text-sm text-muted-foreground">
                Escolha uma paleta pronta ou personalize as cores individualmente
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {colorPalettes.map((palette) => (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => setThemeConfig({ ...themeConfig, ...palette.colors })}
                    className={`p-3 rounded-lg border-2 text-left transition-all hover:border-primary/50 ${
                      themeConfig.primaryColor === palette.colors.primaryColor &&
                      themeConfig.accentColor === palette.colors.accentColor
                        ? 'border-primary bg-primary/5'
                        : 'border-muted'
                    }`}
                  >
                    <div className="flex gap-1 mb-2">
                      <div 
                        className="w-5 h-5 rounded-full border" 
                        style={{ backgroundColor: palette.colors.primaryColor }}
                      />
                      <div 
                        className="w-5 h-5 rounded-full border" 
                        style={{ backgroundColor: palette.colors.accentColor }}
                      />
                      <div 
                        className="w-5 h-5 rounded-full border" 
                        style={{ backgroundColor: palette.colors.backgroundColor }}
                      />
                    </div>
                    <p className="text-sm font-medium">{palette.name}</p>
                    <p className="text-xs text-muted-foreground">{palette.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Individual Color Pickers */}
            <div className="space-y-4">
              <Label>Cores Personalizadas</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor" className="text-sm">Cor Primária</Label>
                  <p className="text-xs text-muted-foreground">Botões, links e elementos principais</p>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={themeConfig.primaryColor}
                      onChange={(e) => setThemeConfig({ ...themeConfig, primaryColor: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={themeConfig.primaryColor}
                      onChange={(e) => setThemeConfig({ ...themeConfig, primaryColor: e.target.value })}
                      className="flex-1"
                      placeholder="#2D5A5A"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accentColor" className="text-sm">Cor de Destaque</Label>
                  <p className="text-xs text-muted-foreground">Ícones, corações e destaques</p>
                  <div className="flex items-center gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={themeConfig.accentColor}
                      onChange={(e) => setThemeConfig({ ...themeConfig, accentColor: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={themeConfig.accentColor}
                      onChange={(e) => setThemeConfig({ ...themeConfig, accentColor: e.target.value })}
                      className="flex-1"
                      placeholder="#C17F59"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backgroundColor" className="text-sm">Cor de Fundo</Label>
                  <p className="text-xs text-muted-foreground">Fundo geral do site</p>
                  <div className="flex items-center gap-2">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={themeConfig.backgroundColor}
                      onChange={(e) => setThemeConfig({ ...themeConfig, backgroundColor: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={themeConfig.backgroundColor}
                      onChange={(e) => setThemeConfig({ ...themeConfig, backgroundColor: e.target.value })}
                      className="flex-1"
                      placeholder="#FAF8F5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textColor" className="text-sm">Cor do Texto</Label>
                  <p className="text-xs text-muted-foreground">Textos principais</p>
                  <div className="flex items-center gap-2">
                    <Input
                      id="textColor"
                      type="color"
                      value={themeConfig.textColor}
                      onChange={(e) => setThemeConfig({ ...themeConfig, textColor: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={themeConfig.textColor}
                      onChange={(e) => setThemeConfig({ ...themeConfig, textColor: e.target.value })}
                      className="flex-1"
                      placeholder="#1F3D3D"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardBackgroundColor" className="text-sm">Cor dos Cards</Label>
                  <p className="text-xs text-muted-foreground">Fundo dos cards e seções</p>
                  <div className="flex items-center gap-2">
                    <Input
                      id="cardBackgroundColor"
                      type="color"
                      value={themeConfig.cardBackgroundColor}
                      onChange={(e) => setThemeConfig({ ...themeConfig, cardBackgroundColor: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={themeConfig.cardBackgroundColor}
                      onChange={(e) => setThemeConfig({ ...themeConfig, cardBackgroundColor: e.target.value })}
                      className="flex-1"
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor" className="text-sm">Cor Secundária</Label>
                  <p className="text-xs text-muted-foreground">Fundos sutis e bordas</p>
                  <div className="flex items-center gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={themeConfig.secondaryColor}
                      onChange={(e) => setThemeConfig({ ...themeConfig, secondaryColor: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={themeConfig.secondaryColor}
                      onChange={(e) => setThemeConfig({ ...themeConfig, secondaryColor: e.target.value })}
                      className="flex-1"
                      placeholder="#8B7355"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Font Selection */}
            <div className="space-y-2">
              <Label htmlFor="fontFamily" className="flex items-center gap-2">
                <Type className="w-4 h-4" /> Fonte Principal
              </Label>
              <Select
                value={themeConfig.fontFamily}
                onValueChange={(value) => setThemeConfig({ ...themeConfig, fontFamily: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a fonte" />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroSubtitle">Subtítulo do Hero</Label>
              <Input
                id="heroSubtitle"
                value={themeConfig.heroSubtitle}
                onChange={(e) => setThemeConfig({ ...themeConfig, heroSubtitle: e.target.value })}
                placeholder="Ex: Celebração de Amor"
              />
              <p className="text-sm text-muted-foreground">
                Texto que aparece acima do nome do evento na página principal
              </p>
            </div>

            <Separator />

            {/* Live Preview */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Eye className="w-4 h-4" /> Preview ao Vivo
              </Label>
              <p className="text-sm text-muted-foreground">
                Visualize como as cores ficarão no site do evento
              </p>
              <ThemePreview 
                themeConfig={themeConfig}
                eventName={formData.event_name || 'Nome do Evento'}
              />
            </div>
          </CardContent>
        </Card>
        </FeatureGuard>

        {/* Customizable Texts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="w-5 h-5" />
              Textos Personalizáveis
            </CardTitle>
            <CardDescription>
              Customize os textos das seções do site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="giftsTitle">Título da Seção de Presentes</Label>
              <Input
                id="giftsTitle"
                value={themeConfig.giftsTitle}
                onChange={(e) => setThemeConfig({ ...themeConfig, giftsTitle: e.target.value })}
                placeholder="Lista de Presentes"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="giftsDescription">Descrição da Seção de Presentes</Label>
              <Textarea
                id="giftsDescription"
                value={themeConfig.giftsDescription}
                onChange={(e) => setThemeConfig({ ...themeConfig, giftsDescription: e.target.value })}
                placeholder="Sua presença é nosso maior presente!..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="giftsButtonText">Texto do Botão de Presentes</Label>
              <Input
                id="giftsButtonText"
                value={themeConfig.giftsButtonText}
                onChange={(e) => setThemeConfig({ ...themeConfig, giftsButtonText: e.target.value })}
                placeholder="Ver Lista de Presentes"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="biblicalQuote">Citação/Frase Especial</Label>
              <Textarea
                id="biblicalQuote"
                value={themeConfig.biblicalQuote}
                onChange={(e) => setThemeConfig({ ...themeConfig, biblicalQuote: e.target.value })}
                placeholder="O amor é paciente, o amor é bondoso..."
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Uma frase especial que aparece na seção de boas-vindas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="biblicalQuoteReference">Referência da Citação</Label>
              <Input
                id="biblicalQuoteReference"
                value={themeConfig.biblicalQuoteReference}
                onChange={(e) => setThemeConfig({ ...themeConfig, biblicalQuoteReference: e.target.value })}
                placeholder="1 Coríntios 13:4"
              />
            </div>
          </CardContent>
        </Card>

        {/* Visible Sections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Seções Visíveis
            </CardTitle>
            <CardDescription>
              Escolha quais seções aparecem no site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showCountdown">Contagem Regressiva</Label>
                <p className="text-sm text-muted-foreground">Mostra a contagem regressiva para o evento</p>
              </div>
              <Switch
                id="showCountdown"
                checked={settings.showCountdown}
                onCheckedChange={(checked) => setSettings({ ...settings, showCountdown: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showGallery">Galeria de Fotos</Label>
                <p className="text-sm text-muted-foreground">Mostra a galeria de fotos do casal</p>
              </div>
              <Switch
                id="showGallery"
                checked={settings.showGallery}
                onCheckedChange={(checked) => setSettings({ ...settings, showGallery: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showGifts">Lista de Presentes</Label>
                <p className="text-sm text-muted-foreground">Mostra a seção de lista de presentes</p>
              </div>
              <Switch
                id="showGifts"
                checked={settings.showGifts}
                onCheckedChange={(checked) => setSettings({ ...settings, showGifts: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showLocation">Localização</Label>
                <p className="text-sm text-muted-foreground">Mostra o card de localização do evento</p>
              </div>
              <Switch
                id="showLocation"
                checked={settings.showLocation}
                onCheckedChange={(checked) => setSettings({ ...settings, showLocation: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Hero Image */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Foto Principal (Hero)
            </CardTitle>
            <CardDescription>
              Imagem de destaque que aparece no topo do site
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={heroInputRef}
              type="file"
              accept="image/*"
              onChange={handleHeroUpload}
              className="hidden"
            />
            
            {formData.hero_image_url ? (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <img
                    src={formData.hero_image_url}
                    alt="Hero"
                    className="w-full max-w-md h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 w-8 h-8"
                    onClick={() => setFormData({ ...formData, hero_image_url: '' })}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => heroInputRef.current?.click()}
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
                onClick={() => heroInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                {isUploading ? (
                  <Loader2 className="w-10 h-10 mx-auto text-muted-foreground animate-spin" />
                ) : (
                  <Image className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                )}
                <p className="text-muted-foreground">
                  {isUploading ? 'Enviando...' : 'Clique para fazer upload da foto principal'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Recomendado: 1920x1080 (PNG, JPG)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invite Email Image */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Imagem do Convite por Email
            </CardTitle>
            <CardDescription>
              Imagem que aparece no topo do email de convite. Se não definida, usa a foto principal (hero).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={inviteImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleInviteImageUpload}
              className="hidden"
            />
            
            {formData.invite_image_url ? (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <img
                    src={formData.invite_image_url}
                    alt="Imagem do Convite"
                    className="w-full max-w-md h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 w-8 h-8"
                    onClick={() => setFormData({ ...formData, invite_image_url: '' })}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => inviteImageInputRef.current?.click()}
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
                onClick={() => inviteImageInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                {isUploading ? (
                  <Loader2 className="w-10 h-10 mx-auto text-muted-foreground animate-spin" />
                ) : (
                  <Image className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                )}
                <p className="text-muted-foreground">
                  {isUploading ? 'Enviando...' : 'Clique para fazer upload da imagem do convite'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Recomendado: 600x300 pixels (PNG, JPG)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gallery */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Galeria de Fotos
            </CardTitle>
            <CardDescription>
              Fotos que aparecem na página principal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryUpload}
              className="hidden"
            />

            {formData.gallery_images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                {formData.gallery_images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Galeria ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeGalleryImage(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Adicionar fotos
            </Button>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" disabled={updateEvent.isPending}>
          {updateEvent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Salvar Configurações
        </Button>
      </form>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Zona de Perigo
          </CardTitle>
          <CardDescription>
            Ações irreversíveis. Tenha cuidado!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">Desativar Visualização Pública</p>
              <p className="text-sm text-muted-foreground">O evento não será acessível pelo público</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setFormData({ ...formData, status: 'draft' });
                toast({ title: 'Status alterado para rascunho. Salve para aplicar.' });
              }}
              disabled={formData.status === 'draft'}
            >
              <EyeOff className="w-4 h-4 mr-2" />
              Desativar
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">Arquivar Evento</p>
              <p className="text-sm text-muted-foreground">Move o evento para arquivados</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setFormData({ ...formData, status: 'archived' });
                toast({ title: 'Status alterado para arquivado. Salve para aplicar.' });
              }}
              disabled={formData.status === 'archived'}
            >
              <Archive className="w-4 h-4 mr-2" />
              Arquivar
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg">
            <div>
              <p className="font-medium text-destructive">Excluir Evento Permanentemente</p>
              <p className="text-sm text-muted-foreground">
                Todos os dados serão perdidos: convidados, presentes, pagamentos...
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o evento
                    <strong> "{currentEvent.event_name}"</strong> e todos os dados associados
                    (convidados, presentes, pagamentos, etc.).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-4">
                  <Label htmlFor="confirmName">
                    Digite <strong>{currentEvent.event_name}</strong> para confirmar:
                  </Label>
                  <Input
                    id="confirmName"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder={currentEvent.event_name}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmName('')}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteEvent.mutate()}
                    disabled={deleteConfirmName !== currentEvent.event_name || deleteEvent.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteEvent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Excluir Permanentemente
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
