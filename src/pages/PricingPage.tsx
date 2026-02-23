import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PricingTable } from '@/components/pricing/PricingTable';
import { FAQSchema } from '@/components/SEO';

export function PricingPage() {
  const navigate = useNavigate();

  const pricingFaqs = [
    { question: 'Kann ich jederzeit kündigen?', answer: 'Ja, du kannst dein Abo jederzeit kündigen. Bei Jahresabos läuft dein Zugang bis zum Ende der bezahlten Periode weiter.' },
    { question: 'Kann ich zwischen Plänen wechseln?', answer: 'Klar! Du kannst jederzeit upgraden. Beim Wechsel zu einem höheren Plan wird der restliche Zeitraum anteilig verrechnet.' },
    { question: 'Gibt es eine Geld-zurück-Garantie?', answer: 'Ja, innerhalb der ersten 14 Tage kannst du dein Abo ohne Angabe von Gründen kündigen und erhältst dein Geld zurück.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <FAQSchema faqs={pricingFaqs} />
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Preise & Pakete</h1>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-4xl font-bold mb-4">
          Wähle deinen Lernweg
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Ob Einsteiger oder ambitionierter Musiker – finde den Plan, der zu deinen Zielen passt.
        </p>
      </div>

      {/* Pricing Table */}
      <div className="container mx-auto px-4 pb-16">
        <PricingTable />
      </div>

      {/* FAQ or Trust Section */}
      <div className="bg-muted/50 py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">Häufige Fragen</h3>
          <div className="max-w-2xl mx-auto space-y-4 text-left">
            <div className="bg-background rounded-lg p-4">
              <h4 className="font-semibold mb-2">Kann ich jederzeit kündigen?</h4>
              <p className="text-sm text-muted-foreground">
                Ja, du kannst dein Abo jederzeit kündigen. Bei Jahresabos läuft dein Zugang bis zum Ende der bezahlten Periode weiter.
              </p>
            </div>
            <div className="bg-background rounded-lg p-4">
              <h4 className="font-semibold mb-2">Kann ich zwischen Plänen wechseln?</h4>
              <p className="text-sm text-muted-foreground">
                Klar! Du kannst jederzeit upgraden. Beim Wechsel zu einem höheren Plan wird der restliche Zeitraum anteilig verrechnet.
              </p>
            </div>
            <div className="bg-background rounded-lg p-4">
              <h4 className="font-semibold mb-2">Gibt es eine Geld-zurück-Garantie?</h4>
              <p className="text-sm text-muted-foreground">
                Ja, innerhalb der ersten 14 Tage kannst du dein Abo ohne Angabe von Gründen kündigen und erhältst dein Geld zurück.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PricingPage;
