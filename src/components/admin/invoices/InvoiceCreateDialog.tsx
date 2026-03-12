import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2, UserPlus, ChevronDown, X } from 'lucide-react';
import { useCustomers, useCreateCustomer, useCreateInvoice, useInvoiceProducts } from '@/hooks/useInvoices';
import { getVatRate } from '@/lib/vat';
import { calculateLineTotal, calculateInvoiceTotals } from '@/lib/invoice-calc';
import { addDays, formatCurrency } from '@/lib/vat';
import type { InvoiceItem } from '@/types/invoice';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface FormValues {
  customer_id: string;
  country: 'AT' | 'DE';
  invoice_date: string;
  notes: string;
  items: {
    product_id: string;
    description: string;
    quantity: number;
    unit: string;
    unit_price_gross: number;
    discount_percent: number;
  }[];
  new_customer_name: string;
  new_customer_company: string;
  new_customer_street: string;
  new_customer_postal: string;
  new_customer_city: string;
  new_customer_country: 'AT' | 'DE';
  new_customer_uid: string;
  new_customer_email: string;
}

export function InvoiceCreateDialog({ open, onClose }: Props) {
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useInvoiceProducts();
  const createInvoice = useCreateInvoice();
  const createCustomer = useCreateCustomer();

  const today = new Date().toISOString().split('T')[0];

  const { register, handleSubmit, watch, setValue, control, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      customer_id: '',
      country: 'AT',
      invoice_date: today,
      notes: '',
      items: [{ product_id: '', description: '', quantity: 1, unit: 'Stück', unit_price_gross: 0, discount_percent: 0 }],
      new_customer_name: '',
      new_customer_company: '',
      new_customer_street: '',
      new_customer_postal: '',
      new_customer_city: '',
      new_customer_country: 'AT',
      new_customer_uid: '',
      new_customer_email: '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchCountry = watch('country');
  const watchItems = watch('items');
  const watchCustomerId = watch('customer_id');

  const selectedCustomer = customers.find((c) => c.id === watchCustomerId);
  const hasUid = isNewCustomer ? !!watch('new_customer_uid') : !!selectedCustomer?.uid_number;
  const vatRate = getVatRate(watchCountry, hasUid);

  const computedItems: InvoiceItem[] = watchItems.map((item, i) => ({
    ...item,
    id: undefined,
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
    let customerId = values.customer_id;

    if (isNewCustomer) {
      const newCust = await createCustomer.mutateAsync({
        name: values.new_customer_name,
        company_name: values.new_customer_company || undefined,
        street: values.new_customer_street,
        postal_code: values.new_customer_postal,
        city: values.new_customer_city,
        country: values.new_customer_country,
        uid_number: values.new_customer_uid || undefined,
        email: values.new_customer_email || undefined,
      });
      customerId = newCust.id;
    }

    const dueDate = addDays(values.invoice_date, 14);

    await createInvoice.mutateAsync({
      invoice: {
        customer_id: customerId,
        invoice_date: values.invoice_date,
        due_date: dueDate,
        country: values.country,
        vat_rate: vatRate,
        subtotal_net: totals.subtotalNet,
        vat_amount: totals.vatAmount,
        total_gross: totals.totalGross,
        paid_amount: 0,
        status: 'draft',
        notes: values.notes || undefined,
      },
      items: computedItems,
    });

    reset();
    setIsNewCustomer(false);
    onClose();
  }

  function handleClose() {
    reset();
    setIsNewCustomer(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto bg-white border border-gray-200 shadow-xl p-0 rounded-xl [&>button:last-child]:hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 z-10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Neue Rechnung erstellen</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="invoice-form px-6 py-5 space-y-6">

          {/* ── Kunde ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Kunde</h3>
              <button
                type="button"
                onClick={() => { setIsNewCustomer(!isNewCustomer); setValue('customer_id', ''); }}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {isNewCustomer ? '← Bestehenden wählen' : 'Neuen Kunden anlegen'}
              </button>
            </div>

            {!isNewCustomer ? (
              <Select value={watchCustomerId} onValueChange={(v) => setValue('customer_id', v)}>
                <SelectTrigger className="w-full h-10 border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Kunden auswählen..." />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-[200]">
                  {customers.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-400">Keine Kunden vorhanden</div>
                  ) : (
                    customers.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-gray-900 focus:bg-blue-50">
                        {c.company_name ? `${c.company_name} (${c.name})` : c.name}
                        <span className="text-gray-400 ml-1">— {c.city}, {c.country}</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            ) : (
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-gray-600">Name (Inhaber) *</Label>
                  <Input
                    {...register('new_customer_name', { required: true })}
                    placeholder="Max Mustermann"
                    className="mt-1 h-9 border-gray-200 bg-white text-gray-900 text-sm"
                  />
                  {errors.new_customer_name && <p className="text-xs text-red-500 mt-0.5">Pflichtfeld</p>}
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Firma (optional)</Label>
                  <Input {...register('new_customer_company')} placeholder="Musikhaus GmbH" className="mt-1 h-9 border-gray-200 bg-white text-gray-900 text-sm" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Straße *</Label>
                  <Input {...register('new_customer_street', { required: true })} placeholder="Musterstraße 1" className="mt-1 h-9 border-gray-200 bg-white text-gray-900 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs font-medium text-gray-600">PLZ *</Label>
                    <Input {...register('new_customer_postal', { required: true })} placeholder="1010" className="mt-1 h-9 border-gray-200 bg-white text-gray-900 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Ort *</Label>
                    <Input {...register('new_customer_city', { required: true })} placeholder="Wien" className="mt-1 h-9 border-gray-200 bg-white text-gray-900 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Land</Label>
                  <Select value={watch('new_customer_country')} onValueChange={(v) => setValue('new_customer_country', v as 'AT' | 'DE')}>
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
                  <Label className="text-xs font-medium text-gray-600">UID-Nummer (optional)</Label>
                  <Input {...register('new_customer_uid')} placeholder="ATU12345678" className="mt-1 h-9 border-gray-200 bg-white text-gray-900 text-sm" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs font-medium text-gray-600">E-Mail (optional)</Label>
                  <Input {...register('new_customer_email')} type="email" placeholder="kunde@example.com" className="mt-1 h-9 border-gray-200 bg-white text-gray-900 text-sm" />
                </div>
              </div>
            )}
          </section>

          {/* ── Rechnungsdaten ── */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Rechnungsdaten</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-medium text-gray-600">Rechnungsdatum</Label>
                <Input
                  {...register('invoice_date', { required: true })}
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
                    <SelectItem value="AT">🇦🇹 AT — 10% USt</SelectItem>
                    <SelectItem value="DE">🇩🇪 DE — {hasUid ? '0% Reverse Charge' : '7% USt'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Angewendeter USt-Satz</Label>
                <div className="mt-1 h-9 flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-sm font-semibold text-gray-700">
                  {vatRate}%
                  {vatRate === 0 && <span className="ml-1 text-xs font-normal text-gray-400">(Reverse Charge)</span>}
                </div>
              </div>
            </div>
          </section>

          {/* ── Positionen ── */}
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
                        type="number" min="1" step="0.001"
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
                        title="Position entfernen"
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

          {/* ── Summen ── */}
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
            {vatRate === 0 && (
              <p className="text-xs text-gray-400 italic">
                Steuerfreie innergemeinschaftliche Lieferung (Reverse Charge)
              </p>
            )}
            <div className="flex justify-between font-bold text-base text-gray-900">
              <span>Gesamtbetrag</span>
              <span>EUR {formatCurrency(totals.totalGross)}</span>
            </div>
          </div>

          {/* ── Anmerkung ── */}
          <div>
            <Label className="text-xs font-medium text-gray-600">Anmerkung (optional)</Label>
            <Textarea
              {...register('notes')}
              className="mt-1 border-gray-200 bg-white text-gray-900 text-sm resize-none"
              rows={2}
              placeholder="Interne Notiz oder Hinweis auf der Rechnung..."
            />
          </div>

          {/* ── Footer ── */}
          <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={handleClose} className="border-gray-200 text-gray-600 hover:bg-gray-50">
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={createInvoice.isPending || createCustomer.isPending}
              className="bg-gray-900 hover:bg-gray-800 text-white gap-2"
            >
              {(createInvoice.isPending || createCustomer.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              Rechnung erstellen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
