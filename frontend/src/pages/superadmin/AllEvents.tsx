import { useState } from 'react';
import { useAllEvents } from '@/hooks/useUsersManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ExternalLink, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const eventTypeLabels: Record<string, string> = {
  wedding: 'Casamento',
  birthday: 'Aniversário',
  graduation: 'Formatura',
  party: 'Festa',
  corporate: 'Corporativo',
  other: 'Outro',
};

const statusLabels: Record<string, string> = {
  active: 'Ativo',
  draft: 'Rascunho',
  archived: 'Arquivado',
};

export default function AllEvents() {
  const { data: events, isLoading } = useAllEvents();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredEvents = events?.filter((event) => {
    const matchesSearch = event.event_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    const matchesType = typeFilter === 'all' || event.event_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Todos os Eventos</h2>
        <p className="text-muted-foreground">Visualize todos os eventos da plataforma</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eventos</CardTitle>
          <CardDescription>
            Total: {events?.length || 0} eventos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do evento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="wedding">Casamento</SelectItem>
                <SelectItem value="birthday">Aniversário</SelectItem>
                <SelectItem value="graduation">Formatura</SelectItem>
                <SelectItem value="party">Festa</SelectItem>
                <SelectItem value="corporate">Corporativo</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Responsáveis</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum evento encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEvents.map((event) => {
                      const owners = event.event_users?.filter((eu: any) => 
                        eu.role === 'owner' || eu.role === 'admin'
                      ).length || 0;
                      
                      return (
                        <TableRow key={event.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{event.event_name}</div>
                              <div className="text-sm text-muted-foreground">/{event.slug}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {eventTypeLabels[event.event_type] || event.event_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                event.status === 'active' ? 'default' : 
                                event.status === 'draft' ? 'secondary' : 'outline'
                              }
                            >
                              {statusLabels[event.status] || event.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {event.event_date ? (
                              format(new Date(event.event_date), 'dd/MM/yyyy', { locale: ptBR })
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Users className="h-4 w-4 mr-1" />
                              {owners}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to={`/evento/${event.slug}`} target="_blank">
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
