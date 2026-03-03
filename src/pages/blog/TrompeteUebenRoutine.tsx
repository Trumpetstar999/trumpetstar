import { Link } from "react-router-dom";
import { SEOPageLayout } from "@/components/seo/SEOPageLayout";
import { AnimatedSection } from "@/components/seo/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Clock } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const slots = [
  { time: "☀️ Morgens", ideal: "Frühaufsteher", desc: "Frischer Kopf, keine Ablenkung" },
  { time: "🚆 Pendeln", ideal: "ÖPNV-Nutzer", desc: "Nur Mundstück/Buzzing — Totzeit produktiv nutzen" },
  { time: "🌤️ Mittagspause", ideal: "Büroangestellte", desc: "Konferenzraum, Auto oder Park" },
  { time: "🏠 Feierabend", ideal: "Alle", desc: "Stressabbau, Übergang zum Privaten" },
  { time: "🌙 Abend", ideal: "Eltern", desc: "Nach dem Kind ins Bett — Zeit für sich" },
];

export default function TrompeteUebenRoutine() {
  const { t } = useLanguage();
  return (
    <SEOPageLayout>
      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection direction="up">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/15">
              <Clock className="h-4 w-4" /> {t('seo_uebenRoutine.hero.badge')}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              {t('seo_uebenRoutine.hero.title')}
            </h1>
            <p className="text-white/70 text-lg mb-3">
              {t('seo_uebenRoutine.hero.subtitle')}
            </p>
            <p className="text-white/50 text-sm">{t('seo_uebenRoutine.hero.date')}</p>
          </AnimatedSection>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 pb-20 space-y-8">

        <AnimatedSection direction="up">
          <Card className="border-l-4 border-l-[hsl(var(--reward-gold))]">
            <CardContent className="p-5">
              <p className="font-bold text-sm mb-1">Das Zeit-Paradox</p>
              <p className="text-muted-foreground text-sm">Ein Student, der einmal pro Woche 2 Stunden übt, macht <em>weniger</em> Fortschritte als ein Berufstätiger mit 10 Minuten täglich. Muskeln brauchen tägliche Wiederholung, nicht wöchentliche Marathons.</p>
            </CardContent>
          </Card>
        </AnimatedSection>

        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Die 5-Minuten-Routine</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Min 0–1","Aufwärmen","Buzzing + tiefe Atemzüge"],
              ["Min 1–4","Hauptübung","Technik-Element, konzentriert"],
              ["Min 4–5","Cooldown","Lieblingston, entspannt"],
            ].map(([t, n, d], i) => (
              <AnimatedSection key={t} direction="up" delay={i * 80}>
                <Card className="text-center hover-lift">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{t}</p>
                    <p className="font-bold text-sm">{n}</p>
                    <p className="text-xs text-muted-foreground mt-1">{d}</p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">5 Übe-Slots für deinen Alltag</h2>
          <div className="space-y-3">
            {slots.map((s, i) => (
              <AnimatedSection key={s.time} direction="left" delay={i * 60}>
                <Card className="hover-lift">
                  <CardContent className="p-4 flex items-start gap-3">
                    <span className="text-2xl">{s.time.split(" ")[0]}</span>
                    <div>
                      <p className="font-semibold text-sm">{s.time.split(" ").slice(1).join(" ")}</p>
                      <p className="text-xs text-primary font-medium">{s.ideal}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Praktische Tipps</h2>
          <div className="space-y-3">
            {[
              ["Das sichtbare Instrument 👁️","Stelle die Trompete sichtbar auf — nicht im Kasten. Die Hürde zum Greifen muss minimal sein."],
              ["Die 2-Minuten-Regel ⏱️","Keine Lust? Sag dir: 'Nur 2 Minuten.' In 90% der Fälle machst du danach weiter."],
              ["Wenn du mal aussetzt 🔄","1 Tag verpasst? Kein Problem. 1 Woche? Wieder bei 5 Min starten — nie 'nachholen'."],
            ].map(([t, d]) => (
              <Card key={t}>
                <CardContent className="p-4">
                  <p className="font-semibold text-sm mb-1">{t}</p>
                  <p className="text-sm text-muted-foreground">{d}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Realistische Fortschritte</h2>
          <div className="space-y-3">
            {[
              ["Woche 1–4","Erste Töne klar, 3–5 einfache Melodien","border-l-green-400"],
              ["Monat 2–3","Erweiterter Tonumfang, erste Songs mit Begleitung","border-l-primary"],
              ["Monat 4–6","10+ Songs, eigenständiges Üben möglich","border-l-[hsl(var(--reward-gold))]"],
            ].map(([z, f, color], i) => (
              <AnimatedSection key={z} direction="left" delay={i * 80}>
                <Card className={`border-l-4 ${color}`}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--reward-gold))] shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">{z}</p>
                      <p className="text-xs text-muted-foreground">{f}</p>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection direction="up">
          <div className="glass rounded-2xl p-6 border-l-4 border-[hsl(var(--reward-gold))]">
            <blockquote className="italic text-white/80 text-sm">
              „Ich übe jeden Morgen 5 Minuten beim Kaffee. Nach 3 Monaten spiele ich für meine Enkelkinder."
            </blockquote>
            <p className="text-white/50 text-xs mt-2">— Klaus, 64</p>
          </div>
        </AnimatedSection>

        <AnimatedSection direction="up" className="glass rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">{t('seo_uebenRoutine.cta.title')}</h3>
          <p className="text-white/60 mb-6 text-sm">{t('seo_uebenRoutine.cta.subtitle')}</p>
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" asChild>
            <Link to="/auth">{t('seo_uebenRoutine.cta.button')} <ArrowRight className="ml-2 w-4 h-4" /></Link>
          </Button>
        </AnimatedSection>

        <AnimatedSection direction="fade" className="border-t border-white/10 pt-6">
          <p className="text-sm text-white/40 mb-3">Weitere Artikel:</p>
          <div className="space-y-2">
            <Link to="/blog/trompete-lernen-erwachsene" className="flex items-center gap-1 text-primary hover:underline text-sm"><CheckCircle className="w-3 h-3" /> Trompete lernen als Erwachsener: Der ultimative Guide</Link>
            <Link to="/blog/erster-ton-trompete" className="flex items-center gap-1 text-primary hover:underline text-sm"><CheckCircle className="w-3 h-3" /> Der erste Ton: Schritt-für-Schritt-Anleitung</Link>
          </div>
        </AnimatedSection>
      </div>
    </SEOPageLayout>
  );
}
