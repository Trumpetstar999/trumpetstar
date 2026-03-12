import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users, Search, Plus, Pencil, Trash2, Download, Loader2,
  X, Building2, Mail, Phone, MapPin, ExternalLink,
} from 'lucide-react';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '@/hooks/useInvoices';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Customer } from '@/types/invoice';

// ─── Empty form state ──────────────────────────────────────────────────────────

const EMPTY: Omit<Customer, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  company_name: '',
  street: '',
  postal_code: '',
  city: '',
  country: 'AT',
  uid_number: '',
  email: '',
  phone: '',
  notes: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CustomersPanel() {
  const { data: customers = [], isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState(EMPTY);

  // Digistore24 import state
  const [importing, setImporting] = useState(false);
  const [importCount, setImportCount] = useState<number | null>(null);

  // Filter
  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.company_name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q)
    );
  });

  // ── Dialog helpers ───────────────────────────────────────────────────────────

  function openNew() {
    setEditCustomer(null);
    setForm(EMPTY);
    setDialogOpen(true);
  }

  function openEdit(c: Customer) {
    setEditCustomer(c);
    setForm({
      name: c.name,
      company_name: c.company_name || '',
      street: c.street,
      postal_code: c.postal_code,
      city: c.city,
      country: c.country,
      uid_number: c.uid_number || '',
      email: c.email || '',
      phone: c.phone || '',
      notes: c.notes || '',
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditCustomer(null);
    setForm(EMPTY);
  }

  async function handleSave() {
    const payload = {
      ...form,
      company_name: form.company_name || undefined,
      uid_number: form.uid_number || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      notes: form.notes || undefined,
    };

    if (editCustomer) {
      await updateCustomer.mutateAsync({ id: editCustomer.id, ...payload });
    } else {
      await createCustomer.mutateAsync(payload as Omit<Customer, 'id' | 'created_at' | 'updated_at'>);
    }
    closeDialog();
  }

  async function handleDelete(c: Customer) {
    if (!confirm(`Kunde „${c.name}" wirklich löschen?`)) return;
    deleteCustomer.mutate(c.id);
  }

  // ── Digistore24 Import ────────────────────────────────────────────────────────

  async function handleImportFromDigistore() {
    setImporting(true);
    setImportCount(null);
    try {
      const { data: ds24Customers, error } = await supabase
        .from('digistore24_customers')
        .select('email, first_name, last_name, company, country')
        .not('email', 'is', null);

      if (error) throw error;

      let imported = 0;
      for (const dc of ds24Customers || []) {
        const name = [dc.first_name, dc.last_name].filter(Boolean).join(' ') || dc.email;
        const country = dc.country === 'AT' ? 'AT' : 'DE';

        // Check if already exists by email
        const existing = customers.find(
          (c) => c.email?.toLowerCase() === dc.email.toLowerCase()
        );
        if (existing) continue;

        const { error: insErr } = await supabase.from('customers').insert({
          name,
          company_name: dc.company || undefined,
          street: '—',
          postal_code: '—',
          city: '—',
          country,
          email: dc.email,
        });
        if (!insErr) imported++;
      }

      setImportCount(imported);
      if (imported > 0) {
        toast.success(`${imported} Kunden importiert`);
        // Refresh customers list
        window.location.reload();
      } else {
        toast.info('Keine neuen Kunden zum Importieren gefunden');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setImporting(false);
    }
  }

  const isPending = createCustomer.isPending || updateCustomer.isPending;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, Firma, E-Mail oder Stadt…"
            className="pl-9"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-9 gap-1.5 border-border/60"
          onClick={handleImportFromDigistore}
          disabled={importing}
          title="Digistore24-Käufer als Kunden importieren"
        >
          {importing
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Download className="w-3.5 h-3.5" />}
          Von Digistore24
        </Button>
        <Button size="sm" className="h-9 gap-1.5" onClick={openNew}>
          <Plus className="w-3.5 h-3.5" />
          Neuer Kunde
        </Button>
      </div>

      {/* Import result hint */}
      {importCount !== null && importCount === 0 && (
        <p className="text-xs text-muted-foreground px-1">
          Alle Digistore24-Käufer sind bereits als Kunden vorhanden.
        </p>
      )}

      {/* Customers table */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-sm text-foreground">Kundenstamm</span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {customers.length}
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Lade Kunden…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">
              {search ? 'Keine Kunden gefunden' : 'Noch keine Kunden'}
            </p>
            {!search && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={handleImportFromDigistore} disabled={importing} className="gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Von Digistore24 importieren
                </Button>
                <Button size="sm" onClick={openNew} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Manuell anlegen
                </Button>
              </div>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kunde</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kontakt</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Adresse</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Land</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">UID</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{c.name}</p>
                    {c.company_name && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        {c.company_name}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 space-y-0.5">
                    {c.email && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[160px]">{c.email}</span>
                      </p>
                    )}
                    {c.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3 shrink-0" />
                        {c.phone}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {c.postal_code} {c.city}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.street}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${
                      c.country === 'AT'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      {c.country}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.uid_number ? (
                      <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                        {c.uid_number}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Bearbeiten"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                        title="Löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Customer Form Dialog ─────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent className="max-w-lg bg-white p-0 rounded-xl border border-border shadow-xl [&>button:last-child]:hidden">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-semibold text-foreground">
                {editCustomer ? 'Kunde bearbeiten' : 'Neuen Kunden anlegen'}
              </DialogTitle>
              <button onClick={closeDialog} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </DialogHeader>

          <div className="px-6 py-5 space-y-4">
            {/* Name + Firma */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">
                  Vor- und Nachname <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1.5 text-sm"
                  placeholder="Max Mustermann"
                  autoFocus
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Firma</Label>
                <Input
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className="mt-1.5 text-sm"
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Straße */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                Straße & Hausnummer <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                className="mt-1.5 text-sm"
                placeholder="Musterstraße 1"
              />
            </div>

            {/* PLZ + Stadt + Land */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">PLZ</Label>
                <Input
                  value={form.postal_code}
                  onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                  className="mt-1.5 text-sm"
                  placeholder="1010"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Stadt</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="mt-1.5 text-sm"
                  placeholder="Wien"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Land</Label>
                <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v as 'AT' | 'DE' })}>
                  <SelectTrigger className="mt-1.5 text-sm h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[200]">
                    <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
                    <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* E-Mail + Telefon */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">E-Mail</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1.5 text-sm"
                  placeholder="max@beispiel.at"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Telefon</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1.5 text-sm"
                  placeholder="+43 1 234 567"
                />
              </div>
            </div>

            {/* UID */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                UID-Nummer{' '}
                <span className="text-muted-foreground/60 font-normal">(für B2B Reverse Charge DE)</span>
              </Label>
              <Input
                value={form.uid_number}
                onChange={(e) => setForm({ ...form, uid_number: e.target.value })}
                className="mt-1.5 text-sm font-mono"
                placeholder="DE123456789 oder ATU12345678"
              />
            </div>

            {/* Notizen */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Notizen</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1.5 text-sm"
                placeholder="Interne Notiz (optional)"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1" onClick={closeDialog}>
                Abbrechen
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleSave}
                disabled={isPending || !form.name || !form.street || !form.city}
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                {editCustomer ? 'Speichern' : 'Anlegen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
