import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useShopProducts } from '@/hooks/useShopProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PLAN_INFO } from '@/types/plans';
import { shopCopy } from '@/i18n/shop';
import type { ShopProduct } from '@/lib/shop';
import { filterShopProducts, ShopCategory, ShopSort } from '@/lib/shopCatalog';
import { ShopProductCard } from './ShopCarousel';

const CATS: ShopCategory[] = ['all', 'membership', 'courses', 'books', 'christmas'];
const SORTS: ShopSort[] = ['recommended', 'priceAsc', 'priceDesc', 'name'];

function priceOf(p: ShopProduct): number | null {
  const plan = p.id === '575565' ? PLAN_INFO.PRO : p.id === '346007' ? PLAN_INFO.BASIC : null;
  return plan ? plan.introductoryPrice ?? plan.monthlyPrice ?? null : p.price;
}

export function ShopCatalog({ loadingFallback }: { loadingFallback: React.ReactNode }) {
  const { t, language } = useLanguage();
  const c = shopCopy[language];
  const { products, loading } = useShopProducts();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ShopCategory>('all');
  const [sort, setSort] = useState<ShopSort>('recommended');
  const shown = useMemo(() => filterShopProducts(products, { query, category, sort, priceOf }), [products, query, category, sort]);

  if (loading) return <>{loadingFallback}</>;
  if (!products.length) return <p className="p-8 text-center text-ts-muted">{t('home.shopEmpty')}</p>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ts-muted" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={c.search} aria-label={c.search} className="pl-9 rounded-full bg-ts-card text-ts-ink" />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as ShopSort)} aria-label={c.sort}
          className="h-10 rounded-full border border-input bg-ts-card px-4 text-sm font-semibold text-ts-ink">
          {SORTS.map((s) => <option key={s} value={s}>{c.sorts[s]}</option>)}
        </select>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1" role="tablist">
        {CATS.map((k) => (
          <Button key={k} role="tab" aria-selected={category === k} size="sm" variant={category === k ? 'default' : 'outline'}
            onClick={() => setCategory(k)} className="rounded-full shrink-0 font-bold">{c.cats[k]}</Button>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ts-muted font-semibold">{c.results.replace('{n}', String(shown.length))}</span>
        <Button asChild variant="link" className="text-ts-deep p-0 h-auto"><Link to="/pricing">{c.pricing}</Link></Button>
      </div>
      {shown.length
        ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{shown.map((p) => <ShopProductCard key={p.id} p={p} />)}</div>
        : <p className="p-8 text-center text-ts-muted">{c.none}</p>}
    </div>
  );
}
