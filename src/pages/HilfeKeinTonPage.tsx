import { FAQSchema } from "@/components/SEO/FAQSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle, Wrench, ArrowRight, Video } from "lucide-react";
import { SEOPageLayout } from "@/components/seo/SEOPageLayout";
import { AnimatedSection } from "@/components/seo/AnimatedSection";

const faqs = [
  { question: "Warum kommt bei meiner Trompete kein Ton?", answer: "Häufigste Ursachen: 1) Zu festes Drücken, 2) Zu wenig Luftdruck, 3) Lippen nicht geschlossen genug, 4) Falsche Mundstück-Position." },
  { question: "Nur Luftgeräusche, aber kein Ton – was tun?", answer: "Lippen vibrieren nicht richtig. Mehr Lippenspannung, kräftigerer Luftstoß, oder 'Mmmh'-Position üben." },
  { question: "Der Ton bricht immer wieder ab – warum?", answer: "Zu wenig Atemluft, ungleichmäßiger Luftstrom oder nachlassende Lippenspannung. Lange Töne üben!" },
  { question: "Schon Tage geübt, immer noch kein Ton – normal?", answer: "Ungewöhnlich, aber nicht unmöglich. Mögliche Gründe: Instrumentendefekt, zu hohe Ansprüche, psychischer Druck." },
  { question: "Könnte das Instrument defekt sein?", answer: "Möglich, aber selten. Prüfen: Ventile richtig? Keine Löcher? Mundstück eingesteckt? Wasser abgelassen?" }
];

const checkliste = [
  "Mundstück richtig eingesteckt (nicht zu fest)?",
  "Ventile alle in richtiger Position?",
  "Wasser/Speichel abgelassen?",
  "Lippen entspannt (nicht angespannt vom Üben)?",
  "Tief genug eingeatmet (Bauch, nicht Brust)?",
];

