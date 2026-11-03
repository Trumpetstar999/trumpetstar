import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isSafeShopOrderUrl, ShopProduct, sortShopProducts } from '@/lib/shop';

let refreshRequested = false;

/** Reads the cached shop; asks the server to refresh at most once per page load (server enforces hourly). */
export function useShopProducts() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data } = await supabase.from('shop_products').select('*').eq('visible', true);
      if (!alive) return;
      setProducts(sortShopProducts(((data as ShopProduct[]) ?? []).filter((p) => isSafeShopOrderUrl(p.order_url))));
      setLoading(false);
    };
    load();
    if (!refreshRequested) {
      refreshRequested = true;
      supabase.functions.invoke('shop-products').then(({ data }) => { if (data?.refreshed) load(); }).catch(() => {});
    }
    return () => { alive = false; };
  }, []);

  return { products, loading };
}
