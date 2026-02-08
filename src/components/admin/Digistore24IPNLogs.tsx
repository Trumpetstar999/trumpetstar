import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, RefreshCw, Search, Eye, Send, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface IPNEvent {
  id: string;
  received_at: string;
  idempotency_key: string;
  event_type: string;
  order_id: string | null;
  subscription_id: string | null;
  product_id: string | null;
  email: string | null;
  raw_payload: unknown;
  normalized_payload: unknown;
  status: string;
  error_message: string | null;
  processed_at: string | null;
}

const statusColors: Record<string, string> = {
  received: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  processed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  error: 'bg-red-100 text-red-700',
};

const statusIcons: Record<string, React.ReactNode> = {
  received: <Clock className="w-3 h-3" />,
  processing: <Loader2 className="w-3 h-3 animate-spin" />,
  processed: <CheckCircle className="w-3 h-3" />,
  rejected: <XCircle className="w-3 h-3" />,
  error: <AlertCircle className="w-3 h-3" />,
};

const eventTypeColors: Record<string, string> = {
  PURCHASE: 'bg-emerald-100 text-emerald-700',
  RENEWAL: 'bg-blue-100 text-blue-700',
  CANCELLATION: 'bg-orange-100 text-orange-700',
  REFUND: 'bg-red-100 text-red-700',
  CHARGEBACK: 'bg-red-200 text-red-800',
  UNKNOWN: 'bg-slate-100 text-slate-600',
};

export function Digistore24IPNLogs() {
  const [events, setEvents] = useState<IPNEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<IPNEvent | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [statusFilter]);

  async function loadEvents() {
    setLoading(true);
    let query = supabase
      .from('digistore24_ipn_events')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(200);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter as 'received' | 'processing' | 'processed' | 'rejected' | 'error');
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Fehler beim Laden der Events');
      console.error(error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  }

  const filteredEvents = events.filter((event) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      event.email?.toLowerCase().includes(search) ||
      event.order_id?.toLowerCase().includes(search) ||
      event.product_id?.toLowerCase().includes(search) ||
      event.idempotency_key.toLowerCase().includes(search)
    );
  });

  async function sendTestEvent(eventType: string) {
    setSending(true);
    try {
      const testPayload = {
        event: eventType === 'PURCHASE' ? 'on_payment' :
               eventType === 'RENEWAL' ? 'on_rebill' :
               eventType === 'CANCELLATION' ? 'on_rebill_cancelled' :
               eventType === 'REFUND' ? 'on_refund' : 'on_chargeback',
        order_id: `TEST_${Date.now()}`,
        product_id: 'TEST_PRODUCT',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        amount: '29.99',
        currency: 'EUR',
        language: 'de',
        timestamp: Date.now().toString(),
      };

      const response = await supabase.functions.invoke('digistore24-ipn', {
        body: testPayload,
      });

      if (response.error) {
        throw response.error;
      }

      toast.success(`Test-Event "${eventType}" gesendet`);
      await loadEvents();
    } catch (error) {
      console.error(error);
      toast.error('Fehler beim Senden des Test-Events');
    }
    setSending(false);
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Suche nach E-Mail, Order ID..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="received">Empfangen</SelectItem>
              <SelectItem value="processing">Verarbeitung</SelectItem>
              <SelectItem value="processed">Verarbeitet</SelectItem>
              <SelectItem value="rejected">Abgelehnt</SelectItem>
              <SelectItem value="error">Fehler</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadEvents} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Test Events Panel */}
      <div className="admin-card">
        <div className="p-4 border-b border-slate-200">
          <h4 className="font-medium text-slate-900">Test-Events senden</h4>
          <p className="text-xs text-slate-500 mt-1">
            Sende Simulations-Events zum Testen der Integration
          </p>
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          {['PURCHASE', 'RENEWAL', 'CANCELLATION', 'REFUND', 'CHARGEBACK'].map((type) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => sendTestEvent(type)}
              disabled={sending}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {type}
            </Button>
          ))}
        </div>
      </div>

      {/* Events Table */}
      <div className="admin-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-16 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-medium text-slate-900 mb-2">Keine Events gefunden</h3>
            <p className="text-sm text-slate-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Versuche andere Suchkriterien'
                : 'Noch keine IPN-Events empfangen'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zeitpunkt</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Produkt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(new Date(event.received_at), 'dd.MM.yy HH:mm:ss', { locale: de })}
                    </TableCell>
                    <TableCell>
                      <Badge className={eventTypeColors[event.event_type] || eventTypeColors.UNKNOWN}>
                        {event.event_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {event.email || '-'}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                        {event.order_id || '-'}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm">
                      {event.product_id || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[event.status]} flex items-center gap-1 w-fit`}>
                        {statusIcons[event.status]}
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              IPN Event Details
              {selectedEvent && (
                <Badge className={eventTypeColors[selectedEvent.event_type]}>
                  {selectedEvent.event_type}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="flex-1 overflow-auto">
              <div className="space-y-4">
                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Empfangen:</span>
                    <p className="font-medium">
                      {format(new Date(selectedEvent.received_at), 'PPpp', { locale: de })}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Status:</span>
                    <Badge className={`${statusColors[selectedEvent.status]} mt-1`}>
                      {selectedEvent.status}
                    </Badge>
                  </div>
                  {selectedEvent.error_message && (
                    <div className="col-span-2">
                      <span className="text-slate-500">Fehler:</span>
                      <p className="font-medium text-red-600">{selectedEvent.error_message}</p>
                    </div>
                  )}
                </div>

                {/* Payloads */}
                <Tabs defaultValue="normalized" className="w-full">
                  <TabsList>
                    <TabsTrigger value="normalized">Normalized</TabsTrigger>
                    <TabsTrigger value="raw">Raw Payload</TabsTrigger>
                  </TabsList>
                  <TabsContent value="normalized" className="mt-4">
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-auto max-h-[300px]">
                      {JSON.stringify(selectedEvent.normalized_payload, null, 2)}
                    </pre>
                  </TabsContent>
                  <TabsContent value="raw" className="mt-4">
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-auto max-h-[300px]">
                      {JSON.stringify(selectedEvent.raw_payload, null, 2)}
                    </pre>
                  </TabsContent>
                </Tabs>

                {/* Idempotency Key */}
                <div className="text-sm">
                  <span className="text-slate-500">Idempotency Key:</span>
                  <code className="block mt-1 text-xs bg-slate-100 p-2 rounded break-all">
                    {selectedEvent.idempotency_key}
                  </code>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
