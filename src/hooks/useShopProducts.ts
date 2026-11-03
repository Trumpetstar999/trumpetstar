import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isSafeShopOrderUrl, ShopProduct, sortShopProducts } from '@/lib/shop';

/** Each shop surface reloads after sync; the server enforces the hourly provider cache. */
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
    const refresh = async () => {
      await supabase.functions.invoke('shop-products').catch(() => {});
      if (alive) await load();
    };
    void load();
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 60 * 60 * 1000);
    return () => { alive = false; window.clearInterval(timer); };
  }, []);

  return { products, loading };
}
