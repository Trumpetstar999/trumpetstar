export interface Customer {
  id: string;
  name: string;
  company_name?: string;
  street: string;
  postal_code: string;
  city: string;
  country: 'AT' | 'DE';
  uid_number?: string;
  email?: string;
  phone?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price_gross: number;
  vat_rate_at: number;
  vat_rate_de: number;
  is_active: boolean;
}

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price_gross: number;
  discount_percent: number;
  line_total_gross: number;
  sort_order: number;
  notes?: string;
  product?: Product;
}

export interface Invoice {
  id?: string;
  invoice_number?: string;
  customer_id: string;
  invoice_date: string;
  due_date: string;
  country: 'AT' | 'DE';
  vat_rate: number;
  subtotal_net: number;
  vat_amount: number;
  total_gross: number;
  paid_amount: number;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  pdf_url?: string;
  items?: InvoiceItem[];
  customer?: Customer;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  quantity_on_hand: number;
  low_stock_threshold: number;
  updated_at?: string;
  product?: Product;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  quantity_change: number;
  movement_type: 'in' | 'out' | 'correction' | 'return';
  reason: string;
  reference_type?: string;
  reference_id?: string;
  created_by?: string;
  created_at: string;
  product?: Product;
}
