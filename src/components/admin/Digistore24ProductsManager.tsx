import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Loader2, Package, Search, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  digistore_product_id: string;
  name: string;
  entitlement_key: string;
  access_policy: 'IMMEDIATE_REVOKE' | 'REVOKE_AT_PERIOD_END';
  plan_key: string | null;
  is_active: boolean;
  created_at: string;
  checkout_url: string | null;
  imported_at: string | null;
}

interface ProductFormData {
  digistore_product_id: string;
  name: string;
  entitlement_key: string;
  access_policy: 'IMMEDIATE_REVOKE' | 'REVOKE_AT_PERIOD_END';
  plan_key: string;
  is_active: boolean;
  checkout_url: string;
}

const defaultFormData: ProductFormData = {
  digistore_product_id: '',
  name: '',
  entitlement_key: '',
  access_policy: 'REVOKE_AT_PERIOD_END',
  plan_key: 'BASIC',
  is_active: true,
  checkout_url: '',
};

const PLAN_OPTIONS = ['FREE', 'BASIC', 'PRO'];

type SortField = 'name' | 'plan_key';
type SortDir = 'asc' | 'desc';

export function Digistore24ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<{ key: string; display_name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPlan, setBulkPlan] = useState('FREE');

  useEffect(() => {
    loadProducts();
    loadPlans();
  }, []);

  async function loadPlans() {
    const { data } = await supabase
      .from('plans')
      .select('key, display_name')
      .order('rank');
    setPlans(data || []);
  }

  async function loadProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('digistore24_products')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Fehler beim Laden der Produkte');
      console.error(error);
    } else {
      setProducts((data as Product[]) || []);
    }
    setLoading(false);
  }

  // Filtering & sorting
  const filtered = products
    .filter((p) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.digistore_product_id.toLowerCase().includes(q) ||
        (p.plan_key || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const valA = (sortField === 'name' ? a.name : a.plan_key || '').toLowerCase();
      const valB = (sortField === 'name' ? b.name : b.plan_key || '').toLowerCase();
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  }

  async function handleBulkPlanAssign() {
    if (selectedIds.size === 0) return;
    const { error } = await supabase
      .from('digistore24_products')
      .update({ plan_key: bulkPlan })
      .in('id', Array.from(selectedIds));

    if (error) {
      toast.error('Fehler beim Zuweisen');
    } else {
      toast.success(`${selectedIds.size} Produkte auf ${bulkPlan} gesetzt`);
      setSelectedIds(new Set());
      await loadProducts();
    }
  }

  async function handleInlinePlanChange(productId: string, newPlan: string) {
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, plan_key: newPlan } : p))
    );

    const { error } = await supabase
      .from('digistore24_products')
      .update({ plan_key: newPlan })
      .eq('id', productId);

    if (error) {
      toast.error('Fehler beim Speichern');
      await loadProducts();
    } else {
      toast.success('Plan gespeichert');
    }
  }

  async function handleCheckoutUrlChange(productId: string, url: string) {
    const { error } = await supabase
      .from('digistore24_products')
      .update({ checkout_url: url })
      .eq('id', productId);

    if (error) {
      toast.error('Fehler beim Speichern');
    }
  }

  function openCreateDialog() {
    setEditingProduct(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  }

  function openEditDialog(product: Product) {
    setEditingProduct(product);
    setFormData({
      digistore_product_id: product.digistore_product_id,
      name: product.name,
      entitlement_key: product.entitlement_key,
      access_policy: product.access_policy,
      plan_key: product.plan_key || 'FREE',
      is_active: product.is_active,
      checkout_url: product.checkout_url || '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.digistore_product_id || !formData.name || !formData.entitlement_key) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        digistore_product_id: formData.digistore_product_id,
        name: formData.name,
        entitlement_key: formData.entitlement_key,
        access_policy: formData.access_policy,
        plan_key: formData.plan_key,
        is_active: formData.is_active,
        checkout_url: formData.checkout_url || null,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('digistore24_products')
          .update(payload)
          .eq('id', editingProduct.id);
        if (error) throw error;
        toast.success('Produkt aktualisiert');
      } else {
        const { error } = await supabase
          .from('digistore24_products')
          .insert(payload);
        if (error) throw error;
        toast.success('Produkt erstellt');
      }

      setDialogOpen(false);
      await loadProducts();
    } catch (error: any) {
      console.error(error);
      if (error.code === '23505') {
        toast.error('Digistore Product ID existiert bereits');
      } else {
        toast.error('Fehler beim Speichern');
      }
    }
    setSaving(false);
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Produkt "${product.name}" wirklich löschen?`)) return;

    const { error } = await supabase
      .from('digistore24_products')
      .delete()
      .eq('id', product.id);

    if (error) {
      toast.error('Fehler beim Löschen');
      console.error(error);
    } else {
      toast.success('Produkt gelöscht');
      await loadProducts();
    }
  }

  async function toggleActive(product: Product) {
    const { error } = await supabase
      .from('digistore24_products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id);

    if (error) {
      toast.error('Fehler beim Aktualisieren');
    } else {
      await loadProducts();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Produkt-Mappings</h3>
          <p className="text-sm text-muted-foreground">
            Verknüpfe Digistore24-Produkte mit App-Berechtigungen
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Produkt hinzufügen
        </Button>
      </div>

      {/* Search & Bulk */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Suche nach Name, ID oder Plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selectedIds.size} ausgewählt</span>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={bulkPlan}
              onChange={(e) => setBulkPlan(e.target.value)}
            >
              {PLAN_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <Button size="sm" onClick={handleBulkPlanAssign}>
              Plan zuweisen
            </Button>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="admin-card overflow-hidden">
        {filtered.length === 0 && !searchQuery ? (
          <div className="p-16 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-2">Keine Produkte konfiguriert</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Importiere Produkte über den Import-Tab oder füge sie manuell hinzu
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Erstes Produkt hinzufügen
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => toggleSort('name')}>
                    Produktname <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>Digistore ID</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => toggleSort('plan_key')}>
                    Plan <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>Checkout-Link</TableHead>
                <TableHead>Aktiv</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(product.id)}
                      onCheckedChange={() => toggleSelect(product.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {product.digistore_product_id}
                    </code>
                  </TableCell>
                  <TableCell>
                    <select
                      className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                      value={product.plan_key || 'FREE'}
                      onChange={(e) => handleInlinePlanChange(product.id, e.target.value)}
                    >
                      {PLAN_OPTIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8 text-xs w-40"
                      placeholder="https://..."
                      defaultValue={product.checkout_url || ''}
                      onBlur={(e) => handleCheckoutUrlChange(product.id, e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={product.is_active}
                      onCheckedChange={() => toggleActive(product)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEditDialog(product)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(product)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Produkt bearbeiten' : 'Neues Produkt hinzufügen'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="digistore_product_id">Digistore24 Product ID *</Label>
              <Input
                id="digistore_product_id"
                value={formData.digistore_product_id}
                onChange={(e) => setFormData({ ...formData, digistore_product_id: e.target.value })}
                placeholder="z.B. 123456"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Produktname *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Premium Mitgliedschaft"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entitlement_key">Entitlement Key *</Label>
              <Input
                id="entitlement_key"
                value={formData.entitlement_key}
                onChange={(e) => setFormData({ ...formData, entitlement_key: e.target.value })}
                placeholder="z.B. premium, course_basic"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan_key">App-Plan</Label>
              <select
                id="plan_key"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.plan_key}
                onChange={(e) => setFormData({ ...formData, plan_key: e.target.value })}
              >
                {plans.map((plan) => (
                  <option key={plan.key} value={plan.key}>
                    {plan.display_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkout_url">Checkout-Link</Label>
              <Input
                id="checkout_url"
                value={formData.checkout_url}
                onChange={(e) => setFormData({ ...formData, checkout_url: e.target.value })}
                placeholder="https://www.digistore24.com/..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="access_policy">Zugriffs-Policy</Label>
              <select
                id="access_policy"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.access_policy}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    access_policy: e.target.value as 'IMMEDIATE_REVOKE' | 'REVOKE_AT_PERIOD_END',
                  })
                }
              >
                <option value="REVOKE_AT_PERIOD_END">Bis Periodenende (empfohlen)</option>
                <option value="IMMEDIATE_REVOKE">Sofort entziehen</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Produkt aktiv</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingProduct ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
