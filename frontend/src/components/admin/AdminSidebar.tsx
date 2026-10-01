import { Link } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import { useEvent } from '@/contexts/EventContext';
import { EventSwitcher } from '@/components/admin/EventSwitcher';
import { EventumLogo } from '@/components/common/EventumLogo';
import {
  Users, LayoutGrid, LogOut, Grid3X3, Gift,
  CreditCard, QrCode, UserCheck, Wallet, Building2, Settings, ExternalLink, User as UserIcon
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const managementItems = [
  { to: '/admin', icon: LayoutGrid, label: 'Dashboard', exact: true },
  { to: '/admin/guests', icon: Users, label: 'Convidados' },
  { to: '/admin/reconfirmation', icon: UserCheck, label: '2ª Confirmação' },
  { to: '/admin/tables', icon: Grid3X3, label: 'Mesas' },
  { to: '/admin/suppliers', icon: Building2, label: 'Fornecedores' },
];

const financeItems = [
  { to: '/admin/gifts', icon: Gift, label: 'Presentes' },
  { to: '/admin/finances', icon: Wallet, label: 'Finanças' },
  { to: '/admin/payments', icon: CreditCard, label: 'Pagamentos' },
  { to: '/admin/pix', icon: QrCode, label: 'PIX' },
  { to: '/admin/mercadopago', icon: CreditCard, label: 'Mercado Pago' },
];

const configItems = [
  { to: '/admin/settings', icon: Settings, label: 'Configurações' },
];

export function AdminSidebar() {
  const { user, signOut } = useAuth();
  const { currentEvent } = useEvent();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const userInitial = user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || '?';
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-3 py-3">
        <Link to="/admin" className="flex items-center gap-2 overflow-hidden">
          <EventumLogo size="sm" showText={!collapsed} />
        </Link>
        {!collapsed && (
          <div className="mt-2">
            <EventSwitcher />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Gestão do Evento */}
        <SidebarGroup>
          <SidebarGroupLabel>Gestão do Evento</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <NavLink to={item.to} end={item.exact} className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-medium">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Financeiro */}
        <SidebarGroup>
          <SidebarGroupLabel>Financeiro</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financeItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <NavLink to={item.to} className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-medium">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Configurações */}
        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <NavLink to={item.to} className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-medium">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3 space-y-2">
        {currentEvent && !collapsed && (
          <Link
            to={`/evento/${currentEvent.slug}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-2"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver Site do Evento
          </Link>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-xs">{userInitial}</AvatarFallback>
              </Avatar>
              {!collapsed && <span className="truncate text-sm">{user?.user_metadata?.full_name || user?.email}</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.user_metadata?.full_name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Meu Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </SidebarFooter>
    </Sidebar>
  );
}
