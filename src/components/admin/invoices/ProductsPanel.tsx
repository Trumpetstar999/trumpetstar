import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAllProducts, useDeleteProduct, useUpdateProduct } from '@/hooks/useInvoices';
import { ProductFormDialog } from './ProductFormDialog';
import { formatCurrency } from '@/lib/vat';
import type { Product } from '@/types/invoice';

export function ProductsPanel() {
  const { data: products = [], isLoading } = useAllProducts();
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setDialogOpen(true);
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Produkt "${p.name}" wirklich löschen?`)) return;
    await deleteProduct.mutateAsync(p.id);
  }

  async function toggleActive(p: Product) {
    await updateProduct.mutateAsync({ id: p.id, is_active: !p.is_active });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Produkte</h3>
        <Button onClick={openNew} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Neues Produkt
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-3 py-2 font-medium">SKU</th>
              <th className="text-left px-3 py-2 font-medium">Name</th>
              <th className="text-right px-3 py-2 font-medium">Händlerpreis</th>
              <th className="text-right px-3 py-2 font-medium">UVP</th>
              <th className="text-center px-3 py-2 font-medium">USt AT/DE</th>
              <th className="text-center px-3 py-2 font-medium">Aktiv</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">Lade…</td></tr>
            )}
            {!isLoading && products.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">Keine Produkte vorhanden</td></tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-xs text-gray-600">{p.sku}</td>
                <td className="px-3 py-2 text-gray-900">{p.name}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(Number(p.dealer_price_gross))}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(Number(p.price_gross))}</td>
                <td className="px-3 py-2 text-center text-xs text-gray-500">{p.vat_rate_at}% / {p.vat_rate_de}%</td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => toggleActive(p)}
                    className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {p.is_active ? 'Aktiv' : 'Inaktiv'}
                  </button>
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-800 p-1" title="Bearbeiten">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(p)} className="text-red-500 hover:text-red-700 p-1" title="Löschen">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProductFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        product={editing}
      />
    </div>
  );
}
