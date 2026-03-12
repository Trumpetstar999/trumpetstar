import type { InvoiceItem } from '@/types/invoice';

export function calculateLineTotal(
  quantity: number,
  unitPrice: number,
  discountPercent: number
): number {
  return quantity * unitPrice * (1 - discountPercent / 100);
}

export function calculateInvoiceTotals(
  items: InvoiceItem[],
  vatRate: number
): { subtotalNet: number; vatAmount: number; totalGross: number } {
  const totalGross = items.reduce((sum, item) => sum + item.line_total_gross, 0);
  const subtotalNet = totalGross / (1 + vatRate / 100);
  const vatAmount = totalGross - subtotalNet;

  return {
    subtotalNet: Math.round(subtotalNet * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    totalGross: Math.round(totalGross * 100) / 100,
  };
}
