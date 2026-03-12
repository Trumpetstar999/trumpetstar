import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { InventoryItem, InventoryMovement } from '@/types/invoice';
import { toast } from 'sonner';

export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*, product:products(*)')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as InventoryItem[];
    },
  });
}

export function useInventoryMovements(productId?: string) {
  return useQuery({
    queryKey: ['inventory-movements', productId],
    queryFn: async () => {
      let query = supabase
        .from('inventory_movements')
        .select('*, product:products(*)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (productId) query = query.eq('product_id', productId);
      const { data, error } = await query;
      if (error) throw error;
      return data as InventoryMovement[];
    },
  });
}

export function useAddStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      quantity,
      reason,
    }: {
      productId: string;
      quantity: number;
      reason: string;
    }) => {
      const { error } = await supabase.rpc('add_stock', {
        p_product_id: productId,
        p_quantity: quantity,
        p_reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['inventory-movements'] });
      toast.success('Lagerbestand aktualisiert');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateThreshold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, threshold }: { id: string; threshold: number }) => {
      const { error } = await supabase
        .from('inventory')
        .update({ low_stock_threshold: threshold })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Schwellwert gespeichert');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
