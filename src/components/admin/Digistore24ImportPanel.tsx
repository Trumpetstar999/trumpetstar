import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Download, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ImportLog {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  products_total: number;
  products_created: number;
  products_updated: number;
  error_message: string | null;
}

export function Digistore24ImportPanel({ onImportDone }: { onImportDone?: () => void }) {
  const [importing, setImporting] = useState(false);
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    const { data } = await supabase
      .from('digistore24_import_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);
    setLogs((data as ImportLog[]) || []);
    setLoading(false);
  }

  async function handleImport() {
    setImporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Nicht eingeloggt');
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/digistore24-import`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const body = await res.json();

      if (!res.ok || !body.success) {
        toast.error(`Import fehlgeschlagen: ${body.error || 'Unbekannter Fehler'}`);
      } else {
        toast.success(
          `Import erfolgreich: ${body.total} Produkte (${body.created} neu, ${body.updated} aktualisiert)`
        );
        onImportDone?.();
      }
    } catch (err: any) {
      toast.error(`Import-Fehler: ${err.message}`);
    } finally {
      setImporting(false);
      await loadLogs();
    }
  }

  const lastSuccess = logs.find((l) => l.status === 'success');

  return (
    <div className="space-y-6">
      {/* Import Action */}
      <div className="admin-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Produkte importieren</h3>
            <p className="text-sm text-slate-500">
              Produkte von Digistore24 abrufen und in die Datenbank übernehmen
            </p>
            {lastSuccess && (
              <p className="text-xs text-slate-400 mt-1">
                Letzter Import: {new Date(lastSuccess.finished_at!).toLocaleString('de-DE')} –{' '}
                {lastSuccess.products_total} Produkte
              </p>
            )}
          </div>
          <Button onClick={handleImport} disabled={importing}>
            {importing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {importing ? 'Importiere...' : 'Produkte importieren'}
          </Button>
        </div>
      </div>

      {/* Import Log */}
      <div className="admin-card overflow-hidden">
        <div className="p-4 border-b">
          <h4 className="font-medium text-slate-900">Import-Protokoll</h4>
        </div>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Noch keine Imports durchgeführt
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zeitpunkt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Gesamt</TableHead>
                <TableHead>Neu</TableHead>
                <TableHead>Aktualisiert</TableHead>
                <TableHead>Fehler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(log.started_at).toLocaleString('de-DE')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.status === 'success' && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Erfolg
                      </Badge>
                    )}
                    {log.status === 'error' && (
                      <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" /> Fehler
                      </Badge>
                    )}
                    {log.status === 'running' && (
                      <Badge variant="secondary">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Läuft
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{log.products_total}</TableCell>
                  <TableCell>{log.products_created}</TableCell>
                  <TableCell>{log.products_updated}</TableCell>
                  <TableCell className="text-xs text-red-600 max-w-[200px] truncate">
                    {log.error_message || '–'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
