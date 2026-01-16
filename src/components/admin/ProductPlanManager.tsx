import { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DigiMemberProduct {
  id: string;
  product_id: string;
  name: string;
  type: string | null;
  checkout_url: string | null;
  is_active: boolean;
  last_synced_at: string;
  // From mapping
  plan_key: string;
  is_enabled: boolean;
}

interface Plan {
  key: string;
  display_name: string;
  rank: number;
}

const PLAN_OPTIONS = [
  { value: 'NONE', label: 'Keine Zuordnung' },
  { value: 'FREE', label: 'Free' },
  { value: 'BASIC', label: 'Basic' },
  { value: 'PREMIUM', label: 'Premium' },
];

export function ProductPlanManager() {
  const [products, setProducts] = useState<DigiMemberProduct[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingCheckoutUrl, setEditingCheckoutUrl] = useState<string | null>(null);
  const [tempCheckoutUrl, setTempCheckoutUrl] = useState('');

  async function fetchProducts() {
    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/digimember?action=get-products`,
        {
          headers: {
            'Authorization': `Bearer ${session?.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      setProducts(data.products || []);
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Fehler beim Laden der Produkte');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSync() {
    setIsSyncing(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/digimember?action=sync-products`,
        {
          headers: {
            'Authorization': `Bearer ${session?.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Sync failed');
      
      const data = await response.json();
      toast.success(`${data.synced} Produkte synchronisiert`);
      await fetchProducts();
    } catch (error) {
      console.error('Error syncing products:', error);
      toast.error('Fehler beim Synchronisieren');
    } finally {
      setIsSyncing(false);
    }
  }

  async function updateMapping(productId: string, updates: {
    planKey?: string;
    checkoutUrl?: string;
    isEnabled?: boolean;
  }) {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/digimember?action=update-product-mapping`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId,
            planKey: updates.planKey,
            checkoutUrl: updates.checkoutUrl,
            isEnabled: updates.isEnabled,
          }),
        }
      );

      if (!response.ok) throw new Error('Update failed');
      
      toast.success('Zuordnung aktualisiert');
      
      // Update local state
      setProducts(prev => prev.map(p => 
        p.product_id === productId 
          ? { 
              ...p, 
              plan_key: updates.planKey ?? p.plan_key,
              checkout_url: updates.checkoutUrl ?? p.checkout_url,
              is_enabled: updates.isEnabled ?? p.is_enabled,
            }
          : p
      ));
    } catch (error) {
      console.error('Error updating mapping:', error);
      toast.error('Fehler beim Aktualisieren');
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const activeProducts = products.filter(p => p.is_active);
  const inactiveProducts = products.filter(p => !p.is_active);
  const productsWithoutLink = products.filter(p => p.plan_key !== 'NONE' && !p.checkout_url);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Produkte & Pläne</CardTitle>
            <CardDescription>
              DigiMember-Produkte den App-Plänen zuordnen
            </CardDescription>
          </div>
          <Button 
            onClick={handleSync} 
            disabled={isSyncing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Synchronisieren
          </Button>
        </CardHeader>
        <CardContent>
          {productsWithoutLink.length > 0 && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Checkout-Links fehlen
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {productsWithoutLink.length} Produkt(e) haben einen Plan zugeordnet, aber keinen Checkout-Link.
                </p>
              </div>
            </div>
          )}

          {activeProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Keine Produkte gefunden.</p>
              <Button onClick={handleSync} className="mt-4" variant="outline">
                Produkte synchronisieren
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeProducts.map(product => (
                <div 
                  key={product.id} 
                  className="p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium truncate">{product.name}</h4>
                        <Badge variant="outline" className="shrink-0">
                          ID: {product.product_id}
                        </Badge>
                        {!product.is_enabled && (
                          <Badge variant="secondary">Deaktiviert</Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Label className="text-muted-foreground">Plan:</Label>
                          <Select
                            value={product.plan_key || 'NONE'}
                            onValueChange={(value) => updateMapping(product.product_id, { planKey: value })}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PLAN_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Label className="text-muted-foreground">Aktiv:</Label>
                          <Switch
                            checked={product.is_enabled}
                            onCheckedChange={(checked) => updateMapping(product.product_id, { isEnabled: checked })}
                          />
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center gap-2">
                        <Label className="text-muted-foreground shrink-0">Checkout-Link:</Label>
                        {editingCheckoutUrl === product.product_id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={tempCheckoutUrl}
                              onChange={(e) => setTempCheckoutUrl(e.target.value)}
                              placeholder="https://..."
                              className="flex-1"
                            />
                            <Button 
                              size="sm"
                              onClick={() => {
                                updateMapping(product.product_id, { checkoutUrl: tempCheckoutUrl });
                                setEditingCheckoutUrl(null);
                              }}
                            >
                              Speichern
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setEditingCheckoutUrl(null)}
                            >
                              Abbrechen
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {product.checkout_url ? (
                              <>
                                <span className="text-sm truncate text-muted-foreground">
                                  {product.checkout_url}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  asChild
                                >
                                  <a href={product.checkout_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </Button>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">
                                Nicht konfiguriert
                              </span>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingCheckoutUrl(product.product_id);
                                setTempCheckoutUrl(product.checkout_url || '');
                              }}
                            >
                              Bearbeiten
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {inactiveProducts.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Inaktive Produkte ({inactiveProducts.length})
              </h4>
              <div className="space-y-2">
                {inactiveProducts.map(product => (
                  <div 
                    key={product.id} 
                    className="p-3 border rounded-lg bg-muted/30 text-muted-foreground"
                  >
                    <span>{product.name}</span>
                    <Badge variant="outline" className="ml-2">ID: {product.product_id}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
