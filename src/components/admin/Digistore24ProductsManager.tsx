import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Plus, Pencil, Trash2, Loader2, Package } from 'lucide-react';
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
}

interface ProductFormData {
  digistore_product_id: string;
  name: string;
  entitlement_key: string;
  access_policy: 'IMMEDIATE_REVOKE' | 'REVOKE_AT_PERIOD_END';
  plan_key: string;
  is_active: boolean;
}

const defaultFormData: ProductFormData = {
  digistore_product_id: '',
  name: '',
  entitlement_key: '',
  access_policy: 'REVOKE_AT_PERIOD_END',
  plan_key: 'BASIC',
  is_active: true,
};

export function Digistore24ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<{ key: string; display_name: string }[]>([]);

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
      setProducts(data || []);
    }
    setLoading(false);
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
      if (editingProduct) {
        const { error } = await supabase
          .from('digistore24_products')
          .update({
            digistore_product_id: formData.digistore_product_id,
            name: formData.name,
            entitlement_key: formData.entitlement_key,
            access_policy: formData.access_policy,
            plan_key: formData.plan_key,
            is_active: formData.is_active,
          })
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('Produkt aktualisiert');
      } else {
        const { error } = await supabase
          .from('digistore24_products')
          .insert({
            digistore_product_id: formData.digistore_product_id,
            name: formData.name,
            entitlement_key: formData.entitlement_key,
            access_policy: formData.access_policy,
            plan_key: formData.plan_key,
            is_active: formData.is_active,
          });

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
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Produkt-Mappings</h3>
          <p className="text-sm text-slate-500">
            Verknüpfe Digistore24-Produkte mit App-Berechtigungen
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Produkt hinzufügen
        </Button>
      </div>

      {/* Products Table */}
      <div className="admin-card overflow-hidden">
        {products.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-medium text-slate-900 mb-2">Keine Produkte konfiguriert</h3>
            <p className="text-sm text-slate-500 mb-4">
              Füge Digistore24-Produkte hinzu, um Käufe automatisch zu verarbeiten
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
                <TableHead>Produktname</TableHead>
                <TableHead>Digistore ID</TableHead>
                <TableHead>Entitlement Key</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Zugriffs-Policy</TableHead>
                <TableHead>Aktiv</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                      {product.digistore_product_id}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.entitlement_key}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.plan_key || 'FREE'}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs">
                      {product.access_policy === 'IMMEDIATE_REVOKE' 
                        ? 'Sofort entziehen' 
                        : 'Bis Periodenende'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={product.is_active}
                      onCheckedChange={() => toggleActive(product)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(product)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
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
              <p className="text-xs text-slate-500">
                Die Produkt-ID aus Digistore24
              </p>
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
              <p className="text-xs text-slate-500">
                Eindeutiger Schlüssel für diese Berechtigung
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan_key">App-Plan</Label>
              <select
                id="plan_key"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={formData.plan_key}
                onChange={(e) => setFormData({ ...formData, plan_key: e.target.value })}
              >
                {plans.map((plan) => (
                  <option key={plan.key} value={plan.key}>
                    {plan.display_name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                Welcher App-Plan bei Kauf aktiviert wird
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="access_policy">Zugriffs-Policy</Label>
              <select
                id="access_policy"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={formData.access_policy}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  access_policy: e.target.value as 'IMMEDIATE_REVOKE' | 'REVOKE_AT_PERIOD_END' 
                })}
              >
                <option value="REVOKE_AT_PERIOD_END">Bis Periodenende (empfohlen)</option>
                <option value="IMMEDIATE_REVOKE">Sofort entziehen</option>
              </select>
              <p className="text-xs text-slate-500">
                Wann bei Kündigung/Refund der Zugriff entzogen wird
              </p>
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
