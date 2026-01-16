import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCw, Package, Settings } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DigiMemberProduct {
  id: string;
  product_id: string;
  name: string;
  type: string | null;
  checkout_url: string | null;
  is_active: boolean;
  app_plan: 'FREE' | 'PLAN_A' | 'PLAN_B' | null;
  last_synced_at: string;
}

const planLabels: Record<string, string> = {
  'FREE': 'Kostenlos',
  'PLAN_A': 'Premium',
  'PLAN_B': 'Premium Plus',
};

export function DigiMemberProductManager() {
  const [products, setProducts] = useState<DigiMemberProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/digimember?action=get-products`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products || []);
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
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/digimember?action=sync-products`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const data = await response.json();
      toast.success(`${data.synced} Produkte synchronisiert`);
      await fetchProducts();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Fehler bei der Synchronisierung');
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleUpdateMapping(productId: string, appPlan: string | null) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/digimember?action=update-product-mapping`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId, appPlan: appPlan === 'none' ? null : appPlan }),
        }
      );

      if (!response.ok) {
        throw new Error('Update failed');
      }

      toast.success('Produkt-Mapping aktualisiert');
      await fetchProducts();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Fehler beim Aktualisieren');
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Produkte werden geladen...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              DigiMember Produkte
            </CardTitle>
            <CardDescription>
              Verknüpfe DigiMember-Produkte mit App-Plänen
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
        </div>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Keine Produkte gefunden.</p>
            <p className="text-sm mt-2">
              Klicke auf "Synchronisieren" um Produkte von DigiMember zu laden.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{product.name}</span>
                    {!product.is_active && (
                      <Badge variant="secondary">Inaktiv</Badge>
                    )}
                    {product.app_plan && (
                      <Badge variant="default" className="bg-primary">
                        {planLabels[product.app_plan]}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <span>ID: {product.product_id}</span>
                    {product.type && <span className="ml-4">Typ: {product.type}</span>}
                  </div>
                  {product.checkout_url && (
                    <div className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                      Checkout: {product.checkout_url}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={product.app_plan || 'none'}
                    onValueChange={(value) => handleUpdateMapping(product.product_id, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Plan zuweisen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Kein Plan</SelectItem>
                      <SelectItem value="FREE">Kostenlos</SelectItem>
                      <SelectItem value="PLAN_A">Premium</SelectItem>
                      <SelectItem value="PLAN_B">Premium Plus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}