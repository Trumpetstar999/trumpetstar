import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PricingTable } from '@/components/pricing/PricingTable';
import { FAQSchema } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { useLanguage } from '@/hooks/useLanguage';

export function PricingPage() {
  const { t } = useLanguage();

  const pricingFaqs = [
    { question: t('pricing.faq.q1'), answer: t('pricing.faq.a1') },
    { question: t('pricing.faq.q2'), answer: t('pricing.faq.a2') },
    { question: t('pricing.faq.q3'), answer: t('pricing.faq.a3') },
  ];

  return (
    <SEOPageLayout>
      <FAQSchema faqs={pricingFaqs} />

      {/* Hero */}
      <section className="py-16 px-4 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">{t('pricing.hero.title')}</h1>
        <p className="text-xl text-white/70 max-w-2xl mx-auto">
          {t('pricing.hero.subtitle')}
        </p>
      </section>

      {/* Pricing Table */}
      <div className="container mx-auto px-4 pb-16">
        <PricingTable />
      </div>

      {/* FAQ */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">{t('pricing.faq.title')}</h2>
          <div className="space-y-3">
            {pricingFaqs.map((faq, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2 text-sm">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </SEOPageLayout>
  );
}

export default PricingPage;
