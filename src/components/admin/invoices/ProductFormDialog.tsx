import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useInvoices';
import type { Product } from '@/types/invoice';

interface Props {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
}

type FormValues = Omit<Product, 'id'>;

const inputCls =
  'mt-1 w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition';

export function ProductFormDialog({ open, onClose, product }: Props) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isEdit = !!product;

  const { register, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      sku: '', name: '', description: '',
      dealer_price_gross: 0, price_gross: 0,
      vat_rate_at: 10, vat_rate_de: 7, is_active: true,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        sku: product.sku,
        name: product.name,
        description: product.description ?? '',
        dealer_price_gross: Number(product.dealer_price_gross) || 0,
        price_gross: Number(product.price_gross) || 0,
        vat_rate_at: Number(product.vat_rate_at) || 10,
        vat_rate_de: Number(product.vat_rate_de) || 7,
        is_active: product.is_active,
      });
    } else {
      reset({
        sku: '', name: '', description: '',
        dealer_price_gross: 0, price_gross: 0,
        vat_rate_at: 10, vat_rate_de: 7, is_active: true,
      });
    }
  }, [product, reset, open]);

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      description: values.description || undefined,
      dealer_price_gross: Number(values.dealer_price_gross) || 0,
      price_gross: Number(values.price_gross) || 0,
      vat_rate_at: Number(values.vat_rate_at) || 0,
      vat_rate_de: Number(values.vat_rate_de) || 0,
    };
    if (isEdit && product) {
      await updateProduct.mutateAsync({ id: product.id, ...payload });
    } else {
      await createProduct.mutateAsync(payload);
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-white border border-gray-200 shadow-xl p-0 rounded-xl [&>button:last-child]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {isEdit ? 'Produkt bearbeiten' : 'Neues Produkt'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEdit ? 'Stammdaten und Preise anpassen.' : 'Stammdaten und Preise anlegen.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
          {/* SKU + Aktiv */}
          <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
            <div>
              <Label className="text-xs font-medium text-gray-600">SKU *</Label>
              <input {...register('sku', { required: true })} placeholder="TS-BAND1" className={`${inputCls} font-mono uppercase`} />
            </div>
            <div className="flex flex-col items-start">
              <Label className="text-xs font-medium text-gray-600 mb-2">Aktiv</Label>
              <div className="h-9 flex items-center">
                <Switch
                  checked={watch('is_active')}
                  onCheckedChange={(v) => setValue('is_active', v)}
                />
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <Label className="text-xs font-medium text-gray-600">Name *</Label>
            <input {...register('name', { required: true })} placeholder="Trumpetstar Band 1" className={inputCls} />
          </div>

          {/* Beschreibung */}
          <div>
            <Label className="text-xs font-medium text-gray-600">Beschreibung</Label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Kurze Produktbeschreibung…"
              className="mt-1 w-full px-3 py-2 rounded-md border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-none transition"
            />
          </div>

          {/* Preise */}
          <div>
            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Preise (€ Brutto)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-gray-600">Händlerpreis</Label>
                <div className="relative mt-1">
                  <input
                    {...register('dealer_price_gross', { valueAsNumber: true, required: true })}
                    type="number" step="0.01" min="0"
                    className={`${inputCls} mt-0 pr-8 tabular-nums`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">UVP / Endkunde</Label>
                <div className="relative mt-1">
                  <input
                    {...register('price_gross', { valueAsNumber: true, required: true })}
                    type="number" step="0.01" min="0"
                    className={`${inputCls} mt-0 pr-8 tabular-nums`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                </div>
              </div>
            </div>
          </div>

          {/* USt */}
          <div>
            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">USt-Sätze</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-gray-600">Österreich</Label>
                <div className="relative mt-1">
                  <input
                    {...register('vat_rate_at', { valueAsNumber: true })}
                    type="number" step="0.5" min="0"
                    className={`${inputCls} mt-0 pr-8 tabular-nums`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Deutschland</Label>
                <div className="relative mt-1">
                  <input
                    {...register('vat_rate_de', { valueAsNumber: true })}
                    type="number" step="0.5" min="0"
                    className={`${inputCls} mt-0 pr-8 tabular-nums`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 rounded-md border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              Abbrechen
            </button>
            <Button
              type="submit"
              disabled={createProduct.isPending || updateProduct.isPending}
              className="h-9 px-4 bg-gray-900 hover:bg-gray-800 text-white text-sm"
            >
              {isEdit ? 'Speichern' : 'Anlegen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
