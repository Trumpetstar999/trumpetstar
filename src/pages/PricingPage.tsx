import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PricingTable } from '@/components/pricing/PricingTable';
import { FAQSchema } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';

export function PricingPage() {
  const pricingFaqs = [
    { question: 'Kann ich jederzeit kündigen?', answer: 'Ja, du kannst dein Abo jederzeit kündigen. Bei Jahresabos läuft dein Zugang bis zum Ende der bezahlten Periode weiter.' },
    { question: 'Kann ich zwischen Plänen wechseln?', answer: 'Klar! Du kannst jederzeit upgraden. Beim Wechsel zu einem höheren Plan wird der restliche Zeitraum anteilig verrechnet.' },
    { question: 'Gibt es eine Geld-zurück-Garantie?', answer: 'Ja, innerhalb der ersten 14 Tage kannst du dein Abo ohne Angabe von Gründen kündigen und erhältst dein Geld zurück.' },
  ];

  return (
    <SEOPageLayout>
      <FAQSchema faqs={pricingFaqs} />

      {/* Hero */}
      <section className="py-16 px-4 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Wähle deinen Lernweg</h1>
        <p className="text-xl text-white/70 max-w-2xl mx-auto">
          Ob Einsteiger oder ambitionierter Musiker – finde den Plan, der zu deinen Zielen passt.
        </p>
      </section>

      {/* Pricing Table */}
      <div className="container mx-auto px-4 pb-16">
        <PricingTable />
      </div>

      {/* FAQ */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Häufige Fragen</h2>
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
