// Enum dos planos disponíveis
export enum PlanType {
  Essentia = 'essentia',
  Atelier = 'atelier',
  Signature = 'signature',
}

// Features possíveis do sistema
export type FeatureKey =
  | 'eventos_ilimitados'
  | 'area_cliente_personalizada'
  | 'checklist_avancado'
  | 'lista_convidados'
  | 'suporte_prioritario'
  | 'usuarios_extra'
  | 'relatorios_financeiros'
  | 'exportacao_dados'
  | 'personalizacao_visual'
  | 'onboarding'
  | 'consultoria'
  | 'customizacoes_avancadas'
  | 'dominio_personalizado';

// Permissões de cada plano
export const PLAN_FEATURES: Record<PlanType, FeatureKey[]> = {
  [PlanType.Essentia]: [
    'eventos_ilimitados',
    'area_cliente_personalizada',
    'checklist_avancado',
    'lista_convidados',
  ],
  [PlanType.Atelier]: [
    'eventos_ilimitados',
    'area_cliente_personalizada',
    'checklist_avancado',
    'lista_convidados',
    'usuarios_extra',
    'relatorios_financeiros',
    'exportacao_dados',
    'personalizacao_visual',
    'suporte_prioritario',
  ],
  [PlanType.Signature]: [
    'eventos_ilimitados',
    'area_cliente_personalizada',
    'checklist_avancado',
    'lista_convidados',
    'usuarios_extra',
    'relatorios_financeiros',
    'exportacao_dados',
    'personalizacao_visual',
    'suporte_prioritario',
    'onboarding',
    'consultoria',
    'customizacoes_avancadas',
    'dominio_personalizado',
  ],
};
export type InviteStatus = 'pending' | 'accepted' | 'declined';
export type GuestGroup = 'family' | 'friends' | 'work' | 'other';
export type EventType = 'wedding' | 'birthday' | 'graduation' | 'party' | 'corporate' | 'other';
export type EventStatus = 'draft' | 'active' | 'archived';
export type EventRole = 'owner' | 'admin' | 'collaborator' | 'viewer';
export type ExpenseStatus = 'pending' | 'partial' | 'paid';

export interface ExpenseCategory {
  id: string;
  event_id: string;
  name: string;
  color: string;
  icon: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  event_id: string;
  category_id: string | null;
  description: string;
  amount: number;
  paid_amount: number;
  status: ExpenseStatus;
  due_date: string | null;
  paid_at: string | null;
  vendor_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category?: ExpenseCategory;
}

export interface Event {
  id: string;
  slug: string;
  event_type: EventType;
  event_name: string;
  event_date: string | null;
  event_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  venue_maps_link: string | null;
  hero_image_url: string | null;
  welcome_message: string | null;
  gallery_images: string[];
  theme_config: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  settings: {
    showCountdown?: boolean;
    showGallery?: boolean;
    showGifts?: boolean;
    showLocation?: boolean;
  };
  status: EventStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  description: string | null;
  event_id: string;
  created_at: string;
}

export interface GuestCompanion {
  id: string;
  guest_id: string;
  name: string;
  will_attend: boolean | null;
  event_id: string;
  created_at: string;
}

export interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  guest_group: GuestGroup;
  table_id: string | null;
  token: string;
  status: InviteStatus;
  companions: number;
  has_viewed: boolean;
  viewed_at: string | null;
  responded_at: string | null;
  notes: string | null;
  event_id: string;
  invite_email_sent_at?: string | null;
  created_at: string;
  updated_at: string;
  table?: Table;
  companions_list?: GuestCompanion[];
}

export interface GuestWithTable extends Guest {
  table: Table | null;
}

export interface Gift {
  id: string;
  name: string;
  description: string | null;
  value: number;
  image_url: string | null;
  status: 'available' | 'reserved' | 'received';
  reserved_at: string | null;
  event_id: string;
  is_flexible_value: boolean;
  min_value: number | null;
  created_at: string;
  updated_at: string;
}

export interface GiftPayment {
  id: string;
  gift_id: string;
  guest_name: string | null;
  message: string | null;
  status: 'pending' | 'confirmed';
  event_id: string | null;
  created_at: string;
  confirmed_at: string | null;
  gift?: Gift;
}

export interface PixConfig {
  id: string;
  qr_code_url: string | null;
  pix_key: string | null;
  recipient_name: string | null;
  event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  total: number;
  totalGuests: number;
  totalCompanions: number;
  accepted: number;
  acceptedGuests: number;
  acceptedCompanions: number;
  declined: number;
  declinedGuests: number;
  declinedCompanions: number;
  pending: number;
  pendingGuests: number;
  pendingCompanions: number;
  viewed: number;
  viewedGuests: number;
  viewedCompanions: number;
}

export const guestGroupLabels: Record<GuestGroup, string> = {
  family: 'Família',
  friends: 'Amigos',
  work: 'Trabalho',
  other: 'Outros',
};

export const inviteStatusLabels: Record<InviteStatus, string> = {
  pending: 'Pendente',
  accepted: 'Confirmado',
  declined: 'Recusado',
};

export const inviteStatusColors: Record<InviteStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  accepted: 'bg-sage text-secondary-foreground',
  declined: 'bg-destructive/10 text-destructive',
};

export const eventTypeLabels: Record<EventType, string> = {
  wedding: 'Casamento',
  birthday: 'Aniversário',
  graduation: 'Formatura',
  party: 'Festa',
  corporate: 'Corporativo',
  other: 'Outro',
};

export const eventStatusLabels: Record<EventStatus, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  archived: 'Arquivado',
};
