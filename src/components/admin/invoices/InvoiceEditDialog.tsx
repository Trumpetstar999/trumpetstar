import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2, X, Save } from 'lucide-react';
import { useInvoice, useInvoiceProducts } from '@/hooks/useInvoices';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { getVatRate, formatCurrency } from '@/lib/vat';
import { calculateLineTotal, calculateInvoiceTotals } from '@/lib/invoice-calc';
import type { InvoiceItem } from '@/types/invoice';

interface Props {
  invoiceId: string | null;
  onClose: () => void;
}

interface FormValues {
  invoice_date: string;
  due_date: string;
  country: 'AT' | 'DE';
  notes: string;
  paid_amount: number;
  items: {
    id?: string;
    product_id: string;
    description: string;
    quantity: number;
    unit: string;
    unit_price_gross: number;
    discount_percent: number;
  }[];
}

export function InvoiceEditDialog({ invoiceId, onClose }: Props) {
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const { data: products = [] } = useInvoiceProducts();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, watch, setValue, control, reset } = useForm<FormValues>({
    defaultValues: {
      invoice_date: '',
      due_date: '',
      country: 'AT',
      notes: '',
      paid_amount: 0,
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchCountry = watch('country');
  const watchItems = watch('items');

  // Prefill form when invoice loads
  useEffect(() => {
    if (!invoice) return;
    reset({
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      country: invoice.country as 'AT' | 'DE',
      notes: invoice.notes || '',
      paid_amount: invoice.paid_amount,
      items: (invoice.items || []).map((item) => ({
        id: item.id,
        product_id: item.product_id || '',
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price_gross: item.unit_price_gross,
        discount_percent: item.discount_percent,
      })),
    });
  }, [invoice, reset]);

  const hasUid = !!invoice?.customer?.uid_number;
  const vatRate = getVatRate(watchCountry, hasUid);

  const computedItems: InvoiceItem[] = watchItems.map((item, i) => ({
    ...item,
    sort_order: i,
    line_total_gross: calculateLineTotal(
      Number(item.quantity) || 0,
      Number(item.unit_price_gross) || 0,
      Number(item.discount_percent) || 0
    ),
  }));

  const totals = calculateInvoiceTotals(computedItems, vatRate);

  function handleProductSelect(index: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setValue(`items.${index}.product_id`, productId);
    setValue(`items.${index}.description`, product.name);
    setValue(`items.${index}.unit_price_gross`, product.price_gross);
  }

  async function onSubmit(values: FormValues) {
    if (!invoiceId || !invoice) return;
    setSaving(true);
    try {
      // 1. Update invoice record
      const { error: invError } = await supabase
        .from('invoices')
        .update({
          invoice_date: values.invoice_date,
          due_date: values.due_date,
          country: values.country,
          vat_rate: vatRate,
          subtotal_net: totals.subtotalNet,
          vat_amount: totals.vatAmount,
          total_gross: totals.totalGross,
          paid_amount: Number(values.paid_amount),
          notes: values.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);
      if (invError) throw invError;

      // 2. Delete old items and re-insert
      const { error: delError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);
      if (delError) throw delError;

      if (computedItems.length > 0) {
        const { error: itemsError } = await supabase.from('invoice_items').insert(
          computedItems.map((item, i) => ({
            invoice_id: invoiceId,
            product_id: item.product_id || null,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price_gross: item.unit_price_gross,
            discount_percent: item.discount_percent,
            line_total_gross: item.line_total_gross,
            sort_order: i,
            notes: item.notes || null,
          }))
        );
        if (itemsError) throw itemsError;
      }

      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Rechnung gespeichert');
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  }

  if (!invoiceId) return null;

  return (
    <Dialog open={!!invoiceId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto bg-white border border-gray-200 shadow-xl p-0 rounded-xl [&>button:last-child]:hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 z-10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Rechnung bearbeiten — {invoice?.invoice_number}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : invoice ? (
          <form onSubmit={handleSubmit(onSubmit)} className="invoice-form px-6 py-5 space-y-6">

            {/* Rechnungsdaten */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Rechnungsdaten</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div>
                  <Label className="text-xs font-medium text-gray-600">Rechnungsdatum</Label>
                  <Input
                    {...register('invoice_date', { required: true })}
                    type="date"
                    className="mt-1 h-9 border-gray-200 bg-white text-gray-900 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Fälligkeitsdatum</Label>
                  <Input
                    {...register('due_date', { required: true })}
                    type="date"
                    className="mt-1 h-9 border-gray-200 bg-white text-gray-900 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Land (USt-Regelung)</Label>
                  <Select value={watchCountry} onValueChange={(v) => setValue('country', v as 'AT' | 'DE')}>
                    <SelectTrigger className="mt-1 h-9 border-gray-200 bg-white text-gray-900 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg z-[200]">
                      <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
                      <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">USt-Satz</Label>
                  <div className="mt-1 h-9 flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-sm font-semibold text-gray-700">
                    {vatRate}%
                    {vatRate === 0 && <span className="ml-1 text-xs font-normal text-gray-400">(RC)</span>}
                  </div>
                </div>
              </div>
            </section>

            {/* Positionen */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Positionen</h3>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-3">
                        <Label className="text-xs font-medium text-gray-500">Produkt</Label>
                        <Select onValueChange={(v) => handleProductSelect(index, v)}>
                          <SelectTrigger className="mt-1 h-8 border-gray-200 bg-white text-gray-900 text-xs">
                            <SelectValue placeholder="Wählen..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg z-[200]">
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs font-medium text-gray-500">Beschreibung</Label>
                        <Input
                          {...register(`items.${index}.description`, { required: true })}
                          className="mt-1 h-8 border-gray-200 bg-white text-gray-900 text-xs"
                        />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs font-medium text-gray-500">Menge</Label>
                        <Input
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                          type="number" min="0.001" step="0.001"
                          className="mt-1 h-8 border-gray-200 bg-white text-gray-900 text-xs"
                        />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs font-medium text-gray-500">Einheit</Label>
                        <Input
                          {...register(`items.${index}.unit`)}
                          className="mt-1 h-8 border-gray-200 bg-white text-gray-900 text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs font-medium text-gray-500">Preis (Brutto)</Label>
                        <Input
                          {...register(`items.${index}.unit_price_gross`, { valueAsNumber: true })}
                          type="number" step="0.01" min="0"
                          className="mt-1 h-8 border-gray-200 bg-white text-gray-900 text-xs"
                        />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs font-medium text-gray-500">Rabatt %</Label>
                        <Input
                          {...register(`items.${index}.discount_percent`, { valueAsNumber: true })}
                          type="number" step="0.1" min="0" max="100"
                          className="mt-1 h-8 border-gray-200 bg-white text-gray-900 text-xs"
                        />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs font-medium text-gray-500">Gesamt</Label>
                        <div className="mt-1 h-8 flex items-center px-2 bg-white border border-gray-200 rounded text-xs font-semibold text-gray-800">
                          {formatCurrency(computedItems[index]?.line_total_gross ?? 0)}
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-end pb-0.5">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => append({ product_id: '', description: '', quantity: 1, unit: 'Stück', unit_price_gross: 0, discount_percent: 0 })}
                  className="w-full h-9 border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 rounded-lg text-xs font-medium text-gray-400 hover:text-blue-600 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Position hinzufügen
                </button>
              </div>
            </section>

            {/* Summen */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              {vatRate > 0 && (
                <>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Zwischensumme (netto)</span>
                    <span>EUR {formatCurrency(totals.subtotalNet)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>USt. {vatRate}%</span>
                    <span>EUR {formatCurrency(totals.vatAmount)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2" />
                </>
              )}
              <div className="flex justify-between font-bold text-base text-gray-900">
                <span>Gesamtbetrag</span>
                <span>EUR {formatCurrency(totals.totalGross)}</span>
              </div>
            </div>

            {/* Bezahlter Betrag */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-gray-600">Bezahlter Betrag (EUR)</Label>
                <Input
                  {...register('paid_amount', { valueAsNumber: true })}
                  type="number" step="0.01" min="0"
                  className="mt-1 h-9 border-gray-200 bg-white text-gray-900 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Noch offen</Label>
                <div className="mt-1 h-9 flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-sm font-bold text-gray-800">
                  EUR {formatCurrency(totals.totalGross - (Number(watch('paid_amount')) || 0))}
                </div>
              </div>
            </div>

            {/* Anmerkung */}
            <div>
              <Label className="text-xs font-medium text-gray-600">Anmerkung (optional)</Label>
              <Textarea
                {...register('notes')}
                className="mt-1 border-gray-200 bg-white text-gray-900 text-sm resize-none"
                rows={2}
                placeholder="Interne Notiz oder Hinweis auf der Rechnung..."
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={onClose} className="border-gray-200 text-gray-600 hover:bg-gray-50">
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gray-900 hover:bg-gray-800 text-white gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Änderungen speichern
              </Button>
            </div>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
