import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Truck, Package, CheckCircle2, Clock, MapPin, Mail,
  Plus, RefreshCw, Trash2, Search, X, Edit2, Save
} from 'lucide-react';

interface Shipment {
  id: string;
  transaction_id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  product_name: string;
  product_id: string | null;
  quantity: number;
  address_street: string | null;
  address_city: string | null;
  address_zip: string | null;
  address_country: string | null;
  address_full: string | null;
  status: 'pending' | 'shipped' | 'cancelled';
  shipped_at: string | null;
  shipped_by: string | null;
  tracking_code: string | null;
  notes: string | null;
  created_at: string;
}

const EMPTY_FORM = {
  transaction_id: '',
  order_id: '',
  customer_name: '',
  customer_email: '',
  product_name: '',
  quantity: 1,
  address_street: '',
  address_city: '',
  address_zip: '',
  address_country: 'AT',
  notes: '',
};

export function ShippingPanel() {
  const [pending, setPending] = useState<Shipment[]>([]);
  const [shipped, setShipped] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [editTracking, setEditTracking] = useState<{ id: string; value: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('digistore24_shipments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Fehler beim Laden: ' + error.message);
    } else {
      const all = (data || []) as Shipment[];
      setPending(all.filter(s => s.status === 'pending'));
      setShipped(all.filter(s => s.status === 'shipped'));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markShipped = async (id: string) => {
    setMarkingId(id);
    const { error } = await (supabase as any)
      .from('digistore24_shipments')
      .update({
        status: 'shipped',
        shipped_at: new Date().toISOString(),
        shipped_by: 'Admin',
      })
      .eq('id', id);

    if (error) {
      toast.error('Fehler: ' + error.message);
    } else {
      toast.success('✅ Als versendet markiert!');
      await load();
    }
    setMarkingId(null);
  };

  const saveTracking = async (id: string, code: string) => {
    const { error } = await (supabase as any)
      .from('digistore24_shipments')
      .update({ tracking_code: code })
      .eq('id', id);
    if (error) toast.error('Fehler: ' + error.message);
    else {
      toast.success('Tracking-Code gespeichert');
      setEditTracking(null);
      await load();
    }
  };

  const addShipment = async () => {
    if (!form.customer_name || !form.product_name) {
      toast.error('Name und Produkt sind Pflichtfelder');
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any)
      .from('digistore24_shipments')
      .insert({
        ...form,
        transaction_id: form.transaction_id || `manual-${Date.now()}`,
        order_id: form.order_id || `manual-${Date.now()}`,
        status: 'pending',
      });
    if (error) {
      toast.error('Fehler: ' + error.message);
    } else {
      toast.success('✅ Bestellung hinzugefügt!');
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    }
    setSaving(false);
  };

  const deleteShipment = async (id: string) => {
    if (!confirm('Bestellung wirklich löschen?')) return;
    const { error } = await (supabase as any)
      .from('digistore24_shipments')
      .delete()
      .eq('id', id);
    if (error) toast.error('Fehler: ' + error.message);
    else {
      toast.success('Gelöscht');
      await load();
    }
  };

  const filterFn = (s: Shipment) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.customer_name.toLowerCase().includes(q) ||
      s.customer_email.toLowerCase().includes(q) ||
      s.product_name.toLowerCase().includes(q) ||
      (s.order_id || '').toLowerCase().includes(q) ||
      (s.address_city || '').toLowerCase().includes(q)
    );
  };

  const filteredPending = pending.filter(filterFn);
  const filteredShipped = shipped.filter(filterFn);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm gap-2">
        <RefreshCw className="w-4 h-4 animate-spin" /> Lade Versandbestellungen…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Suche nach Name, Produkt, Ort…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="admin-btn flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Aktualisieren
          </button>
          <button onClick={() => setShowForm(!showForm)} className="admin-btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Bestellung hinzufügen
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="admin-card p-5 space-y-4 border-2 border-blue-200">
          <h3 className="text-sm font-semibold text-slate-700">Neue Bestellung manuell erfassen</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Kundenname *</label>
              <input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">E-Mail</label>
              <input value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Produkt *</label>
              <input value={form.product_name} onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Anzahl</label>
              <input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Straße & Nr.</label>
              <input value={form.address_street} onChange={e => setForm(f => ({ ...f, address_street: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">PLZ</label>
              <input value={form.address_zip} onChange={e => setForm(f => ({ ...f, address_zip: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Stadt</label>
              <input value={form.address_city} onChange={e => setForm(f => ({ ...f, address_city: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Land</label>
              <input value={form.address_country} onChange={e => setForm(f => ({ ...f, address_country: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Digistore24 Bestell-ID</label>
              <input value={form.order_id} onChange={e => setForm(f => ({ ...f, order_id: e.target.value }))} placeholder="Optional – wird automatisch vergeben"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Notizen</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} className="admin-btn text-sm">Abbrechen</button>
            <button onClick={addShipment} disabled={saving} className="admin-btn-primary flex items-center gap-2 text-sm">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Speichern
            </button>
          </div>
        </div>
      )}

      {/* Pending shipments */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-slate-700">Offen – noch nicht versendet</h2>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{filteredPending.length}</span>
        </div>

        {filteredPending.length === 0 ? (
          <div className="admin-card p-8 text-center text-slate-400 text-sm">
            {search ? 'Keine Ergebnisse für deine Suche.' : '🎉 Keine offenen Versandbestellungen!'}
          </div>
        ) : (
          <div className="overflow-x-auto admin-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Kunde</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Produkt</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Menge</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Adresse</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Bestellt</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Notiz</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPending.map(s => (
                  <tr key={s.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{s.customer_name}</p>
                      {s.customer_email && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />{s.customer_email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Package className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        {s.product_name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs">
                        {s.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(s.address_street || s.address_city || s.address_full) ? (
                        <div className="flex items-start gap-1.5 text-slate-600 text-xs">
                          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-400" />
                          <div>
                            {s.address_full ? (
                              <p className="whitespace-pre-line">{s.address_full}</p>
                            ) : (
                              <>
                                {s.address_street && <p>{s.address_street}</p>}
                                <p>{[s.address_zip, s.address_city, s.address_country].filter(Boolean).join(' ')}</p>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">–</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString('de-AT')}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px]">
                      {s.notes || <span className="text-slate-300">–</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => markShipped(s.id)}
                          disabled={markingId === s.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-all"
                        >
                          {markingId === s.id
                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            : <Truck className="w-3.5 h-3.5" />}
                          Versendet
                        </button>
                        <button onClick={() => deleteShipment(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Shipped */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <h2 className="text-sm font-semibold text-slate-700">Versendet</h2>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{filteredShipped.length}</span>
        </div>

        {filteredShipped.length === 0 ? (
          <div className="admin-card p-6 text-center text-slate-400 text-sm">
            Noch keine versendeten Bestellungen.
          </div>
        ) : (
          <div className="overflow-x-auto admin-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Kunde</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Produkt</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Menge</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Adresse</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Versendet am</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tracking</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredShipped.map(s => (
                  <tr key={s.id} className="hover:bg-green-50/30 transition-colors opacity-80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700">{s.customer_name}</p>
                      {s.customer_email && (
                        <p className="text-xs text-slate-400">{s.customer_email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                        {s.product_name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-semibold text-xs">
                        {s.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {s.address_full ? (
                        <p className="whitespace-pre-line">{s.address_full}</p>
                      ) : (
                        [s.address_street, [s.address_zip, s.address_city, s.address_country].filter(Boolean).join(' ')]
                          .filter(Boolean).join(', ') || <span className="text-slate-300">–</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-green-600 font-medium whitespace-nowrap">
                      {s.shipped_at ? new Date(s.shipped_at).toLocaleDateString('de-AT') : '–'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {editTracking?.id === s.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            value={editTracking.value}
                            onChange={e => setEditTracking({ id: s.id, value: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && saveTracking(s.id, editTracking.value)}
                            className="w-28 px-2 py-1 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                            autoFocus
                            placeholder="Tracking-Nr."
                          />
                          <button onClick={() => saveTracking(s.id, editTracking.value)} className="text-green-600 hover:text-green-700">
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditTracking(null)} className="text-slate-400">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditTracking({ id: s.id, value: s.tracking_code || '' })}
                          className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors group"
                        >
                          {s.tracking_code
                            ? <span className="font-mono">{s.tracking_code}</span>
                            : <span className="text-slate-300 group-hover:text-blue-400">+ Tracking</span>}
                          <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteShipment(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
