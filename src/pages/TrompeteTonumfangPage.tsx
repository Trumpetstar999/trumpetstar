import { HowToSchema } from "@/components/SEO/HowToSchema";
import { FAQSchema } from "@/components/SEO/FAQSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowUp, AlertTriangle, CheckCircle, Activity, PlayCircle, ArrowRight } from "lucide-react";
import { SEOPageLayout } from "@/components/seo/SEOPageLayout";

const howToSteps = [
  { position: 1, name: "Grundlage: Feste Töne stabilisieren", text: "Bevor Sie höher spielen können, müssen die mittleren Töne (c'-g') absolut stabil sitzen. Üben Sie lange Töne: 10 Sekunden halten, gleichmäßig, klar, ohne Zittern. Erst dann weiter nach oben.", image: "https://trumpetstar.com/images/stable-tones.jpg" },
  { position: 2, name: "Lippen-Attack-Übung", text: "Spielen Sie einzelne Töne (nur Ansatz, keine Zunge) im mittleren Register. Ziel: Sauberer Start ohne 'Puff' oder Zögern. Wechseln Sie langsam zwischen benachbarten Tönen.", image: "https://trumpetstar.com/images/lip-attack.jpg" },
  { position: 3, name: "Gleitende Übergänge (Glissando)", text: "Gleiten Sie langsam von einem tiefen Ton (z.B. c') zu einem höheren (z.B. g') und zurück. OHNE Ventile! Nur mit Lippenspannung und Luft. Das trainiert die Feinmotorik.", image: "https://trumpetstar.com/images/glissando.jpg" },
  { position: 4, name: "Erste Überblastechnik", text: "Spielen Sie c', dann überblasen Sie zum g' (gleiches Ventil, höhere Schwingung). Die Übung: c' → g' → c', langsam und kontrolliert. Wichtig: Gleiche Lautstärke, gleiche Anstrengung!", image: "https://trumpetstar.com/images/overblow.jpg" },
  { position: 5, name: "Chromatischer Aufstieg", text: "Spielen Sie chromatisch aufwärts (Halbtonschritte) bis zu Ihrer aktuellen Grenze. Halten Sie den höchsten Ton 3 Sekunden, dann zurück. Jeden Tag eine kleine Steigerung versuchen (nur wenn es locker geht!).", image: "https://trumpetstar.com/images/chromatic.jpg" },
];

const faqs = [
  { question: "Wie lange dauert es, den Tonumfang zu erweitern?", answer: "Realistisch: 3-6 Monate für eine Quinte (z.B. von c' bis g'). Viel schneller geht es nicht, da die Lippenmuskulatur Zeit zum Aufbau braucht. Geduld ist entscheidend!" },
  { question: "Meine Lippen werden beim hohen Spielen schnell müde – normal?", answer: "Ja, völlig normal! Hohe Töne erfordern mehr Lippenspannung. Beginnen Sie mit 5 Minuten Höhen-Training pro Tag und steigern langsam. Bei Schmerzen sofort pausieren!" },
  { question: "Soll ich mehr Druck machen für hohe Töne?", answer: "NEIN! Das ist der häufigste Fehler. Mehr Druck = Lippen können nicht vibrieren = noch schlechter. Hohe Töne kommen aus: 1) Schnellerer Luftstrom, 2) Mehr Lippenspannung (nicht Druck!), 3) Bessere Atemstütze." },
  { question: "Was ist die höchste Note, die ich erlernen kann?", answer: "Das ist individuell. Die meisten Hobby-Trompeter erreichen komfortabel das c'' (2. Oktave über c'). Professionelle spielen bis g'' oder höher – das braucht aber Jahre Training." },
  { question: "Kann ich den Tonumfang auch ohne Instrument trainieren?", answer: "Ja! Mundstück-Buzzing und Lippenspannungs-Übungen können überall gemacht werden. Ideal für unterwegs. Aber: Das eigentliche Spielen braucht das Feedback des Instruments." },
];

const uebungsplan = [
  { wochen: "Woche 1-2", titel: "Grundlagen", desc: "Nur Schritt 1 & 2. Täglich 5 Minuten. Fokus: Stabilität, nicht Höhe!", color: "text-emerald-400" },
  { wochen: "Woche 3-4", titel: "Übergänge", desc: "Schritt 3 hinzufügen. Glissando-Übungen. 7 Minuten/Tag.", color: "text-sky-400" },
  { wochen: "Woche 5-6", titel: "Überblasen", desc: "Schritt 4. Erste echte Höhen (bis g'). 10 Minuten/Tag.", color: "text-primary" },
  { wochen: "Woche 7-10", titel: "Ausbau", desc: "Alle 5 Schritte. Chromatisch aufwärts. 10-15 Minuten/Tag.", color: "text-[hsl(var(--reward-gold))]" },
];

