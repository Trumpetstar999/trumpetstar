import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { InventoryItem, InventoryMovement, Product } from '@/types/invoice';
import { toast } from 'sonner';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as Product[];
    },
  });
}

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

export function useSetStock() {
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
      // Get current quantity first
      const { data: inv } = await supabase
        .from('inventory')
        .select('quantity_on_hand')
        .eq('product_id', productId)
        .maybeSingle();

      const current = inv?.quantity_on_hand ?? 0;
      const diff = quantity - current;

      // Upsert inventory
      const { error: upsertError } = await supabase
        .from('inventory')
        .upsert({ product_id: productId, quantity_on_hand: quantity, updated_at: new Date().toISOString() }, { onConflict: 'product_id' });
      if (upsertError) throw upsertError;

      // Log correction movement
      if (diff !== 0) {
        const { error: movErr } = await supabase
          .from('inventory_movements')
          .insert({
            product_id: productId,
            quantity_change: diff,
            movement_type: 'correction',
            reason: reason || 'Manuelle Korrektur',
          });
        if (movErr) throw movErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['inventory-movements'] });
      toast.success('Bestand gesetzt');
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
