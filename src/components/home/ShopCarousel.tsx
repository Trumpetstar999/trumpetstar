import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage';
import { useShopProducts } from '@/hooks/useShopProducts';
import { formatPrice, isNewProduct, shopCheckoutUrl, ShopProduct } from '@/lib/shop';
import { Button } from '@/components/ui/button';
import { PLAN_INFO } from '@/types/plans';
import { ShopPurchaseDialog } from './ShopPurchaseDialog';
import { shopCopy } from '@/i18n/shop';

export function ShopProductCard({ p, className = '', compact = false }: { p: ShopProduct; className?: string; compact?: boolean }) {
  const { t, language } = useLanguage();
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const planKey = p.id === '575565' ? 'PRO' : p.id === '346007' ? 'BASIC' : null;
  const plan = planKey ? PLAN_INFO[planKey] : null;
  const orderUrl = shopCheckoutUrl(p);
  const price = formatPrice(plan ? plan.introductoryPrice ?? plan.monthlyPrice ?? null : p.price, p.currency, language);
  if (compact) {
    const content = <>
      <span className="relative block aspect-square shrink-0 bg-ts-surface w-full">
        <img src={p.image_url || '/logo_trumpetstar.png'} alt="" className="absolute inset-0 w-full h-full object-contain p-2" loading="lazy" />
      </span>
      <span className="block p-3">
        <span className="block text-sm font-bold text-ts-ink break-words">{p.name}</span>
        <span className="block mt-2 text-base font-bold text-ts-ink tabular-nums">{price}</span>
      </span>
    </>;
    const compactClassName = `flex flex-col items-stretch justify-start rounded-lg bg-ts-card p-0 overflow-hidden shadow-sm ${className}`;
    return <>
      <Button variant="ghost" onClick={() => setPurchaseOpen(true)} className={`${compactClassName} h-auto whitespace-normal text-left hover:bg-ts-surface`} aria-label={[p.name, price].join('. ')}>{content}</Button>
      {purchaseOpen && <ShopPurchaseDialog product={p} onClose={() => setPurchaseOpen(false)} />}
    </>;
  }
  return (
    <div className={`flex flex-col rounded-[20px] bg-ts-card overflow-hidden shadow-sm ${className}`}>
      <div className="relative aspect-square bg-ts-surface flex items-center justify-center">
        {p.image_url
          ? <img src={p.image_url} alt={p.name} className="w-full h-full object-contain p-2" loading="lazy" />
          : <img src="/logo_trumpetstar.png" alt="" className="w-2/3 opacity-80" loading="lazy" />}
        {isNewProduct(p) && <span className="absolute top-2 left-2 rounded-full bg-ts-red text-ts-on text-[11px] font-extrabold px-2 py-0.5">{t('home.shopBadge')}</span>}
      </div>
      <div className="flex flex-col flex-1 p-3 gap-1">
        <p className="text-sm font-bold text-ts-ink line-clamp-2 min-h-[2.5rem]">{p.name}</p>
        <p className="text-base font-bold text-ts-ink min-h-5">{formatPrice(plan ? plan.introductoryPrice ?? plan.monthlyPrice ?? null : p.price, p.currency, language)}</p>
        {plan && <p className="text-xs leading-relaxed text-ts-ink">{t(`pricing_table.${planKey === 'PRO' ? 'proMonthlyTerms' : 'monthlyTerms'}`, { price: plan.monthlyPrice ?? 0, intro: plan.introductoryPrice ?? 0, months: plan.minimumTermMonths ?? 6 })}</p>}
        {orderUrl && <Button onClick={() => setPurchaseOpen(true)} className="mt-auto rounded-full bg-ts-gold hover:bg-ts-gold/90 text-ts-ink text-sm font-extrabold active:scale-95 transition">
          {t('home.shopBuy')}
        </Button>}
      </div>
      {purchaseOpen && <ShopPurchaseDialog product={p} onClose={() => setPurchaseOpen(false)} />}
    </div>
  );
}

export function ShopCarousel() {
  const { t, language } = useLanguage();
  const { products } = useShopProducts();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduced || paused || products.length < 2) return;
    const id = setInterval(() => {
      const el = ref.current;
      if (!el) return;
      const card = el.firstElementChild as HTMLElement | null;
      const step = (card?.offsetWidth ?? 160) + 12;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + step, behavior: 'smooth' });
    }, 3200);
    return () => clearInterval(id);
  }, [reduced, paused, products.length]);

  if (products.length === 0) return null;

  const onScroll = () => {
    const el = ref.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (el && card) setIndex(Math.round(el.scrollLeft / (card.offsetWidth + 12)));
  };

  return (
    <section className="ts-glass mt-8 rounded-[26px] p-4" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)} onTouchEnd={() => setTimeout(() => setPaused(false), 4000)}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 font-bold text-ts-ink"><img src="/icons/09-shop.svg" alt="" className="w-6 h-6 rounded-md" />{t('home.shopNew')}</h2>
        <Link to="/shop" className="text-sm font-bold text-ts-deep">{t('home.shopAll')} ›</Link>
      </div>
      <div ref={ref} onScroll={onScroll} className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-1 px-1 pb-1">
        {products.map((p) => <ShopProductCard key={p.id} p={p} compact className="snap-start shrink-0 w-[42%] sm:w-[30%] md:w-[23%]" />)}
      </div>
      <div className="flex justify-center gap-1.5 mt-3" aria-hidden>
        {products.map((p, i) => <span key={p.id} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-ts-deep' : 'w-1.5 bg-ts-muted/40'}`} />)}
      </div>
      <Button asChild variant="link" className="mt-2 text-ts-deep"><Link to="/pricing">{shopCopy[language].pricing}</Link></Button>
    </section>
  );
}
