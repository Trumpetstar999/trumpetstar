import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2, UserPlus } from 'lucide-react';
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
  // New customer fields
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
  const hasUid = isNewCustomer
    ? !!watch('new_customer_uid')
    : !!selectedCustomer?.uid_number;
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
    const finalItems: InvoiceItem[] = computedItems;

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
      items: finalItems,
    });

    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neue Rechnung erstellen</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Customer section */}
          <div className="p-4 border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Kunde</Label>
              <button
                type="button"
                onClick={() => setIsNewCustomer(!isNewCustomer)}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {isNewCustomer ? 'Bestehenden wählen' : 'Neuen Kunden'}
              </button>
            </div>

            {!isNewCustomer ? (
              <Select value={watch('customer_id')} onValueChange={(v) => setValue('customer_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Kunden auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company_name ? `${c.company_name} (${c.name})` : c.name} — {c.city}, {c.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Name (Inhaber)</Label>
                  <Input {...register('new_customer_name', { required: true })} placeholder="Max Mustermann" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Firma (optional)</Label>
                  <Input {...register('new_customer_company')} placeholder="Musikhaus GmbH" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Straße</Label>
                  <Input {...register('new_customer_street', { required: true })} placeholder="Musterstraße 1" className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">PLZ</Label>
                    <Input {...register('new_customer_postal', { required: true })} placeholder="1010" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Ort</Label>
                    <Input {...register('new_customer_city', { required: true })} placeholder="Wien" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Land</Label>
                  <Select value={watch('new_customer_country')} onValueChange={(v) => setValue('new_customer_country', v as 'AT' | 'DE')}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AT">Österreich</SelectItem>
                      <SelectItem value="DE">Deutschland</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">UID-Nummer (optional)</Label>
                  <Input {...register('new_customer_uid')} placeholder="ATU12345678" className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">E-Mail (optional)</Label>
                  <Input {...register('new_customer_email')} type="email" placeholder="kunde@example.com" className="mt-1" />
                </div>
              </div>
            )}
          </div>

          {/* Invoice meta */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Rechnungsdatum</Label>
              <Input {...register('invoice_date', { required: true })} type="date" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Land (USt)</Label>
              <Select value={watchCountry} onValueChange={(v) => setValue('country', v as 'AT' | 'DE')}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AT">AT — 10% USt</SelectItem>
                  <SelectItem value="DE">DE — {hasUid ? '0% Reverse Charge' : '7% USt'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground w-full">
                USt-Satz: <strong>{vatRate}%</strong>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Positionen</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-end p-3 border border-border rounded-lg">
                <div className="col-span-3">
                  <Label className="text-xs">Produkt</Label>
                  <Select onValueChange={(v) => handleProductSelect(index, v)}>
                    <SelectTrigger className="mt-1 text-xs"><SelectValue placeholder="Wählen..." /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Beschreibung</Label>
                  <Input {...register(`items.${index}.description`, { required: true })} className="mt-1 text-xs" />
                </div>
                <div className="col-span-1">
                  <Label className="text-xs">Menge</Label>
                  <Input {...register(`items.${index}.quantity`, { valueAsNumber: true })} type="number" min="1" step="0.001" className="mt-1 text-xs" />
                </div>
                <div className="col-span-1">
                  <Label className="text-xs">Einheit</Label>
                  <Input {...register(`items.${index}.unit`)} className="mt-1 text-xs" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Preis (Brutto)</Label>
                  <Input {...register(`items.${index}.unit_price_gross`, { valueAsNumber: true })} type="number" step="0.01" min="0" className="mt-1 text-xs" />
                </div>
                <div className="col-span-1">
                  <Label className="text-xs">Rabatt %</Label>
                  <Input {...register(`items.${index}.discount_percent`, { valueAsNumber: true })} type="number" step="0.1" min="0" max="100" className="mt-1 text-xs" />
                </div>
                <div className="col-span-1">
                  <Label className="text-xs">Gesamt</Label>
                  <div className="mt-1 px-2 py-2 bg-muted rounded text-xs font-medium">
                    {formatCurrency(computedItems[index]?.line_total_gross ?? 0)}
                  </div>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button type="button" onClick={() => remove(index)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ product_id: '', description: '', quantity: 1, unit: 'Stück', unit_price_gross: 0, discount_percent: 0 })}
            >
              <Plus className="w-4 h-4 mr-1" />
              Position hinzufügen
            </Button>
          </div>

          {/* Totals preview */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
            {vatRate > 0 && (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>Zwischensumme ohne USt.</span>
                  <span>EUR {formatCurrency(totals.subtotalNet)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>USt. {vatRate}%</span>
                  <span>EUR {formatCurrency(totals.vatAmount)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-bold text-base border-t border-border pt-2 mt-2">
              <span>Gesamt</span>
              <span>EUR {formatCurrency(totals.totalGross)}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs">Anmerkung (optional)</Label>
            <Textarea {...register('notes')} className="mt-1" rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={createInvoice.isPending || createCustomer.isPending}>
              {createInvoice.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Rechnung erstellen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
