import { useState } from 'react';
import { Check, X, Crown, Sparkles, BookOpen, MessageCircle, Music, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { PLAN_INFO, PlanKey, FEATURE_CATEGORIES } from '@/types/plans';
import { useMembership } from '@/hooks/useMembership';

interface PricingTableProps {
  onSelectPlan?: (planKey: PlanKey) => void;
}

const categoryIcons = {
  lernen: BookOpen,
  feedback: MessageCircle,
  mitspielen: Music,
  motivation: Trophy,
};

const categoryColors = {
  lernen: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  feedback: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  mitspielen: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  motivation: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
};

export function PricingTable({ onSelectPlan }: PricingTableProps) {
  const [isYearly, setIsYearly] = useState(true);
  const { planKey: currentPlan, getUpgradeLink, isLoading } = useMembership();

  const plans = [PLAN_INFO.FREE, PLAN_INFO.BASIC, PLAN_INFO.PRO];

  const handleSelectPlan = (planKey: PlanKey) => {
    if (onSelectPlan) {
      onSelectPlan(planKey);
      return;
    }
    
    const link = getUpgradeLink(planKey);
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  const getPrice = (plan: typeof PLAN_INFO.FREE) => {
    if (!plan.monthlyPrice) return 'Kostenlos';
    const price = isYearly ? Math.round(plan.yearlyPrice! / 12) : plan.monthlyPrice;
    return `${price}€`;
  };

  const getPriceSubtext = (plan: typeof PLAN_INFO.FREE) => {
    if (!plan.monthlyPrice) return 'Für immer';
    if (isYearly) {
      return `${plan.yearlyPrice}€/Jahr (spare ${plan.yearlyDiscount}%)`;
    }
    return 'pro Monat';
  };

  // Group features by category
  const featuresByCategory = Object.keys(FEATURE_CATEGORIES).map(cat => ({
    category: cat as keyof typeof FEATURE_CATEGORIES,
    ...FEATURE_CATEGORIES[cat as keyof typeof FEATURE_CATEGORIES],
    features: plans[0].features.filter(f => f.category === cat),
  }));

  return (
    <div className="w-full max-w-6xl mx-auto space-y-10">
      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 p-4 bg-card rounded-xl border">
        <Label 
          htmlFor="billing-toggle" 
          className={cn(
            'text-sm font-medium transition-colors cursor-pointer',
            !isYearly ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          Monatlich
        </Label>
        <Switch
          id="billing-toggle"
          checked={isYearly}
          onCheckedChange={setIsYearly}
        />
        <Label 
          htmlFor="billing-toggle" 
          className={cn(
            'text-sm font-medium transition-colors cursor-pointer flex items-center gap-2',
            isYearly ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          Jährlich
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">
            Spare bis zu 35%
          </Badge>
        </Label>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.key;
          const isHighlighted = plan.highlighted;
          
          return (
            <Card
              key={plan.key}
              className={cn(
                'relative flex flex-col transition-all duration-300 bg-card',
                isHighlighted && 'border-2 border-primary shadow-xl scale-[1.02]',
                isCurrentPlan && 'ring-2 ring-emerald-500'
              )}
            >
              {isHighlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground shadow-lg">
                  <Crown className="w-3 h-3 mr-1" />
                  Empfohlen
                </Badge>
              )}
              
              {isCurrentPlan && (
                <Badge className="absolute -top-3 right-4 bg-emerald-500 text-white shadow-lg">
                  Dein Plan
                </Badge>
              )}

              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl flex items-center justify-center gap-2 text-card-foreground">
                  {plan.key === 'PRO' && <Crown className="w-6 h-6 text-amber-500" />}
                  {plan.key === 'BASIC' && <Sparkles className="w-5 h-5 text-blue-500" />}
                  {plan.title}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {plan.shortDescription}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {/* Price */}
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-card-foreground">{getPrice(plan)}</div>
                  <div className="text-sm text-muted-foreground">{getPriceSubtext(plan)}</div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-6 flex-1 leading-relaxed">
                  {plan.description}
                </p>

                {/* CTA Button */}
                <Button
                  className={cn(
                    'w-full font-semibold',
                    isHighlighted && 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white',
                    isCurrentPlan && 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  )}
                  variant={isHighlighted ? 'default' : plan.key === 'FREE' ? 'outline' : 'default'}
                  disabled={isLoading || isCurrentPlan}
                  onClick={() => handleSelectPlan(plan.key)}
                >
                  {isCurrentPlan ? 'Aktueller Plan' : plan.cta}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="mt-16">
        <h3 className="text-2xl font-bold text-center mb-8 text-foreground">Funktionen im Vergleich</h3>
        
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 w-1/3 font-semibold text-foreground">Funktion</th>
                {plans.map(plan => (
                  <th key={plan.key} className="text-center p-4">
                    <span className={cn(
                      'font-bold text-foreground',
                      plan.highlighted && 'text-primary'
                    )}>
                      {plan.title}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featuresByCategory.map(category => {
                const Icon = categoryIcons[category.category];
                return (
                  <>
                    {/* Category Header */}
                    <tr key={category.category} className="border-b">
                      <td colSpan={4} className="p-0">
                        <div className={cn(
                          'flex items-center gap-2 font-semibold py-3 px-4',
                          categoryColors[category.category]
                        )}>
                          <Icon className="w-5 h-5" />
                          {category.name}
                        </div>
                      </td>
                    </tr>
                    {/* Features in this category */}
                    {category.features.map((feature, idx) => (
                      <tr 
                        key={`${category.category}-${idx}`} 
                        className="border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                      >
                        <td className="p-4 text-sm font-medium text-card-foreground">{feature.name}</td>
                        {plans.map(plan => {
                          const planFeature = plan.features.find(f => f.name === feature.name);
                          const included = planFeature?.included ?? false;
                          return (
                            <td key={plan.key} className="text-center p-4">
                              {included ? (
                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                              ) : (
                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted">
                                  <X className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}