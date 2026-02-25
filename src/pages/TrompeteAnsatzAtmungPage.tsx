import { HowToSchema } from "@/components/SEO/HowToSchema";
import { FAQSchema } from "@/components/SEO/FAQSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Wind, Activity, AlertCircle, CheckCircle, PlayCircle, ArrowRight } from "lucide-react";
import { SEOPageLayout } from "@/components/seo/SEOPageLayout";

const howToSteps = [
  { position: 1, name: "Lippenschwingungen (Buzzing) üben", text: "Ohne Instrument: Lippen leicht geschlossen, Luft durchblasen, bis ein brummendes Vibrieren entsteht. 2-3 Minuten täglich." },
  { position: 2, name: "Korrekte Mundstück-Position", text: "Mundstück mittig auf die Lippen. Oberlippe 2/3, Unterlippe 1/3. Ca. 45 Grad nach unten. Nicht zu fest drücken!" },
  { position: 3, name: "Lippenkontrolle (Embouchure)", text: "Lippen leicht nach innen gerollt. Spannung wie bei einem 'Mmmh'-Laut. Gleichmäßiger Druck auf beiden Seiten." },
  { position: 4, name: "Bauchatmung lernen", text: "Hand auf den Bauch. Einatmen: Bauch wölbt sich nach außen. Ausatmen: kontrolliert, gleichmäßig. 4 Sek. ein, 4 Sek. aus." },
  { position: 5, name: "Ton", text: "Tief einatmen (Bauch!), Lippen schließen, Luft durch die geschlossenen Lippen. Ziel: klarer, stabiler Ton." }
];

const faqs = [
  { question: "Warum kommt kein Ton trotz richtigem Ansatz?", answer: "Meist liegt es am zu festen Drücken. Die Lippen müssen vibrieren können – lockerer halten! Oder: zu wenig Luftdruck." },
  { question: "Wie fest muss ich das Mundstück drücken?", answer: "So fest wie ein Kuss auf die Wange. Bei Schmerzen sofort lockerer!" },
  { question: "Sollen die Wangen aufgeblasen sein?", answer: "Nein! Die Wangen sollten entspannt sein. Fokus auf die Lippen." },
  { question: "Meine Lippen werden schnell müde – normal?", answer: "Ja, völlig normal. Die Muskeln müssen sich aufbauen. Beginnen Sie mit 5 Minuten, steigern langsam." },
  { question: "Atme ich durch Mund oder Nase?", answer: "Durch den Mund! Schnell einatmen durch den Mundwinkel für mehr Kontrolle." }
];

