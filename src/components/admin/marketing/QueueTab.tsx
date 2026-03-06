import { useState } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, RefreshCw, Clock, CheckCircle, XCircle, Play, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface QueueItem {
  id: string;
  lead_id: string | null;
  template_id: string | null;
  scheduled_for: string;
  status: string | null;
  created_at: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Ausstehend', color: 'text-amber-600 bg-amber-50', icon: Clock },
  processing: { label: 'Wird gesendet', color: 'text-blue-600 bg-blue-50', icon: Loader2 },
  sent: { label: 'Gesendet', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle },
  failed: { label: 'Fehler', color: 'text-red-600 bg-red-50', icon: XCircle },
  cancelled: { label: 'Abgebrochen', color: 'text-slate-500 bg-slate-100', icon: XCircle },
};

export function QueueTab() {
  const { data: queue, loading, refetch } = useRealtimeTable<QueueItem>('email_queue');
  const [processing, setProcessing] = useState(false);

  async function processQueue() {
    setProcessing(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/process-email-queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ batch_size: 50 }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.sent || 0} E-Mails gesendet, ${data.failed || 0} fehlgeschlagen`);
        refetch();
      } else {
        toast.error(data.error || 'Fehler beim Verarbeiten');
      }
    } catch (e) {
      toast.error('Fehler: ' + String(e));
    } finally {
      setProcessing(false);
    }
  }

  async function cancelItem(id: string) {
    const { error } = await supabase.from('email_queue').update({ status: 'cancelled' } as any).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Abgebrochen');
    refetch();
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from('email_queue').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Gelöscht');
    refetch();
  }

  const statusInfo = (s: string | null) => STATUS_CONFIG[s || 'pending'] || STATUS_CONFIG.pending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">Geplante E-Mails in der Warteschlange.</p>
        <div className="flex items-center gap-2">
          <button onClick={processQueue} disabled={processing} className="admin-btn-primary flex items-center gap-2">
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Queue verarbeiten
          </button>
          <button onClick={refetch} className="admin-btn flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Aktualisieren
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={key} className={`admin-card p-3 flex items-center gap-3 ${cfg.color}`}>
              <Icon className="w-5 h-5" />
              <div>
                <div className="text-lg font-bold">{queue.filter(q => (q.status || 'pending') === key).length}</div>
                <div className="text-xs">{cfg.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {loading ? <div className="text-slate-400 text-sm py-8 text-center">Lade...</div> : (
        <div className="admin-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Lead ID', 'Template', 'Geplant für', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queue.map(item => {
                const info = statusInfo(item.status);
                return (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.lead_id?.slice(0, 8) || '—'}...</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.template_id?.slice(0, 8) || '—'}...</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {format(new Date(item.scheduled_for), 'dd.MM.yy HH:mm')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${info.color}`}>
                        <info.icon className="w-3 h-3" />
                        {info.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {item.status === 'pending' && (
                          <button onClick={() => cancelItem(item.id)} className="text-xs text-amber-600 hover:text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-50">
                            Abbrechen
                          </button>
                        )}
                        <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {queue.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-sm">Warteschlange ist leer</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
