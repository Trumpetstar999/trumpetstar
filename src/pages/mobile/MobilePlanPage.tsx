import { useState } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useMembership } from '@/hooks/useMembership';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlanKey, PLAN_INFO } from '@/types/plans';
import { toast } from 'sonner';

const TEXTS = {
  de: {
    title: 'Dein Plan',
    currentPlan: 'Aktueller Plan',
    freeCta: 'Kostenlos starten',
    basicCta: 'BASIC freischalten',
    proCta: 'PRO freischalten',
    refreshAccess: 'Zugriff aktualisieren',
    refreshing: 'Aktualisiere...',
    refreshed: 'Plan aktualisiert!',
    hint: 'Die Lernwelt nutzt du am besten auf iPad/Tablet im Querformat.',
    freeDesc: 'Freie Inhalte',
    basicDesc: 'Alle Videos + Noten/PDF-Features + Übesessions (auf iPad/Tablet)',
    proDesc: 'Persönliches Feedback + Lehrerchat + Klassenzimmer (auf iPad/Tablet)',
    proPromo: '🎉 Erster Monat nur 1€',
    perMonth: '/Monat',
    free: 'Kostenlos',
  },
  en: {
    title: 'Your Plan',
    currentPlan: 'Current Plan',
    freeCta: 'Start free',
    basicCta: 'Unlock BASIC',
    proCta: 'Unlock PRO',
    refreshAccess: 'Refresh access',
    refreshing: 'Refreshing...',
    refreshed: 'Plan updated!',
    hint: 'The learning experience works best on iPad/tablet in landscape mode.',
    freeDesc: 'Free content',
    basicDesc: 'All videos + sheet music/PDF features + practice sessions (on iPad/Tablet)',
    proDesc: 'Personal feedback + teacher chat + classroom (on iPad/Tablet)',
    proPromo: '🎉 First month only €1',
    perMonth: '/month',
    free: 'Free',
  },
  es: {
    title: 'Tu Plan',
    currentPlan: 'Plan actual',
    freeCta: 'Empezar gratis',
    basicCta: 'Desbloquear BASIC',
    proCta: 'Desbloquear PRO',
    refreshAccess: 'Actualizar acceso',
    refreshing: 'Actualizando...',
    refreshed: '¡Plan actualizado!',
    hint: 'La experiencia de aprendizaje funciona mejor en iPad/tablet en horizontal.',
    freeDesc: 'Contenido gratuito',
    basicDesc: 'Todos los videos + partituras/PDF + sesiones de práctica (en iPad/Tablet)',
    proDesc: 'Feedback personal + chat con profesor + aula (en iPad/Tablet)',
    proPromo: '🎉 Primer mes solo 1€',
    perMonth: '/mes',
    free: 'Gratis',
  },
};

const CHECKOUT_URLS: Partial<Record<PlanKey, string>> = {
  BASIC: 'https://www.checkout-ds24.com/product/346007/',
  PRO: 'https://www.checkout-ds24.com/product/575565/',
};

export default function MobilePlanPage() {
  const { planKey, getUpgradeLink, refreshMembership, isLoading } = useMembership();
  const { language } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const t = TEXTS[language] || TEXTS.de;

  const handleUpgrade = (key: PlanKey) => {
    const link = getUpgradeLink(key) || CHECKOUT_URLS[key];
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshMembership();
      toast.success(t.refreshed);
    } finally {
      setIsRefreshing(false);
    }
  };

  const plans: { key: PlanKey; icon: typeof Crown; desc: string; price: string; cta: string; highlighted?: boolean }[] = [
    { key: 'FREE', icon: Sparkles, desc: t.freeDesc, price: t.free, cta: t.freeCta },
    { key: 'BASIC', icon: Sparkles, desc: t.basicDesc, price: `${PLAN_INFO.BASIC.monthlyPrice}€${t.perMonth}`, cta: t.basicCta },
    { key: 'PRO', icon: Crown, desc: t.proDesc, price: `${PLAN_INFO.PRO.monthlyPrice}€${t.perMonth}`, cta: t.proCta, highlighted: true },
  ];

  return (
    <MobileLayout>
      <div className="px-5 py-6 space-y-5">
        <h1 className="text-2xl font-bold text-white">{t.title}</h1>

        {plans.map((plan) => {
          const isCurrent = planKey === plan.key;
          const Icon = plan.icon;

          return (
            <Card
              key={plan.key}
              className={cn(
                'border-0 shadow-lg transition-all',
                plan.highlighted && 'ring-2 ring-amber-400'
              )}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={cn(
                      'w-5 h-5',
                      plan.key === 'PRO' ? 'text-amber-500' : 'text-primary'
                    )} />
                    <span className="font-bold text-slate-900 text-lg">{plan.key}</span>
                  </div>
                  {isCurrent && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      {t.currentPlan}
                    </Badge>
                  )}
                </div>

                <p className="text-slate-600 text-sm">{plan.desc}</p>

                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900">{plan.price}</span>
                </div>

                {plan.key === 'PRO' && (
                  <div className="bg-amber-50 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full inline-block">
                    {t.proPromo}
                  </div>
                )}

                {!isCurrent && plan.key !== 'FREE' && (
                  <Button
                    className={cn(
                      'w-full h-12 font-semibold',
                      plan.highlighted
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                        : ''
                    )}
                    onClick={() => handleUpgrade(plan.key)}
                  >
                    {plan.cta}
                  </Button>
                )}

                {isCurrent && (
                  <div className="flex items-center justify-center text-sm text-emerald-600 font-medium gap-1.5">
                    <Check className="w-4 h-4" />
                    {t.currentPlan}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Refresh Button */}
        <Button
          variant="outline"
          className="w-full h-12 border-white/20 text-white hover:bg-white/10"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {isRefreshing ? t.refreshing : t.refreshAccess}
        </Button>

        {/* Hint */}
        <p className="text-white/50 text-xs text-center leading-relaxed px-4">
          {t.hint}
        </p>
      </div>
    </MobileLayout>
  );
}
