import { useState } from 'react';
import { InvoiceList } from './InvoiceList';
import { InvoiceCreateDialog } from './InvoiceCreateDialog';
import { InvoiceDetailDialog } from './InvoiceDetailDialog';
import { InventoryPanel } from './InventoryPanel';
import { Receipt, Package } from 'lucide-react';

type Tab = 'invoices' | 'inventory';

export function InvoicesPanel() {
  const [tab, setTab] = useState<Tab>('invoices');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="admin-tabs">
        <button
          onClick={() => setTab('invoices')}
          className={`admin-tab ${tab === 'invoices' ? 'admin-tab-active' : ''}`}
        >
          <Receipt className="w-4 h-4" />
          Rechnungen
        </button>
        <button
          onClick={() => setTab('inventory')}
          className={`admin-tab ${tab === 'inventory' ? 'admin-tab-active' : ''}`}
        >
          <Package className="w-4 h-4" />
          Lager
        </button>
      </div>

      {tab === 'invoices' && (
        <InvoiceList
          onView={(id) => setSelectedInvoiceId(id)}
          onCreate={() => setCreateOpen(true)}
        />
      )}

      {tab === 'inventory' && <InventoryPanel />}

      <InvoiceCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      <InvoiceDetailDialog
        invoiceId={selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
      />
    </div>
  );
}
