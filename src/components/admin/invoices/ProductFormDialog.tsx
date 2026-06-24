import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useInvoices';
import type { Product } from '@/types/invoice';

interface Props {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
}

type FormValues = Omit<Product, 'id'>;

export function ProductFormDialog({ open, onClose, product }: Props) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isEdit = !!product;

  const { register, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      dealer_price_gross: 0,
      price_gross: 0,
      vat_rate_at: 10,
      vat_rate_de: 7,
      is_active: true,
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
      <DialogContent className="max-w-xl bg-white">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Produkt bearbeiten' : 'Neues Produkt'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">SKU *</Label>
              <Input {...register('sku', { required: true })} placeholder="TS-BAND1" className="mt-1 h-9" />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs">Aktiv</Label>
                <div className="mt-2">
                  <Switch
                    checked={watch('is_active')}
                    onCheckedChange={(v) => setValue('is_active', v)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs">Name *</Label>
            <Input {...register('name', { required: true })} placeholder="Trumpetstar Band 1" className="mt-1 h-9" />
          </div>

          <div>
            <Label className="text-xs">Beschreibung</Label>
            <Textarea {...register('description')} rows={3} className="mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Händlerpreis (€ Brutto) *</Label>
              <Input {...register('dealer_price_gross', { valueAsNumber: true, required: true })}
                type="number" step="0.01" min="0" className="mt-1 h-9" />
            </div>
            <div>
              <Label className="text-xs">UVP / Endkundenpreis (€ Brutto) *</Label>
              <Input {...register('price_gross', { valueAsNumber: true, required: true })}
                type="number" step="0.01" min="0" className="mt-1 h-9" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">USt-Satz AT (%)</Label>
              <Input {...register('vat_rate_at', { valueAsNumber: true })}
                type="number" step="0.5" min="0" className="mt-1 h-9" />
            </div>
            <div>
              <Label className="text-xs">USt-Satz DE (%)</Label>
              <Input {...register('vat_rate_de', { valueAsNumber: true })}
                type="number" step="0.5" min="0" className="mt-1 h-9" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
              {isEdit ? 'Speichern' : 'Anlegen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
