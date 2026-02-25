import { Link } from "react-router-dom";
import { SEOPageLayout } from "@/components/seo/SEOPageLayout";
import { AnimatedSection } from "@/components/seo/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Users } from "lucide-react";

export default function TrompeteLernenErwachsene() {
  return (
    <SEOPageLayout>
      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection direction="up">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/15">
              <Users className="h-4 w-4" /> Anfänger-Guide
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Trompete lernen als Erwachsener: Der ultimative Guide
            </h1>
            <p className="text-white/70 text-lg mb-3">
              Warum es nie zu spät ist — und wie du mit nur 5 Minuten am Tag echte Fortschritte machst.
            </p>
            <p className="text-white/50 text-sm">25. Februar 2026 · 8 Min Lesezeit · Von Valentin | TrumpetStar</p>
          </AnimatedSection>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 pb-20 space-y-8">

        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Warum es nie zu spät ist</h2>
          <p className="text-white/70 mb-4">„Ich bin doch schon 40..." — Diesen Satz höre ich fast täglich. Und meine Antwort ist immer dieselbe: <strong className="text-white">Das ist Unsinn.</strong></p>
          <p className="text-white/70 mb-4">Als Erwachsener hast du entscheidende Vorteile gegenüber Kindern:</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              ["Disziplin", "Du weißt, dass Erfolg Übung erfordert"],
              ["Zeitmanagement", "Du kannst feste Übezeiten einplanen"],
              ["Motivation", "Du lernst aus eigenem Antrieb"],
              ["Musikalisches Verständnis", "Du hast Jahrzehnte Musik hören hinter dir"],
            ].map(([t, d], i) => (
              <AnimatedSection key={t} direction="up" delay={i * 80}>
                <Card className="hover-lift">
                  <CardContent className="p-4 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--reward-gold))] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">{t}</p>
                      <p className="text-xs text-muted-foreground">{d}</p>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
          <p className="text-white/60 text-sm mt-4 italic">Unser ältester aktiver Schüler ist 67. Er spielt jetzt seit 2 Jahren und hat gerade sein erstes Weihnachtskonzert gemeistert.</p>
        </AnimatedSection>

        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Die 5 größten Mythen</h2>
          <div className="space-y-3">
            {[
              ["Deine Lungen sind nicht gut genug", "Die Trompete braucht kein extremes Lungenvolumen — sie braucht Luftkontrolle. Und die trainierst du."],
              ["Deine Lippen werden zu schnell müde", "Normal! Mundmuskulatur muss sich aufbauen wie jeder andere Muskel. Unsere 5-Minuten-Methode ist genau dafür gemacht."],
              ["Du hast kein musikalisches Talent", "Talent ist überbewertet. Systematik schlägt Talent."],
              ["Du hast keine Zeit", "5 Minuten am Tag reichen für echte Fortschritte."],
              ["Es dauert Jahre bis du was spielst", "Nach 30 Tagen kannst du 3–4 einfache Melodien spielen."],
            ].map(([m, f]) => (
              <Card key={m}>
                <CardContent className="p-4">
                  <p className="font-semibold text-sm text-destructive">❌ Mythos: {m}</p>
                  <p className="text-sm text-muted-foreground mt-1">✅ {f}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Die TrumpetStar-Methode: 5-Minuten-Prinzip</h2>
          <p className="text-white/70 mb-4">Die meisten Erwachsenen scheitern nicht am Können, sondern am Übermut. Sie üben eine Stunde am ersten Tag, haben Muskelkater in den Lippen und hören auf.</p>
          <p className="text-white/70 mb-4">Unsere Lösung: <strong className="text-white">Mikro-Übungen</strong></p>
          <div className="grid grid-cols-3 gap-3">
            {[["Tag 1–7","2–5 Min täglich"],["Woche 2–4","5–10 Min täglich"],["Ab Monat 2","15–20 Min täglich"]].map(([z,d]) => (
              <Card key={z} className="text-center">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{z}</p>
                  <p className="font-bold text-sm">{d}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Deine erste Woche: Der Plan</h2>
          <div className="space-y-2">
            {[["1","Buzzing (nur Lippen)","2 Min"],["2–3","Mundstück-Training","3 Min"],["4–7","Erste Töne am Instrument","5 Min"]].map(([d, u, z], i) => (
              <AnimatedSection key={d} direction="left" delay={i * 80}>
                <Card className={`border-l-4 ${i === 0 ? 'border-l-green-400' : i === 1 ? 'border-l-primary' : 'border-l-[hsl(var(--reward-gold))]'}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">Tag {d}: {u}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{z}</span>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection direction="up" className="glass rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Starte jetzt deine 7-Tage-Challenge 🎺</h3>
          <p className="text-white/60 mb-6 text-sm">Kostenlos · 5 Min/Tag · Erster Ton in Woche 1</p>
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" asChild>
            <Link to="/auth">Jetzt kostenlos anmelden <ArrowRight className="ml-2 w-4 h-4" /></Link>
          </Button>
        </AnimatedSection>

        <AnimatedSection direction="fade" className="border-t border-white/10 pt-6">
          <p className="text-sm text-white/40 mb-3">Weitere Artikel:</p>
          <div className="space-y-2">
            <Link to="/blog/erster-ton-trompete" className="flex items-center gap-1 text-primary hover:underline text-sm"><CheckCircle className="w-3 h-3" /> Der erste Ton: Schritt-für-Schritt-Anleitung</Link>
            <Link to="/blog/trompete-ueben-routine" className="flex items-center gap-1 text-primary hover:underline text-sm"><CheckCircle className="w-3 h-3" /> Die optimale Übe-Routine für Berufstätige</Link>
          </div>
        </AnimatedSection>
      </div>
    </SEOPageLayout>
  );
}