export default function TrompeteTonumfangPage() {
  return (
    <SEOPageLayout>
      <HowToSchema
        name="Trompete Tonumfang erhöhen: Range-Training Guide"
        description="Lerne in 5 Schritten, höhere Töne an der Trompete zu spielen – ohne zu pressen, mit gesunder Technik"
        steps={howToSteps}
        totalTime="P3M"
      />
      <FAQSchema faqs={faqs} />

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/15">
            <ArrowUp className="h-4 w-4" />
            Fortgeschrittene Technik
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Trompete Tonumfang erhöhen:<br />
            <span className="text-gold-gradient">Range-Training ohne Druck</span>
          </h1>

          <p className="text-xl text-white/75 mb-8 max-w-2xl mx-auto">
            Höhere Töne spielen – aber gesund und ohne zu pressen. Mit dieser Schritt-für-Schritt-Methode erweitern Sie Ihren Tonumfang nachhaltig.
          </p>

          <div className="glass rounded-2xl p-6 mb-8 max-w-2xl mx-auto text-left">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-[hsl(var(--reward-gold))] flex-shrink-0 mt-1" />
              <p className="text-white">
                <strong>Wichtig:</strong> Mehr Druck ist NICHT die Lösung! Hohe Töne entstehen durch schnelleren Luftstrom und kontrollierte Lippenspannung – nicht durch härteres Drücken des Mundstücks.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" asChild>
              <Link to="/videos/tonumfang">
                <PlayCircle className="mr-2 h-4 w-4" />
                Video-Anleitung
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
              <Link to="/kurse/fortgeschritten">Pro-Kurs: Range</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 pb-16">

        {/* Warum */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Warum höhere Töne schwierig sind</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Activity, color: "text-primary", title: "Physik", desc: "Höhere Töne = höhere Frequenz = schnellere Lippenvibration. Die Lippen müssen sich schneller öffnen und schließen." },
              { icon: AlertTriangle, color: "text-[hsl(var(--accent-red))]", title: "Falle: Druck", desc: "Mehr Druck erstarrt die Lippen. Sie können dann nicht mehr vibrieren = gar kein Ton möglich." },
              { icon: CheckCircle, color: "text-[hsl(var(--reward-gold))]", title: "Lösung", desc: "Schnellere Luft + mehr Lippenspannung (nicht Druck) + bessere Atemstütze = Höhe ohne Kraft." },
            ].map((item, i) => (
              <Card key={i} className="hover-lift">
                <CardContent className="p-6">
                  <item.icon className={`h-10 w-10 ${item.color} mb-4`} />
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Die 5 Schritte */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Die 5 Schritte zum größeren Tonumfang</h2>
          <div className="space-y-4">
            {howToSteps.map((step) => (
              <Card key={step.position} className="hover-lift border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                      {step.position}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{step.name}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{step.text}</p>
                      <div className="mt-3 flex items-center gap-2 text-sm text-primary">
                        <PlayCircle className="h-4 w-4" />
                        <Link to="#" className="hover:underline">Video-Demo ansehen</Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Übungsplan */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">10-Wochen-Übungsplan</h2>
          <div className="space-y-3">
            {uebungsplan.map((plan, i) => (
              <div key={i} className="glass rounded-xl p-5 flex items-start gap-4">
                <div className={`text-2xl font-bold ${plan.color} whitespace-nowrap`}>{plan.wochen}</div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{plan.titel}</h3>
                  <p className="text-white/70 text-sm">{plan.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Warnung */}
        <section className="mb-16">
          <div className="glass rounded-xl p-5 border border-[hsl(var(--accent-red))]/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-[hsl(var(--accent-red))] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white mb-1">⚠️ Warnung: Gesundheit geht vor!</h4>
                <p className="text-white/75 text-sm">
                  Bei Lippenschmerzen, Ansatzschwellung oder Anspannung sofort pausieren! Niemals durch Schmerzen hindurch üben. Das führt zu langfristigen Schäden. Mehr Pausen = schnellerer Fortschritt.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Häufige Fragen zum Tonumfang</h2>
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
        </section>

        {/* Zusammenfassung */}
        <section className="mb-16">
          <div className="glass rounded-2xl p-6 border border-[hsl(var(--reward-gold))]/20">
            <h2 className="text-2xl font-bold text-white mb-4">Merken Sie sich</h2>
            <ul className="space-y-2">
              {[
                "Mehr Druck = Weniger Höhe (Lippen erstarren)",
                "Schnellerer Luftstrom + Lippenspannung = Höhe",
                "3-6 Monate für eine Quinte ist realistisch",
                "Bei Schmerzen sofort pausieren!",
                "Täglich 5-10 Minuten Höhen-Training maximum",
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-[hsl(var(--reward-gold))] flex-shrink-0 mt-0.5" />
                  <span className="text-white/85 text-sm">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center glass rounded-2xl p-10">
          <h2 className="text-3xl font-bold text-white mb-4">Mehr Range mit Profi-Begleitung?</h2>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">
            Im Fortgeschrittenen-Kurs zeigen wir Ihnen persönlich, wie Sie Ihre Höhen gesund ausbauen.
          </p>
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" asChild>
            <Link to="/kurse/fortgeschritten">
              Range-Kurs entdecken <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>
      </div>
    </SEOPageLayout>
  );
}
