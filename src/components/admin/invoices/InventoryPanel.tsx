import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle, Package, Plus, History, Loader2,
  ArrowDownToLine, Pencil, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  useInventory, useInventoryMovements, useAddStock,
  useUpdateThreshold, useSetStock, useProducts,
} from '@/hooks/useInventory';

// ─── Types ────────────────────────────────────────────────────────────────────

type AddMode = 'incoming' | 'set';

interface StockDialog {
  mode: AddMode;
  productId: string;
  productName: string;
  currentQty: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InventoryPanel() {
  const { data: inventory = [], isLoading } = useInventory();
  const { data: allProducts = [] } = useProducts();
  const { data: movements = [] } = useInventoryMovements();
  const addStock = useAddStock();
  const setStock = useSetStock();
  const updateThreshold = useUpdateThreshold();

  const [stockDialog, setStockDialog] = useState<StockDialog | null>(null);
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');

  // New inventory entry dialog
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [newProductId, setNewProductId] = useState('');
  const [newQty, setNewQty] = useState('0');

  const [historyProductId, setHistoryProductId] = useState<string | null>(null);
  const { data: productMovements = [] } = useInventoryMovements(historyProductId ?? undefined);

  const existingProductIds = new Set(inventory.map((i) => i.product_id));
  const availableProducts = allProducts.filter((p) => !existingProductIds.has(p.id));

  const lowStockItems = inventory.filter((i) => i.quantity_on_hand <= i.low_stock_threshold);
  const movementsToShow = historyProductId ? productMovements : movements;

  // ── Handlers ────────────────────────────────────────────────────────────────

  function openIncoming(productId: string, productName: string, currentQty: number) {
    setStockDialog({ mode: 'incoming', productId, productName, currentQty });
    setQty('1');
    setReason('Wareneingang');
  }

  function openSet(productId: string, productName: string, currentQty: number) {
    setStockDialog({ mode: 'set', productId, productName, currentQty });
    setQty(String(currentQty));
    setReason('Manuelle Korrektur');
  }

  function closeDialog() {
    setStockDialog(null);
    setQty('');
    setReason('');
  }

  async function handleSubmit() {
    if (!stockDialog) return;
    const parsed = parseInt(qty);
    if (isNaN(parsed) || parsed < 0) return;

    if (stockDialog.mode === 'incoming') {
      await addStock.mutateAsync({ productId: stockDialog.productId, quantity: parsed, reason });
    } else {
      await setStock.mutateAsync({ productId: stockDialog.productId, quantity: parsed, reason });
    }
    closeDialog();
  }

  async function handleCreateEntry() {
    if (!newProductId) return;
    await setStock.mutateAsync({
      productId: newProductId,
      quantity: parseInt(newQty) || 0,
      reason: 'Ersteintrag',
    });
    setNewEntryOpen(false);
    setNewProductId('');
    setNewQty('0');
  }

  const isPending = addStock.isPending || setStock.isPending;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Low-stock banner */}
      {lowStockItems.length > 0 && (
        <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-orange-700 mb-1">Niedriger Lagerbestand</p>
            <div className="flex flex-wrap gap-1.5">
              {lowStockItems.map((item) => (
                <span key={item.id} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  {item.product?.name}: <strong>{item.quantity_on_hand}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Inventory table */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-sm text-foreground">Lagerbestand</span>
            {inventory.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                {inventory.length}
              </span>
            )}
          </div>
          {availableProducts.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              onClick={() => setNewEntryOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Produkt hinzufügen
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Lade Lagerbestand…</span>
          </div>
        ) : inventory.length === 0 ? (
          <div className="p-10 text-center">
            <Package className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Noch keine Lagereinträge</p>
            <p className="text-xs text-muted-foreground mt-1">
              Füge ein Produkt hinzu, um den Bestand zu erfassen.
            </p>
            {availableProducts.length > 0 && (
              <Button
                size="sm"
                className="mt-4 gap-1.5"
                onClick={() => setNewEntryOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                Erstes Produkt hinzufügen
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Produkt</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">SKU</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bestand</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Warnung ab</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {inventory.map((item) => {
                const isLow = item.quantity_on_hand <= item.low_stock_threshold;
                const isActive = historyProductId === item.product_id;
                return (
                  <tr key={item.id} className={`transition-colors ${isActive ? 'bg-muted/20' : 'hover:bg-muted/10'}`}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">{item.product?.name || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                        {item.product?.sku || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 font-bold text-base ${isLow ? 'text-orange-500' : 'text-green-600'}`}>
                        {isLow && <AlertTriangle className="w-3.5 h-3.5" />}
                        {item.quantity_on_hand}
                      </span>
                      <span className="text-muted-foreground text-xs ml-1">Stk.</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Input
                        type="number"
                        defaultValue={item.low_stock_threshold}
                        min={0}
                        className="w-20 h-7 text-xs text-right ml-auto border-border/60"
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
                          className="h-7 text-xs gap-1 border-border/60"
                          title="Wareneingang buchen"
                          onClick={() => openIncoming(item.product_id, item.product?.name || item.product_id, item.quantity_on_hand)}
                        >
                          <ArrowDownToLine className="w-3 h-3" />
                          Eingang
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1"
                          title="Bestand manuell setzen"
                          onClick={() => openSet(item.product_id, item.product?.name || item.product_id, item.quantity_on_hand)}
                        >
                          <Pencil className="w-3 h-3" />
                          Setzen
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-7 text-xs gap-1 ${isActive ? 'text-primary' : ''}`}
                          onClick={() => setHistoryProductId(isActive ? null : item.product_id)}
                        >
                          <History className="w-3 h-3" />
                          {isActive ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
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

      {/* Movements */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-sm text-foreground">
              {historyProductId
                ? `Historie – ${inventory.find((i) => i.product_id === historyProductId)?.product?.name}`
                : 'Letzte Lagerbewegungen'}
            </span>
          </div>
          {historyProductId && (
            <button
              onClick={() => setHistoryProductId(null)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Alle anzeigen
            </button>
          )}
        </div>

        {movementsToShow.length === 0 ? (
          <p className="p-6 text-sm text-center text-muted-foreground">Keine Bewegungen vorhanden.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Datum</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Produkt</th>
                <th className="text-center px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Typ</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Menge</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Grund</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {movementsToShow.map((m) => (
                <tr key={m.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(m.created_at).toLocaleString('de-AT', {
                      day: '2-digit', month: '2-digit', year: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-medium">{m.product?.name || '—'}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                      m.movement_type === 'in'         ? 'bg-green-50 text-green-700 border border-green-200' :
                      m.movement_type === 'out'        ? 'bg-red-50 text-red-700 border border-red-200' :
                      m.movement_type === 'return'     ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                         'bg-muted text-muted-foreground border border-border'
                    }`}>
                      {m.movement_type === 'in'     ? '↑ Eingang'   :
                       m.movement_type === 'out'    ? '↓ Ausgang'   :
                       m.movement_type === 'return' ? '↩ Rückgabe'  : '✏ Korrektur'}
                    </span>
                  </td>
                  <td className={`px-4 py-2.5 text-right font-bold text-sm ${m.quantity_change > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {m.quantity_change > 0 ? '+' : ''}{m.quantity_change}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{m.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Stock Dialog (Eingang / Setzen) ─────────────────────────────────── */}
      <Dialog open={!!stockDialog} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent className="max-w-sm bg-white p-0 rounded-xl border border-border shadow-xl [&>button:last-child]:hidden">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-semibold text-foreground">
                {stockDialog?.mode === 'incoming' ? 'Wareneingang buchen' : 'Bestand setzen'}
              </DialogTitle>
              <button onClick={closeDialog} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </DialogHeader>

          <div className="px-5 py-5 space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border/60">
              <span className="text-sm text-muted-foreground">Produkt</span>
              <span className="text-sm font-semibold text-foreground">{stockDialog?.productName}</span>
            </div>

            {stockDialog?.mode === 'set' && (
              <div className="text-xs text-muted-foreground text-center -mt-1">
                Aktuell: <strong>{stockDialog.currentQty} Stk.</strong> → neuer Wert:
              </div>
            )}

            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                {stockDialog?.mode === 'incoming' ? 'Eingehende Menge' : 'Neuer Bestand (absolut)'}
              </Label>
              <Input
                type="number"
                min={stockDialog?.mode === 'incoming' ? '1' : '0'}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="mt-1.5 text-sm"
                autoFocus
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground">Grund / Notiz</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1.5 text-sm"
                placeholder={stockDialog?.mode === 'incoming' ? 'Wareneingang' : 'Manuelle Korrektur'}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1" onClick={closeDialog}>
                Abbrechen
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleSubmit}
                disabled={isPending || !qty}
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                {stockDialog?.mode === 'incoming' ? 'Einbuchen' : 'Speichern'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── New Inventory Entry Dialog ───────────────────────────────────────── */}
      <Dialog open={newEntryOpen} onOpenChange={(v) => !v && setNewEntryOpen(false)}>
        <DialogContent className="max-w-sm bg-white p-0 rounded-xl border border-border shadow-xl [&>button:last-child]:hidden">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-semibold text-foreground">
                Produkt zum Lager hinzufügen
              </DialogTitle>
              <button onClick={() => setNewEntryOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </DialogHeader>

          <div className="px-5 py-5 space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Produkt</Label>
              <Select value={newProductId} onValueChange={setNewProductId}>
                <SelectTrigger className="mt-1.5 text-sm">
                  <SelectValue placeholder="Produkt auswählen…" />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  {availableProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="font-medium">{p.name}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{p.sku}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground">Anfangsbestand (Stk.)</Label>
              <Input
                type="number"
                min="0"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                className="mt-1.5 text-sm"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setNewEntryOpen(false)}>
                Abbrechen
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleCreateEntry}
                disabled={!newProductId || setStock.isPending}
              >
                {setStock.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Anlegen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
