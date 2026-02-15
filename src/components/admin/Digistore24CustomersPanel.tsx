import { useState, useEffect, useCallback } from 'react';
import { Users, Euro, CreditCard, Receipt, RefreshCw, Search, Eye, CheckCircle, Wifi } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  country: string | null;
  phone: string | null;
  total_purchases: number;
  total_revenue: number;
  first_purchase_at: string | null;
  last_purchase_at: string | null;
}

interface Transaction {
  id: string;
  digistore_transaction_id: string;
  product_id: string | null;
  product_name: string | null;
  amount: number | null;
  currency: string;
  status: string | null;
  payment_method: string | null;
  pay_date: string | null;
  refund_date: string | null;
  raw_data: any;
}

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  records_imported: number;
  records_updated: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export function Digistore24CustomersPanel() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'last_purchase'>('name');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerTransactions, setCustomerTransactions] = useState<Transaction[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [stats, setStats] = useState({ customers: 0, revenue: 0, activeAbos: 0, transactions: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch customers
      const { data: custData } = await supabase
        .from('digistore24_customers')
        .select('*')
        .order('last_purchase_at', { ascending: false });
      setCustomers((custData as any[]) || []);

      // Fetch stats
      const { count: custCount } = await supabase
        .from('digistore24_customers')
        .select('*', { count: 'exact', head: true });

      const { data: revenueData } = await supabase
        .from('digistore24_transactions')
        .select('amount')
        .eq('status', 'completed');

      const totalRevenue = (revenueData || []).reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

      const { count: aboCount } = await supabase
        .from('digistore24_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: txCount } = await supabase
        .from('digistore24_transactions')
        .select('*', { count: 'exact', head: true });

      setStats({
        customers: custCount || 0,
        revenue: totalRevenue,
        activeAbos: aboCount || 0,
        transactions: txCount || 0,
      });

      // Fetch sync logs
      const { data: logData } = await supabase
        .from('digistore24_sync_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);
      setSyncLogs((logData as any[]) || []);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('digistore24-sync', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (res.error) throw new Error(res.error.message);

      const d = res.data;
      toast({
        title: '✅ Import abgeschlossen',
        description: `${d.customers?.imported || 0} Kunden importiert, ${d.customers?.updated || 0} aktualisiert. ${d.transactions?.imported || 0} Transaktionen importiert, ${d.transactions?.updated || 0} aktualisiert.`,
      });
      fetchData();
    } catch (e: any) {
      toast({ title: '❌ Import fehlgeschlagen', description: e.message, variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('digistore24-test-connection', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (res.error) throw new Error(res.error.message);

      if (res.data?.valid) {
        toast({ title: '✅ Verbindung erfolgreich', description: res.data.message });
      } else {
        toast({ title: '❌ Verbindung fehlgeschlagen', description: res.data?.message, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: '❌ Fehler', description: e.message, variant: 'destructive' });
    } finally {
      setTesting(false);
    }
  };

  const openCustomerDetail = async (customer: Customer) => {
    setSelectedCustomer(customer);
    const { data } = await supabase
      .from('digistore24_transactions')
      .select('*')
      .eq('customer_id', customer.id)
      .order('pay_date', { ascending: false });
    setCustomerTransactions((data as any[]) || []);
  };

  const filteredCustomers = customers
    .filter(c => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        (c.first_name || '').toLowerCase().includes(s) ||
        (c.last_name || '').toLowerCase().includes(s) ||
        c.email.toLowerCase().includes(s)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'revenue') return b.total_revenue - a.total_revenue;
      if (sortBy === 'last_purchase') return (b.last_purchase_at || '').localeCompare(a.last_purchase_at || '');
      return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
    });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);

  const formatDate = (d: string | null) => {
    if (!d) return '–';
    return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const statusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Unbekannt</Badge>;
    const s = status.toLowerCase();
    if (s === 'completed' || s === 'active') return <Badge className="bg-green-600 text-white">{status}</Badge>;
    if (s === 'refunded') return <Badge variant="destructive">{status}</Badge>;
    if (s === 'chargeback') return <Badge className="bg-orange-500 text-white">{status}</Badge>;
    if (s === 'cancelled') return <Badge variant="secondary">{status}</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100"><Users className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-sm text-muted-foreground">Gesamtkunden</p><p className="text-2xl font-bold">{stats.customers}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100"><Euro className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-sm text-muted-foreground">Gesamtumsatz</p><p className="text-2xl font-bold">{formatCurrency(stats.revenue)}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100"><CreditCard className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-sm text-muted-foreground">Aktive Abos</p><p className="text-2xl font-bold">{stats.activeAbos}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100"><Receipt className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-sm text-muted-foreground">Transaktionen</p><p className="text-2xl font-bold">{stats.transactions}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Import Controls */}
      <Card>
        <CardHeader><CardTitle>Daten importieren</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Import läuft...' : 'Alle Daten jetzt importieren'}
            </Button>
            <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
              <Wifi className={`w-4 h-4 ${testing ? 'animate-pulse' : ''}`} />
              {testing ? 'Teste...' : 'Verbindung testen'}
            </Button>
          </div>

          {syncLogs.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Letzte Import-Vorgänge</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Importiert</TableHead>
                    <TableHead>Aktualisiert</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">{formatDate(log.started_at)}</TableCell>
                      <TableCell><Badge variant="outline">{log.sync_type}</Badge></TableCell>
                      <TableCell>
                        {log.status === 'success' ? (
                          <Badge className="bg-green-600 text-white">Erfolg</Badge>
                        ) : log.status === 'error' ? (
                          <Badge variant="destructive">Fehler</Badge>
                        ) : (
                          <Badge variant="secondary">{log.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{log.records_imported}</TableCell>
                      <TableCell>{log.records_updated}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Kunden <Badge variant="secondary">{filteredCustomers.length}</Badge>
            </CardTitle>
            <div className="flex gap-2">
              <select
                className="text-sm border rounded-md px-2 py-1"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
              >
                <option value="name">Name</option>
                <option value="revenue">Umsatz</option>
                <option value="last_purchase">Letzter Kauf</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Nach Name oder E-Mail suchen..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead className="text-right">Käufe</TableHead>
                <TableHead className="text-right">Umsatz</TableHead>
                <TableHead>Letzter Kauf</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {search ? 'Keine Kunden gefunden' : 'Noch keine Kunden importiert. Klicke oben auf "Alle Daten jetzt importieren".'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{`${c.first_name || ''} ${c.last_name || ''}`.trim() || '–'}</TableCell>
                    <TableCell className="text-sm">{c.email}</TableCell>
                    <TableCell className="text-right">{c.total_purchases}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(c.total_revenue)}</TableCell>
                    <TableCell className="text-sm">{formatDate(c.last_purchase_at)}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => openCustomerDetail(c)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customer Detail Sheet */}
      <Sheet open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedCustomer && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                    {(selectedCustomer.first_name?.[0] || selectedCustomer.email[0]).toUpperCase()}
                    {(selectedCustomer.last_name?.[0] || '').toUpperCase()}
                  </div>
                  <div>
                    <SheetTitle>
                      {`${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim() || selectedCustomer.email}
                    </SheetTitle>
                    <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="text-sm"><span className="text-muted-foreground">Land:</span> {selectedCustomer.country || '–'}</div>
                <div className="text-sm"><span className="text-muted-foreground">Firma:</span> {selectedCustomer.company || '–'}</div>
                <div className="text-sm"><span className="text-muted-foreground">Käufe:</span> {selectedCustomer.total_purchases}</div>
                <div className="text-sm"><span className="text-muted-foreground">Umsatz:</span> <span className="font-bold">{formatCurrency(selectedCustomer.total_revenue)}</span></div>
              </div>

              <Tabs defaultValue="transactions" className="mt-6">
                <TabsList className="w-full">
                  <TabsTrigger value="transactions" className="flex-1">Transaktionen</TabsTrigger>
                  <TabsTrigger value="raw" className="flex-1">Rohdaten</TabsTrigger>
                </TabsList>

                <TabsContent value="transactions">
                  {customerTransactions.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4 text-center">Keine Transaktionen</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Datum</TableHead>
                          <TableHead>Produkt</TableHead>
                          <TableHead className="text-right">Betrag</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerTransactions.map(tx => (
                          <TableRow key={tx.id}>
                            <TableCell className="text-sm">{formatDate(tx.pay_date)}</TableCell>
                            <TableCell className="text-sm">{tx.product_name || tx.product_id || '–'}</TableCell>
                            <TableCell className="text-right text-sm">{tx.amount != null ? formatCurrency(tx.amount) : '–'}</TableCell>
                            <TableCell>{statusBadge(tx.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                <TabsContent value="raw">
                  {customerTransactions.length > 0 ? (
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-96">
                      {JSON.stringify(customerTransactions[0]?.raw_data, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-muted-foreground text-sm py-4 text-center">Keine Daten</p>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
