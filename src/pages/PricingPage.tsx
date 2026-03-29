import { PricingTable } from '@/components/pricing/PricingTable';
import { FAQSchema } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { useLanguage } from '@/hooks/useLanguage';
import { ShieldCheck, Star, Users, Quote } from 'lucide-react';

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

      {/* Guarantee Banner */}
      <section className="px-4 pb-10">
        <div className="max-w-3xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-400/40 bg-gradient-to-r from-emerald-500/20 via-emerald-400/10 to-emerald-500/20 backdrop-blur-sm p-6 md:p-8 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-400/10 to-transparent" />
            <div className="relative z-10 flex flex-col items-center gap-3">
              <ShieldCheck className="w-12 h-12 text-emerald-400" />
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                30 Tage Geld-zurück-Garantie
              </h2>
              <p className="text-white/70 max-w-lg text-sm md:text-base">
                Teste Trumpetstar risikofrei. Wenn du nicht zufrieden bist, erhältst du innerhalb von 30 Tagen dein Geld zurück — ohne Wenn und Aber.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Table */}
      <div className="container mx-auto px-4 pb-16">
        <PricingTable />
      </div>

      {/* Social Proof Section */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-12">
            <div className="flex items-center gap-3 text-white">
              <Users className="w-6 h-6 text-primary" />
              <span className="text-lg font-semibold">500+ Schüler:innen in DACH</span>
            </div>
            <div className="flex items-center gap-2 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400" />
              ))}
              <span className="text-white/70 text-sm ml-1">Höchste Bewertungen</span>
            </div>
          </div>

          {/* Video Testimonial */}
          <div className="max-w-2xl mx-auto mb-12">
            <h3 className="text-xl font-bold text-white text-center mb-6">
              Was unsere Schüler:innen sagen
            </h3>
            <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10 aspect-video">
              <iframe
                src="https://player.vimeo.com/video/1150310181?badge=0&autopause=0&player_id=0"
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Trumpetstar Testimonial"
              />
            </div>
          </div>

          {/* Text Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-6">
                <Quote className="w-6 h-6 text-primary/60 mb-3" />
                <p className="text-white/80 text-sm italic mb-4">
                  „Mein Sohn hat in 3 Monaten mehr gelernt als in einem Jahr Musikschule. Die Videos sind super erklärt und das Übungsspiel motiviert enorm!"
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">SK</div>
                  <div>
                    <p className="text-white text-sm font-semibold">Sandra K.</p>
                    <p className="text-white/50 text-xs">Mutter, Wien</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-6">
                <Quote className="w-6 h-6 text-primary/60 mb-3" />
                <p className="text-white/80 text-sm italic mb-4">
                  „Als Erwachsener Wiedereinsteiger genau das Richtige. Ich kann in meinem Tempo lernen, und die Feedback-Funktion vom Lehrer ist Gold wert."
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">MH</div>
                  <div>
                    <p className="text-white text-sm font-semibold">Markus H.</p>
                    <p className="text-white/50 text-xs">Wiedereinsteiger, München</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

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
