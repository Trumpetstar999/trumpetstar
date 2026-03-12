export function getVatRate(country: 'AT' | 'DE', hasUid: boolean): number {
  if (country === 'AT') return 10;
  if (country === 'DE' && hasUid) return 0; // Reverse Charge
  return 7; // DE B2C
}

export function getVatNote(country: 'AT' | 'DE', hasUid: boolean): string | null {
  if (country === 'DE' && hasUid) {
    return 'Steuerfreie innergemeinschaftliche Lieferung gem. Art. 6 Abs 1 UStG 1994';
  }
  return null;
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('de-AT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function addDays(date: string | Date, days: number): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
