import { Link } from "react-router-dom";
import { SEOPageLayout } from "@/components/seo/SEOPageLayout";
import { AnimatedSection } from "@/components/seo/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Music } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export default function ErsterTonTrompete() {
  const { t, language } = useLanguage();
  return (
    <SEOPageLayout>
      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection direction="up">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/15">
              <Music className="h-4 w-4" /> Tutorial
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              {t('seo_ersterTon.hero.title')}
            </h1>
            <p className="text-white/70 text-lg mb-3">
              {t('seo_ersterTon.hero.subtitle')}
            </p>
            <p className="text-white/50 text-sm">25. Februar 2026 · 6 Min Lesezeit · Von Valentin | TrumpetStar</p>
            {language !== 'de' && (
              <p className="text-white/40 text-xs italic mt-3">{t('common.articleInGerman')}</p>
            )}
          </AnimatedSection>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 pb-20 space-y-8">

        <AnimatedSection direction="up">
          <Card className="border-l-4 border-l-[hsl(var(--reward-gold))]">
            <CardContent className="p-5">
              <p className="text-sm font-medium flex items-start gap-2">
                <span className="text-[hsl(var(--reward-gold))] text-lg">💡</span>
                Lass dich nicht entmutigen — die meisten brauchen 3–7 Tage, bis ein klarer Ton entsteht. Das ist völlig normal.
              </p>
            </CardContent>
          </Card>
        </AnimatedSection>

        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Phase 1: Buzzing (Tag 1–2)</h2>
          <p className="text-white/70 mb-4">Buzzing ist das Vibrieren deiner Lippen beim Blasen. Das ist die absolute Basis alles Trompetenspiels.</p>
          <Card>
            <CardContent className="p-5">
              <p className="font-semibold mb-3">Übung: Lippen-Vibration</p>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
                <li><strong>Lippen leicht zusammenpressen</strong> — nicht zu fest, nicht zu locker</li>
                <li><strong>Luft blasen</strong> — langsam, kontrolliert</li>
                <li><strong>Vibration spüren</strong> — ein „brrrr"-Gefühl in den Lippen</li>
                <li><strong>2 Minuten üben</strong> — mehr nicht!</li>
              </ol>
            </CardContent>
          </Card>
          <div className="mt-4 space-y-1 text-sm text-white/60">
            <p>❌ Zu viel Druck (Lippen werden weiß)</p>
            <p>❌ Zu wenig Druck (Luft entweicht pfeifend)</p>
            <p>❌ Lippen nicht leicht nach innen gerollt</p>
          </div>
        </AnimatedSection>

        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-3">Phase 2: Mundstück-Training (Tag 3–4)</h2>
          <p className="text-white/70">Mit Mundstück wirst du plötzlich Töne hören. Nicht perfekt, nicht klar, aber hörbar. Das ist dein erster Erfolg!</p>
          <p className="text-white/70 mt-2"><strong className="text-white">Ziel:</strong> Ein durchgehender Ton für 3 Sekunden.</p>
        </AnimatedSection>

        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-3">Phase 3: Die Trompete (Tag 5–7)</h2>
          <p className="text-white/70">Spiele genau wie beim Mundstück-Training. Nicht anders atmen, nicht mehr Druck. <strong className="text-white">Vertrau der Physik</strong> — die Trompete verstärkt nur, was deine Lippen tun.</p>
        </AnimatedSection>

        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Tagesplan: Woche 1</h2>
          <div className="space-y-2">
            {[
              ["1","Buzzing ohne Instrument","Lippen vibrieren lassen"],
              ["2","Buzzing vertiefen","Konstantes Brrrr"],
              ["3","Mundstück ansetzen","Erster Ton hörbar"],
              ["4","Mundstück halten","3-Sekunden-Ton"],
              ["5","Trompete + Buzzing","Erster Ton am Instrument"],
              ["6","Ton halten","5-Sekunden-Ton klar"],
              ["7","Mehrere Versuche","3x hintereinander reproduzierbar"],
            ].map(([d, u, z], i) => (
              <AnimatedSection key={d} direction="left" delay={i * 50}>
                <Card>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {d}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{u}</p>
                      <p className="text-xs text-muted-foreground">{z}</p>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Troubleshooting</h2>
          <div className="space-y-3">
            {[
              ["Es kommt gar kein Ton", "Mehr Buzzing-Übungen ohne Instrument."],
              ["Es klingt gepresst und hoch", "Weniger Druck, entspannter blasen. Wie Seifenblasen pusten."],
              ["Meine Lippen tun weh", "Normal! 2–3 Tage Pause, dann mit kürzeren Einheiten weiter."],
              ["Ich bekomme Schwindel", "Zu viel Druck. Blase weniger kräftig, atme zwischendurch normal."],
            ].map(([p, l]) => (
              <Card key={p}>
                <CardContent className="p-4">
                  <p className="font-semibold text-sm">❓ „{p}"</p>
                  <p className="text-sm text-muted-foreground mt-1">→ {l}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection direction="up" className="glass rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">{t('landing.capture.title')} 🎺</h3>
          <p className="text-white/60 mb-6 text-sm">{t('landing.capture.subtitle')}</p>
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" asChild>
            <Link to="/auth">{t('landing.hero.ctaStart')} <ArrowRight className="ml-2 w-4 h-4" /></Link>
          </Button>
        </AnimatedSection>

        <AnimatedSection direction="fade" className="border-t border-white/10 pt-6">
          <p className="text-sm text-white/40 mb-3">Weitere Artikel:</p>
          <div className="space-y-2">
            <Link to="/blog/trompete-lernen-erwachsene" className="flex items-center gap-1 text-primary hover:underline text-sm"><CheckCircle className="w-3 h-3" /> Trompete lernen als Erwachsener: Der ultimative Guide</Link>
            <Link to="/blog/trompete-ueben-routine" className="flex items-center gap-1 text-primary hover:underline text-sm"><CheckCircle className="w-3 h-3" /> Die optimale Übe-Routine für Berufstätige</Link>
          </div>
        </AnimatedSection>
      </div>
    </SEOPageLayout>
  );
}