export default function HilfeKeinTonPage() {
  return (
    <SEOPageLayout>
      <FAQSchema faqs={faqs} />

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedSection direction="up">
            <div className="inline-flex items-center gap-2 bg-[hsl(var(--accent-red))]/15 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-[hsl(var(--accent-red))]/30">
              <AlertCircle className="h-4 w-4 text-[hsl(var(--accent-red))]" />
              Problem-Lösung
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Trompete macht keinen Ton?<br />
              <span className="text-[hsl(var(--accent-red))]">So lösen Sie das Problem</span>
            </h1>
            <p className="text-xl text-white/75 mb-8 max-w-2xl mx-auto">
              Keine Panik! Fast immer liegt es an kleinen, leicht korrigierbaren Fehlern. Diese Checkliste hilft in Minuten.
            </p>
          </AnimatedSection>

          <AnimatedSection direction="up" delay={150}>
            <div className="glass rounded-2xl p-6 max-w-2xl mx-auto mb-8 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-[hsl(var(--reward-gold))] flex-shrink-0 mt-1" />
                <p className="text-white">
                  <strong>Gute Nachrichten:</strong> 95% der "kein Ton"-Probleme liegen am Ansatz – nicht am Instrument. In 10 Minuten können wir das fixen.
                </p>
              </div>
            </div>
          </AnimatedSection>
          
          <AnimatedSection direction="up" delay={300}>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-[hsl(var(--accent-red))] hover:bg-[hsl(var(--accent-red))]/90 text-white font-semibold" asChild>
                <a href="https://www.checkout-ds24.com/product/575565/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2"><Video className="h-4 w-4" /> Video-Support starten & buchen</a>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                <Link to="/trompete-erster-ton">Zurück zur Anleitung</Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 pb-16">

        {/* Schnell-Checkliste */}
        <AnimatedSection direction="up" className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">🔍 Schnell-Checkliste</h2>
          <div className="glass rounded-2xl p-6">
            <p className="text-white/70 mb-4 text-sm">Arbeiten Sie diese Punkte der Reihe nach ab:</p>
            <ol className="space-y-3">
              {checkliste.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold">
                    {idx + 1}
                  </div>
                  <span className="text-white/85 text-sm">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </AnimatedSection>

        {/* Top 3 Ursachen */}
        <AnimatedSection direction="up" className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Die 3 häufigsten Ursachen</h2>
          <div className="space-y-4">
            {[
              { num: "1", color: "border-l-[hsl(var(--accent-red))]", numBg: "bg-[hsl(var(--accent-red))]/15 text-[hsl(var(--accent-red))]", title: "Zu festes Drücken", desc: "Die Lippen müssen vibrieren können. Bei zu viel Druck erstarren sie.", fix: "Mundstück lockerer halten. Üben Sie das Buzzing ohne Instrument." },
              { num: "2", color: "border-l-[hsl(var(--reward-gold))]", numBg: "bg-[hsl(var(--reward-gold))]/15 text-[hsl(var(--reward-gold))]", title: "Zu wenig Luftdruck", desc: "Vorsichtig pusten funktioniert nicht. Die Trompete braucht einen kräftigen Luftstoß.", fix: "Vorstellen, Sie wollen eine Kerze 1 Meter weit wegpusten – stoßartig!" },
              { num: "3", color: "border-l-primary", numBg: "bg-primary/15 text-primary", title: "Lippen nicht geschlossen genug", desc: "Offene Lippen = Luft entweicht, keine Vibration.", fix: "Machen Sie den 'Mmmh'-Laut. Genau diese Lippenposition brauchen Sie." },
            ].map((item, i) => (
              <AnimatedSection key={i} direction="left" delay={i * 100}>
                <Card className={`${item.color} border-l-4 hover-lift`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${item.numBg} flex items-center justify-center font-bold`}>{item.num}</div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                        <p className="text-muted-foreground text-sm mb-3">{item.desc}</p>
                        <div className="bg-primary/5 p-3 rounded-lg">
                          <p className="text-sm"><strong>Lösung:</strong> {item.fix}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </AnimatedSection>

        {/* Diagnose */}
        <AnimatedSection direction="up" className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Selbst-Diagnose: Was hören Sie?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { emoji: "🔇", title: "Gar nichts – totale Stille", desc: "→ Wahrscheinlich zu festes Drücken oder falsche Position." },
              { emoji: "💨", title: "Nur Luftgeräusche", desc: "→ Lippen vibrieren nicht. Mehr Spannung, kräftigerer Luftstoß." },
              { emoji: "🎺", title: "Ton bricht ab", desc: "→ Zu wenig Luft oder nachlassende Spannung. Lange Töne üben!" },
              { emoji: "🦆", title: "Enten-quacken", desc: "→ Fast ein Ton! Etwas mehr Luft und Spannung – dann wird's!" },
            ].map((item, i) => (
              <AnimatedSection key={i} direction="up" delay={i * 80}>
                <Card className="hover-lift">
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-1 text-sm">{item.emoji} {item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </AnimatedSection>

        {/* Soforthilfe */}
        <AnimatedSection direction="up" className="mb-16">
          <div className="glass-strong rounded-2xl p-8 text-center border border-[hsl(var(--accent-red))]/20">
            <Wrench className="h-12 w-12 mx-auto mb-4 text-[hsl(var(--accent-red))]" />
            <h2 className="text-2xl font-bold text-white mb-4">Kommen Sie nicht weiter?</h2>
            <p className="mb-6 text-white/70">
              Per Video-Call können wir Ihren Ansatz direkt korrigieren – oft in wenigen Minuten.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" asChild>
                <a href="https://www.checkout-ds24.com/product/575565/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2"><Video className="h-4 w-4" /> Video-Support starten & buchen</a>
              </Button>
            </div>
          </div>
        </AnimatedSection>

        {/* FAQ */}
        <AnimatedSection direction="up" className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Häufige Fragen</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2 text-sm">{faq.question}</h3>
                  <p className="text-muted-foreground text-sm">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </AnimatedSection>

        {/* Verwandte Themen */}
        <AnimatedSection direction="up" className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Das könnte auch helfen</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="hover-lift">
              <CardContent className="p-5">
                <h3 className="font-semibold mb-1 text-sm">📖 Erster Ton Anleitung</h3>
                <p className="text-xs text-muted-foreground mb-3">Die komplette Schritt-für-Schritt-Anleitung.</p>
                <Link to="/trompete-erster-ton" className="text-primary hover:underline text-sm">Zur Anleitung →</Link>
              </CardContent>
            </Card>
            <Card className="hover-lift">
              <CardContent className="p-5">
                <h3 className="font-semibold mb-1 text-sm">🎯 Ansatz & Atmung</h3>
                <p className="text-xs text-muted-foreground mb-3">Lernen Sie den korrekten Ansatz.</p>
                <Link to="/trompete-ansatz-atmung" className="text-primary hover:underline text-sm">Technik-Guide →</Link>
              </CardContent>
            </Card>
          </div>
        </AnimatedSection>

        {/* Zusammenfassung */}
        <AnimatedSection direction="up" className="mb-8">
          <div className="glass rounded-2xl p-6 border border-[hsl(var(--reward-gold))]/20">
            <h2 className="text-2xl font-bold text-white mb-4">Merken Sie sich</h2>
            <ul className="space-y-2">
              {[
                "95% der Probleme liegen am Ansatz, nicht am Instrument",
                "Zu fest drücken ist der häufigste Fehler",
                "Buzzing ohne Instrument ist die beste Lösung",
                "Video-Support kann in Minuten helfen",
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-[hsl(var(--reward-gold))] flex-shrink-0 mt-0.5" />
                  <span className="text-white/85 text-sm">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </AnimatedSection>
      </div>
    </SEOPageLayout>
  );
}
