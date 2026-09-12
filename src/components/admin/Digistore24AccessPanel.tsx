import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  RefreshCw,
  Rocket,
} from 'lucide-react';

interface ProductOption {
  digistore_product_id: string;
  name: string;
  plan_key: string;
}

interface GrantResult {
  email: string;
  status: string;
  plan_key?: string;
  created_user?: boolean;
  email_sent?: boolean;
  message?: string;
}

const WEBHOOK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/digistore24-ipn`;

export function Digistore24AccessPanel() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [lastIpn, setLastIpn] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [productId, setProductId] = useState('');
  const [sendMail, setSendMail] = useState(true);
  const [granting, setGranting] = useState(false);
  const [grantResult, setGrantResult] = useState<GrantResult | null>(null);

  const [since, setSince] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [backfilling, setBackfilling] = useState(false);
  const [backfillSummary, setBackfillSummary] = useState<string | null>(null);

  async function loadStatus() {
    setLoadingStatus(true);
    const [{ data: prods }, { data: events }] = await Promise.all([
      supabase
        .from('digistore24_products')
        .select('digistore_product_id, name, plan_key')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('digistore24_ipn_events')
        .select('received_at')
        .order('received_at', { ascending: false })
        .limit(1),
    ]);
    setProducts(prods ?? []);
    setLastIpn(events?.[0]?.received_at ?? null);
    setLoadingStatus(false);
  }

  useEffect(() => {
    loadStatus();
  }, []);

  const daysSinceIpn = lastIpn
    ? Math.floor((Date.now() - new Date(lastIpn).getTime()) / 86400000)
    : null;
  const ipnHealthy = daysSinceIpn !== null && daysSinceIpn <= 14;

  async function callFunction(body: Record<string, unknown>) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Nicht eingeloggt');

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/digistore24-grant-access`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || json.result?.message || `Fehler ${res.status}`);
    return json;
  }

  async function handleGrant() {
    if (!email.trim() || !productId) {
      toast.error('E-Mail und Produkt sind erforderlich');
      return;
    }
    setGranting(true);
    setGrantResult(null);
    try {
      const json = await callFunction({
        action: 'grant',
        email: email.trim(),
        product_id: productId,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        send_email: sendMail,
      });
      setGrantResult(json.result);
      toast.success(
        json.result?.email_sent
          ? 'Zugang erstellt und Willkommensmail verschickt'
          : 'Zugang erstellt',
      );
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGranting(false);
    }
  }

  async function handleBackfill() {
    setBackfilling(true);
    setBackfillSummary(null);
    try {
      const json = await callFunction({ action: 'backfill', since, send_email: sendMail });
      setBackfillSummary(
        `${json.granted} freigeschaltet · ${json.skipped} übersprungen · ${json.errors} Fehler (von ${json.total} Bestellungen)`,
      );
      toast.success(`${json.granted} Zugänge nachgeholt`);
      loadStatus();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBackfilling(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="admin-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Kaufmeldungen (IPN)</h3>
            {loadingStatus ? (
              <p className="text-sm text-muted-foreground mt-1">Lade Status…</p>
            ) : lastIpn ? (
              <p className="text-sm mt-1 flex items-center gap-2">
                {ipnHealthy ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                )}
                <span className={ipnHealthy ? 'text-muted-foreground' : 'text-amber-700 font-medium'}>
                  Letzte Kaufmeldung: {new Date(lastIpn).toLocaleString('de-AT')} (
                  {daysSinceIpn} Tage her)
                </span>
              </p>
            ) : (
              <p className="text-sm mt-1 text-amber-700 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Es ist noch keine Kaufmeldung eingegangen.
              </p>
            )}
            {!loadingStatus && !ipnHealthy && (
              <p className="text-xs text-muted-foreground mt-2 max-w-xl">
                Prüfe in Digistore24 unter „Einstellungen → IPN / Zahlungsbenachrichtigung", ob bei
                jedem Produkt die untenstehende Adresse eingetragen ist.
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={loadStatus} disabled={loadingStatus}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loadingStatus ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <code className="text-xs bg-muted px-3 py-2 rounded font-mono break-all">
            {WEBHOOK_URL}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(WEBHOOK_URL);
              toast.success('Adresse kopiert');
            }}
          >
            <Copy className="w-4 h-4 mr-2" />
            Kopieren
          </Button>
        </div>
      </div>

      {/* Manual grant */}
      <div className="admin-card p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <KeyRound className="w-5 h-5" /> Zugang manuell freischalten
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Legt bei Bedarf ein Konto an, setzt den Zugang des Produkts und schickt die
            Willkommensmail mit Login-Link.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="grant-email">E-Mail *</Label>
            <Input
              id="grant-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kundin@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Produkt *</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Produkt wählen" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.digistore_product_id} value={p.digistore_product_id}>
                    {p.name} ({p.plan_key})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="grant-first">Vorname</Label>
            <Input
              id="grant-first"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grant-last">Nachname</Label>
            <Input id="grant-last" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="grant-mail"
            checked={sendMail}
            onCheckedChange={(v) => setSendMail(v === true)}
          />
          <Label htmlFor="grant-mail" className="font-normal cursor-pointer">
            Willkommensmail mit Login-Link senden
          </Label>
        </div>

        <Button onClick={handleGrant} disabled={granting}>
          {granting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <KeyRound className="w-4 h-4 mr-2" />
          )}
          Zugang freischalten
        </Button>

        {grantResult && (
          <div className="text-sm space-y-1 border-t pt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {grantResult.plan_key}
              </Badge>
              <span className="text-muted-foreground">{grantResult.email}</span>
              {grantResult.created_user && (
                <Badge variant="secondary">Konto neu angelegt</Badge>
              )}
              {grantResult.email_sent ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Mail verschickt
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                  Keine Mail
                </Badge>
              )}
            </div>
            {grantResult.message && (
              <p className="text-xs text-amber-700">{grantResult.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Backfill */}
      <div className="admin-card p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Rocket className="w-5 h-5" /> Käufe nachholen
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Holt die Bestellungen direkt von Digistore24 und legt fehlende Zugänge samt
            Willkommensmail an. Bereits freigeschaltete Kunden bekommen keine zweite Mail.
          </p>
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="space-y-2">
            <Label htmlFor="backfill-since">Käufe ab</Label>
            <Input
              id="backfill-since"
              type="date"
              value={since}
              onChange={(e) => setSince(e.target.value)}
              className="w-44"
            />
          </div>
          <Button onClick={handleBackfill} disabled={backfilling} variant="outline">
            {backfilling ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4 mr-2" />
            )}
            {backfilling ? 'Läuft…' : 'Nachholen starten'}
          </Button>
        </div>
        {backfillSummary && (
          <p className="text-sm text-muted-foreground border-t pt-3">{backfillSummary}</p>
        )}
      </div>
    </div>
  );
}
