import { useEvent, Event } from '@/contexts/EventContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Calendar, Plus, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const eventTypeLabels: Record<string, string> = {
  wedding: 'Casamento',
  birthday: 'Aniversário',
  graduation: 'Formatura',
  party: 'Festa',
  corporate: 'Corporativo',
  other: 'Outro',
};

export function EventSwitcher() {
  const { currentEvent, userEvents, isLoadingEvents, setCurrentEvent } = useEvent();

  if (isLoadingEvents) {
    return (
      <Button variant="outline" disabled size="sm" className="w-full">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Carregando...
      </Button>
    );
  }

  if (userEvents.length === 0) {
    return (
      <Button asChild variant="outline" size="sm" className="w-full">
        <Link to="/admin/events/new">
          <Plus className="w-4 h-4 mr-2" />
          Criar Evento
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-between">
          <div className="flex items-center gap-2 truncate min-w-0">
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="truncate text-xs">{currentEvent?.event_name || 'Selecionar evento'}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 shrink-0 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px]">
        <DropdownMenuLabel>Meus Eventos</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userEvents.map((event) => (
          <DropdownMenuItem
            key={event.id}
            onClick={() => setCurrentEvent(event)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="font-medium">{event.event_name}</span>
              <span className="text-xs text-muted-foreground">
                {eventTypeLabels[event.event_type]} 
                {event.event_date && (
                  <> • {format(new Date(event.event_date), "dd 'de' MMM", { locale: ptBR })}</>
                )}
              </span>
            </div>
            {currentEvent?.id === event.id && (
              <Check className="w-4 h-4 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/admin/events/new" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Criar Novo Evento
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
