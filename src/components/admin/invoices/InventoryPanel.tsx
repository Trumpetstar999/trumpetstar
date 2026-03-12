import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Package, Plus, History, Loader2 } from 'lucide-react';
import { useInventory, useInventoryMovements, useAddStock, useUpdateThreshold } from '@/hooks/useInventory';
import { formatCurrency } from '@/lib/vat';

export function InventoryPanel() {
  const { data: inventory = [], isLoading } = useInventory();
  const { data: movements = [] } = useInventoryMovements();
  const addStock = useAddStock();
  const updateThreshold = useUpdateThreshold();

  const [addDialog, setAddDialog] = useState<{ open: boolean; productId: string; productName: string } | null>(null);
  const [addQty, setAddQty] = useState('1');
  const [addReason, setAddReason] = useState('Wareneingang');
  const [historyProductId, setHistoryProductId] = useState<string | null>(null);
  const { data: productMovements = [] } = useInventoryMovements(historyProductId ?? undefined);

  const lowStockItems = inventory.filter(
    (i) => i.quantity_on_hand <= i.low_stock_threshold
  );

  async function handleAddStock() {
    if (!addDialog) return;
    await addStock.mutateAsync({
      productId: addDialog.productId,
      quantity: parseInt(addQty),
      reason: addReason,
    });
    setAddDialog(null);
    setAddQty('1');
    setAddReason('Wareneingang');
  }

  const movementsToShow = historyProductId ? productMovements : movements;

  return (
    <div className="space-y-5">
      {/* Low stock warnings */}
      {lowStockItems.length > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-orange-700">Niedriger Lagerbestand</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((item) => (
              <span key={item.id} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                {item.product?.name}: <strong>{item.quantity_on_hand} Stück</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Inventory table */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Lagerbestand</span>
        </div>
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground">Lade...</div>
        ) : inventory.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <p className="text-sm">Noch keine Lagereinträge vorhanden.</p>
            <p className="text-xs mt-1">Buche einen Wareneingang, um den Bestand zu erfassen.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Produkt</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">SKU</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Bestand</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Warnung bei</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => {
                const isLow = item.quantity_on_hand <= item.low_stock_threshold;
                return (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="px-4 py-3 font-medium">{item.product?.name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{item.product?.sku || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold text-base ${isLow ? 'text-orange-500' : 'text-green-600'}`}>
                        {item.quantity_on_hand}
                      </span>
                      <span className="text-muted-foreground text-xs ml-1">Stück</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Input
                        type="number"
                        defaultValue={item.low_stock_threshold}
                        min={0}
                        className="w-20 h-7 text-xs text-right ml-auto"
                        onBlur={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val !== item.low_stock_threshold) {
                            updateThreshold.mutate({ id: item.id, threshold: val });
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => setAddDialog({
                            open: true,
                            productId: item.product_id,
                            productName: item.product?.name || item.product_id,
                          })}
                        >
                          <Plus className="w-3 h-3" />
                          Wareneingang
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1"
                          onClick={() => setHistoryProductId(
                            historyProductId === item.product_id ? null : item.product_id
                          )}
                        >
                          <History className="w-3 h-3" />
                          Historie
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Movements / History */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-sm">
              {historyProductId
                ? `Historie: ${inventory.find(i => i.product_id === historyProductId)?.product?.name}`
                : 'Letzte Lagerbewegungen'}
            </span>
          </div>
          {historyProductId && (
            <button
              onClick={() => setHistoryProductId(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Alle anzeigen
            </button>
          )}
        </div>
        {movementsToShow.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Keine Bewegungen vorhanden.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Datum</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Produkt</th>
                <th className="text-center px-4 py-2 font-medium text-muted-foreground text-xs">Typ</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Menge</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Grund</th>
              </tr>
            </thead>
            <tbody>
              {movementsToShow.map((m) => (
                <tr key={m.id} className="border-b border-border/50">
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {new Date(m.created_at).toLocaleString('de-AT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-2 text-xs">{m.product?.name || '—'}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      m.movement_type === 'in' ? 'bg-green-100 text-green-700' :
                      m.movement_type === 'out' ? 'bg-red-100 text-red-700' :
                      m.movement_type === 'return' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {m.movement_type === 'in' ? '↑ Eingang' : m.movement_type === 'out' ? '↓ Ausgang' : m.movement_type === 'return' ? '↩ Rückgabe' : '✏ Korrektur'}
                    </span>
                  </td>
                  <td className={`px-4 py-2 text-right font-bold text-sm ${m.quantity_change > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {m.quantity_change > 0 ? '+' : ''}{m.quantity_change}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{m.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Stock Dialog */}
      <Dialog open={!!addDialog} onOpenChange={(v) => !v && setAddDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Wareneingang buchen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Produkt: <strong>{addDialog?.productName}</strong>
            </p>
            <div>
              <Label className="text-xs">Menge</Label>
              <Input
                type="number"
                min="1"
                value={addQty}
                onChange={(e) => setAddQty(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Grund / Notiz</Label>
              <Input
                value={addReason}
                onChange={(e) => setAddReason(e.target.value)}
                className="mt-1"
                placeholder="Wareneingang"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setAddDialog(null)}>Abbrechen</Button>
              <Button size="sm" onClick={handleAddStock} disabled={addStock.isPending}>
                {addStock.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                Buchen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
