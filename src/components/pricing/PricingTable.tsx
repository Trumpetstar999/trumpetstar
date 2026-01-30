import { useState } from 'react';
import { Check, X, Crown, Sparkles, BookOpen, MessageCircle, Music, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { PLAN_INFO, PlanKey, FEATURE_CATEGORIES, PlanFeature } from '@/types/plans';
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

  // Get unique features across all plans for comparison
  const allFeatures = plans[0].features.map(f => f.name);
  
  // Group features by category
  const featuresByCategory = Object.keys(FEATURE_CATEGORIES).map(cat => ({
    category: cat as keyof typeof FEATURE_CATEGORIES,
    ...FEATURE_CATEGORIES[cat as keyof typeof FEATURE_CATEGORIES],
    features: plans[0].features.filter(f => f.category === cat),
  }));

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <Label htmlFor="billing-toggle" className={cn(!isYearly && 'font-semibold')}>
          Monatlich
        </Label>
        <Switch
          id="billing-toggle"
          checked={isYearly}
          onCheckedChange={setIsYearly}
        />
        <Label htmlFor="billing-toggle" className={cn(isYearly && 'font-semibold')}>
          Jährlich
          <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
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
                'relative flex flex-col transition-all',
                isHighlighted && 'border-2 border-primary shadow-lg scale-[1.02]',
                isCurrentPlan && 'ring-2 ring-green-500'
              )}
            >
              {isHighlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  <Crown className="w-3 h-3 mr-1" />
                  Empfohlen
                </Badge>
              )}
              
              {isCurrentPlan && (
                <Badge className="absolute -top-3 right-4 bg-green-500">
                  Dein Plan
                </Badge>
              )}

              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl flex items-center justify-center gap-2">
                  {plan.key === 'PRO' && <Crown className="w-6 h-6 text-amber-500" />}
                  {plan.key === 'BASIC' && <Sparkles className="w-5 h-5 text-blue-500" />}
                  {plan.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {plan.shortDescription}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {/* Price */}
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold">{getPrice(plan)}</div>
                  <div className="text-sm text-muted-foreground">{getPriceSubtext(plan)}</div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-6 flex-1">
                  {plan.description}
                </p>

                {/* CTA Button */}
                <Button
                  className={cn(
                    'w-full',
                    isHighlighted && 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
                    isCurrentPlan && 'bg-green-500 hover:bg-green-600'
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
      <div className="mt-12">
        <h3 className="text-2xl font-bold text-center mb-8">Funktionen im Vergleich</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2">
                <th className="text-left p-4 w-1/3">Funktion</th>
                {plans.map(plan => (
                  <th key={plan.key} className="text-center p-4">
                    <span className={cn(
                      'font-bold',
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
                    <tr key={category.category} className="bg-muted/50">
                      <td colSpan={4} className="p-3">
                        <div className={cn('flex items-center gap-2 font-semibold', category.color)}>
                          <Icon className="w-5 h-5" />
                          {category.name}
                        </div>
                      </td>
                    </tr>
                    {/* Features in this category */}
                    {category.features.map((feature, idx) => (
                      <tr key={`${category.category}-${idx}`} className="border-b hover:bg-muted/30">
                        <td className="p-4 text-sm">{feature.name}</td>
                        {plans.map(plan => {
                          const planFeature = plan.features.find(f => f.name === feature.name);
                          const included = planFeature?.included ?? false;
                          return (
                            <td key={plan.key} className="text-center p-4">
                              {included ? (
                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
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
