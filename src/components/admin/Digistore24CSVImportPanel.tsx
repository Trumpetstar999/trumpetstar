import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ParsedRow {
  order_id: string;
  product_id: string;
  email: string;
  first_name: string;
  last_name: string;
  country: string;
  first_payment_at: string;
  total_revenue: string;
  payment_status: string;
  next_payment_at: string;
  billing_type: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Detect delimiter (semicolon or comma)
  const delimiter = lines[0].includes(';') ? ';' : ',';

  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));

  const idx = (name: string) => headers.indexOf(name);

  return lines.slice(1).map((line) => {
    // Handle quoted fields
    const cols: string[] = [];
    let inQuote = false;
    let current = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === delimiter && !inQuote) {
        cols.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cols.push(current.trim());

    const get = (name: string) => cols[idx(name)] ?? '';

    return {
      order_id: get('Bestell-ID'),
      product_id: get('Prd-ID'),
      email: get('E-Mail'),
      first_name: get('Vorname'),
      last_name: get('Nachname'),
      country: get('Land'),
      first_payment_at: get('Erste Zahlung am'),
      total_revenue: get('Wiederkehrende Umsätze'),
      payment_status: get('Zahlungsstatus'),
      next_payment_at: get('Nächste Zahlung am'),
      billing_type: get('Abrechnungstyp'),
    };
  }).filter((r) => r.email);
}

export function Digistore24CSVImportPanel({ onImportDone }: { onImportDone?: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      if (parsed.length === 0) {
        toast.error('Keine gültigen Zeilen gefunden. Bitte prüfe das CSV-Format.');
      } else {
        toast.success(`${parsed.length} Zeilen eingelesen`);
      }
    };
    reader.readAsText(file, 'UTF-8');
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setImporting(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Nicht eingeloggt');
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/digistore24-csv-import`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rows }),
        }
      );

      const body = await res.json();

      if (!res.ok || !body.success) {
        toast.error(`Import fehlgeschlagen: ${body.error || 'Unbekannter Fehler'}`);
      } else {
        setResult(body);
        toast.success(`Import abgeschlossen: ${body.imported} Nutzer importiert`);
        onImportDone?.();
      }
    } catch (err: any) {
      toast.error(`Import-Fehler: ${err.message}`);
    } finally {
      setImporting(false);
    }
  }

  const activeRows = rows.filter((r) => r.payment_status?.trim() === 'Zahlungen aktiv');
  const inactiveRows = rows.filter((r) => r.payment_status?.trim() !== 'Zahlungen aktiv');

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div className="admin-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">CSV-Import (Digistore24)</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Exportiere Abonnenten aus Digistore24 (CSV) und lade die Datei hier hoch.
              Nur Nutzer mit „Zahlungen aktiv" werden als aktive Abos importiert.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <FileText className="w-4 h-4 mr-2" />
              CSV wählen
            </Button>
            <Button
              onClick={handleImport}
              disabled={rows.length === 0 || importing}
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {importing ? 'Importiere...' : `${activeRows.length} importieren`}
            </Button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
        />
        {fileName && (
          <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
            <FileText className="w-3 h-3" /> {fileName} — {rows.length} Zeilen erkannt
          </p>
        )}
      </div>

      {/* Import result */}
      {result && (
        <div className="admin-card p-5">
          <h4 className="font-medium text-foreground mb-3">Import-Ergebnis</h4>
          <div className="flex gap-4 flex-wrap mb-3">
            <div className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              {result.imported} importiert
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <XCircle className="w-4 h-4" />
              {result.skipped} übersprungen
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="space-y-1">
              {result.errors.map((e, i) => (
                <div key={i} className="text-xs text-destructive flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                  {e}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview table */}
      {rows.length > 0 && (
        <div className="admin-card overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h4 className="font-medium text-foreground">Vorschau</h4>
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {activeRows.length} aktiv
              </Badge>
              {inactiveRows.length > 0 && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                  {inactiveRows.length} inaktiv
                </Badge>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Land</TableHead>
                  <TableHead>Bestell-ID</TableHead>
                  <TableHead>Abrechnungstyp</TableHead>
                  <TableHead>Umsatz</TableHead>
                  <TableHead>Nächste Zahlung</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => {
                  const isActive = row.payment_status?.trim() === 'Zahlungen aktiv';
                  return (
                    <TableRow key={i} className={!isActive ? 'opacity-50' : ''}>
                      <TableCell>
                        {isActive ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                            Aktiv
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-xs">
                            Inaktiv
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {row.first_name} {row.last_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.email}</TableCell>
                      <TableCell className="text-sm">{row.country}</TableCell>
                      <TableCell className="text-xs font-mono">{row.order_id}</TableCell>
                      <TableCell className="text-xs">{row.billing_type}</TableCell>
                      <TableCell className="text-sm">{row.total_revenue}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.next_payment_at}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