export default function TrompeteAnsatzAtmungPage() {
  return (
    <SEOPageLayout>
      <HowToSchema name="Trompete: Korrekter Ansatz und Atmung" description="Lerne den richtigen Trompeten-Ansatz und die Bauchatmung Schritt für Schritt" steps={howToSteps} totalTime="P1W" />
      <FAQSchema faqs={faqs} />

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/15">
            <Wind className="h-4 w-4" />
            Technik-Guide für Anfänger
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Trompete Ansatz & Atmung:<br />
            <span className="text-gold-gradient">Die Grundlagen für guten Ton</span>
          </h1>
          
          <p className="text-xl text-white/75 mb-8 max-w-2xl mx-auto">
            Der richtige Ansatz (Embouchure) und die korrekte Atmung sind das Fundament für einen schönen Trompetenklang.
          </p>

          <div className="glass rounded-2xl p-6 max-w-2xl mx-auto mb-8 text-left">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-[hsl(var(--reward-gold))] flex-shrink-0 mt-1" />
              <p className="text-white">
                <strong>Das Wichtigste:</strong> 70% des Trompeten-Klangs kommen vom richtigen Ansatz. Übe die Grundlagen täglich 5 Minuten – der Erfolg kommt automatisch.
              </p>
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto mb-10">
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                src="https://player.vimeo.com/video/1025864403?h=6b28cdec78&title=0&byline=0&portrait=0&dnt=1"
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
                title="Trompete Ansatz und Atmung"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" asChild>
              <Link to="/login"><PlayCircle className="mr-2 h-4 w-4" /> Jetzt anmelden & kostenlos starten</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 pb-16">

        {/* Warum wichtig */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Warum Ansatz & Atmung so wichtig sind</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-semibold">Der Ansatz</h3>
                </div>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li>• Bestimmt Tonqualität und -höhe</li><li>• Ermöglicht verschiedene Dynamiken</li>
                  <li>• Basis für großen Tonumfang</li><li>• Verhindert Lippenmüdigkeit</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Wind className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-semibold">Die Atmung</h3>
                </div>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li>• Versorgt Töne mit Energie</li><li>• Ermöglicht lange Phrasen</li>
                  <li>• Grundlage für Lautstärke</li><li>• Reduziert Anspannung</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 5 Schritte */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Die 5 Schritte zum perfekten Ansatz</h2>
          <div className="space-y-4">
            {howToSteps.map((step) => (
              <Card key={step.position} className="border-l-4 border-l-primary hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                      {step.position}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{step.name}</h3>
                      <p className="text-muted-foreground text-sm">{step.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Übungen */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Tägliche Übungen (5 Minuten)</h2>
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold text-[hsl(var(--reward-gold))] mb-4">Morgen-Routine:</h3>
            <ol className="space-y-3 text-white/80 text-sm">
              <li><strong className="text-white">1. Ausatmen (2 Min):</strong> 8 Schläge lang ausatmen</li>
              <li><strong className="text-white">2. Mundstück-Buzzing (1 Min):</strong> Ton halten, lauter/leiser</li>
              <li><strong className="text-white">3. Atemübung (1 Min):</strong> 4 Sekunden ein, 4 aus</li>
              <li><strong className="text-white">4. Lange Töne (1 Min):</strong> Einen Ton so lange wie möglich halten</li>
            </ol>
          </div>
        </section>

        {/* Fehler */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Häufige Fehler vermeiden</h2>
          <div className="space-y-4">
            <div className="glass rounded-xl p-5 border border-[hsl(var(--accent-red))]/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-[hsl(var(--accent-red))] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white mb-1">Zu festes Drücken</h4>
                  <p className="text-white/75 text-sm">Die Lippen müssen vibrieren können! Lockerer halten, weniger ist mehr.</p>
                </div>
              </div>
            </div>
            <div className="glass rounded-xl p-5 border border-[hsl(var(--reward-gold))]/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-[hsl(var(--reward-gold))] flex-shrink-0 mt-0.5" />
                <div>
              <h4 className="font-semibold text-white mb-1">Bauchatmung statt Brustatmung</h4>
                  <p className="text-white/75 text-sm">Die Schultern sollten sich beim Einatmen NICHT heben. Bauch muss sich nach außen wölben.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
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
        </section>

        {/* Zusammenfassung */}
        <section className="mb-16">
          <div className="glass rounded-2xl p-6 border border-[hsl(var(--reward-gold))]/20">
            <h2 className="text-2xl font-bold text-white mb-4">Kurz zusammengefasst</h2>
            <ul className="space-y-2">
              {[
                "Der Ansatz (Embouchure) macht 70% des Klangs aus",
                "Tägliches Buzzing (2-3 Min) ist die beste Übung",
                "Bauchatmung: Bauch wölbt sich, Brust bleibt ruhig",
                "Nicht zu fest drücken – Lippen müssen vibrieren",
                "Geduld: Richtiger Ansatz braucht Wochen, nicht Tage",
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
          <h2 className="text-3xl font-bold text-white mb-4">Mehr Technik-Übungen?</h2>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">Im Pro-Kurs findest du über 50 Technik-Übungen mit Video-Begleitung.</p>
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" asChild>
            <Link to="/login">Jetzt anmelden & kostenlos starten <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </section>
      </div>
    </SEOPageLayout>
  );
}
