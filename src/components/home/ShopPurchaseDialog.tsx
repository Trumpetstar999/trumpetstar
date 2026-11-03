import { useState } from 'react';
import { ShoppingBag, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlanTerms } from '@/components/pricing/PlanTerms';
import { useLanguage } from '@/hooks/useLanguage';
import { formatPrice, shopCheckoutUrl, type ShopProduct } from '@/lib/shop';
import { getCheckoutUrl, type BillingPeriod } from '@/lib/checkout';
import { PLAN_INFO } from '@/types/plans';

export function ShopPurchaseDialog({ product, onClose }: { product: ShopProduct | null; onClose: () => void }) {
  const { t, language } = useLanguage();
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  if (!product) return null;
  const planKey = product.id === '575565' ? 'PRO' : product.id === '346007' ? 'BASIC' : null;
  const plan = planKey ? PLAN_INFO[planKey] : null;
  const amount = plan ? period === 'yearly' ? plan.yearlyPrice ?? null : plan.introductoryPrice ?? plan.monthlyPrice ?? null : product.price;
  const checkout = planKey ? getCheckoutUrl(planKey, period) : shopCheckoutUrl(product);
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="ts-light-module w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-lg bg-ts-card text-ts-ink border-ts-line">
        <DialogTitle className="pr-8 leading-snug tracking-normal break-words">{product.name}</DialogTitle>
        <DialogDescription className="sr-only">{product.name}</DialogDescription>
        <img src={product.image_url || '/logo_trumpetstar.png'} alt={product.name} className="mx-auto w-full h-52 object-contain" />
        {planKey && <>
          <p className="text-sm leading-relaxed">{t(`pricing_table.planCopy.${planKey}.description`)}</p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label={t('pricing_table.monthly') + ' / ' + t('pricing_table.yearly')}>
            {(['monthly', 'yearly'] as const).map((value) => <Button key={value} variant="outline" aria-pressed={period === value} onClick={() => setPeriod(value)} className={period === value ? 'bg-ts-deep text-ts-on hover:bg-ts-deep/90 hover:text-ts-on border-ts-deep' : 'bg-ts-card text-ts-ink border-ts-line'}>{t(`pricing_table.${value}`)}</Button>)}
          </div>
        </>}
        <div>
          <p className="text-2xl font-bold tabular-nums">{formatPrice(amount, product.currency, language)}{plan && <span className="ml-1 text-sm font-normal">{t(period === 'yearly' ? 'pricing_table.perYear' : 'pricing_table.perMonth')}</span>}</p>
          {planKey && <PlanTerms planKey={planKey} period={period} />}
        </div>
        {checkout ? <Button asChild className="w-full bg-ts-gold hover:bg-ts-gold/90 text-ts-ink font-bold gap-2">
          <a href={checkout} target="_blank" rel="noopener noreferrer"><ShoppingBag className="h-4 w-4" />{t('home.shopBuy')}<ExternalLink className="h-4 w-4" /></a>
        </Button> : <Button disabled>{t('pricing_table.unavailable')}</Button>}
      </DialogContent>
    </Dialog>
  );
}