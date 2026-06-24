import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Invoice, InvoiceItem, Customer } from '@/types/invoice';
import { toast } from 'sonner';

// ── Customers ──────────────────────────────────────────────
export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Customer[];
    },
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select()
        .single();
      if (error) throw error;
      return data as Customer;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Kunde gespeichert');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Customer> & { id: string }) => {
      const { error } = await supabase.from('customers').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Kunde aktualisiert');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Kunde gelöscht');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Products ───────────────────────────────────────────────
export function useInvoiceProducts() {
  return useQuery({
    queryKey: ['invoice-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as unknown as import('@/types/invoice').Product[];
    },
  });
}

export function useAllProducts() {
  return useQuery({
    queryKey: ['all-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as unknown as import('@/types/invoice').Product[];
    },
  });
}

type ProductInput = Omit<import('@/types/invoice').Product, 'id'>;

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: ProductInput) => {
      const { data, error } = await supabase.from('products').insert(product as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-products'] });
      qc.invalidateQueries({ queryKey: ['invoice-products'] });
      toast.success('Produkt angelegt');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ProductInput> & { id: string }) => {
      const { error } = await supabase.from('products').update(data as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-products'] });
      qc.invalidateQueries({ queryKey: ['invoice-products'] });
      toast.success('Produkt aktualisiert');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-products'] });
      qc.invalidateQueries({ queryKey: ['invoice-products'] });
      toast.success('Produkt gelöscht');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Invoices ───────────────────────────────────────────────
export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, customer:customers(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as (Invoice & { customer: Customer })[];
    },
  });
}

export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: ['invoices', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, customer:customers(*), items:invoice_items(*, product:products(*))')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as Invoice & { customer: Customer; items: InvoiceItem[] };
    },
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      invoice,
      items,
    }: {
      invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'items' | 'customer'>;
      items: Omit<InvoiceItem, 'id' | 'invoice_id'>[];
    }) => {
      // Invoice number is assigned on finalization — drafts get no number yet
      const { data: inv, error: invError } = await supabase
        .from('invoices')
        .insert({ ...invoice, invoice_number: null })
        .select()
        .single();
      if (invError) throw invError;

      if (items.length > 0) {
        const { error: itemsError } = await supabase.from('invoice_items').insert(
          items.map((item, i) => ({ ...item, invoice_id: inv.id, sort_order: i }))
        );
        if (itemsError) throw itemsError;
      }

      return inv;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Rechnung erstellt');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Invoice['status'] }) => {
      const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Status aktualisiert');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useFinalizeInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('finalize_invoice', { p_invoice_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Rechnung finalisiert & Lager aktualisiert');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Rechnung gelöscht');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
