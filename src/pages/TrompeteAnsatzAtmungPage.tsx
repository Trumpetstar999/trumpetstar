import { HowToSchema } from "@/components/SEO/HowToSchema";
import { FAQSchema } from "@/components/SEO/FAQSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Wind, Activity, AlertCircle, CheckCircle, PlayCircle, ArrowRight } from "lucide-react";

const howToSteps = [
  {
    position: 1,
    name: "Lippenschwingungen (Buzzing) üben",
    text: "Ohne Instrument: Lippen leicht geschlossen, Luft durchblasen, bis ein brummendes Vibrieren entsteht. 2-3 Minuten täglich üben. Das ist die BASIS für alles Weitere.",
    image: "https://trumpetstar.com/images/buzzing.jpg"
  },
  {
    position: 2,
    name: "Korrekte Mundstück-Position",
    text: "Mundstück mittig auf die Lippen setzen. Faustregel: Oberlippe bedeckt 2/3, Unterlippe 1/3 des Mundstückrandes. Winkel: ca. 45 Grad nach unten. Nicht zu fest drücken!",
    image: "https://trumpetstar.com/images/mouthpiece-position.jpg"
  },
  {
    position: 3,
    name: "Lippenkontrolle (Embouchure)",
    text: "Die Lippen sollten leicht nach innen gerollt sein (nicht nach außen gebläht). Spannung wie bei einem 'Mmmh'-Laut. Gleichmäßiger Druck auf beiden Seiten.",
    image: "https://trumpetstar.com/images/embouchure.jpg"
  },
  {
    position: 4,
    name: "Bauchatmung lernen",
    text: "Hand auf den Bauch legen. Einatmen: Bauch wölbt sich nach außen (nicht Brust heben!). Ausatmen: Kontrolliert, gleichmäßig. Übung: 4 Sekunden ein, 4 Sekunden aus.",
    image: "https://trumpetstar.com/images/breathing.jpg"
  },
  {
    position: 5,
    name: "Atemstoß und Ton",
    text: "Tief einatmen (Bauch!), Lippen schließen, Luft stoßartig durch die geschlossenen Lippen blasen. Ziel: Ein klarer, stabiler Ton. Nicht zu viel Druck – die Lippen müssen vibrieren können!",
    image: "https://trumpetstar.com/images/air-stream.jpg"
  }
];

const faqs = [
  {
    question: "Warum kommt bei mir kein Ton trotz richtigem Ansatz?",
    answer: "Meist liegt es am zu festen Drücken des Mundstücks. Die Lippen müssen vibrieren können – lockerer halten! Oder: zu wenig Luftdruck. Üben Sie das Buzzing ohne Instrument intensiver."
  },
  {
    question: "Wie fest muss ich das Mundstück auf die Lippen drücken?",
    answer: "Nur so fest, dass kein Luft entweicht, aber die Lippen noch vibrieren können. Faustregel: So fest wie ein Kuss auf die Wange. Bei Schmerzen sofort lockerer halten!"
  },
  {
    question: "Sollen die Wangen aufgeblasen sein?",
    answer: "Nein! Das ist ein häufiger Fehler. Die Luft bleibt im Mundraum, aber die Wangen sollten entspannt sein. Fokus auf die Lippen, nicht auf die Wangen."
  },
  {
    question: "Meine Lippen werden schnell müde – normal?",
    answer: "Ja, völlig normal für Anfänger. Die Muskeln müssen sich aufbauen. Beginnen Sie mit 5 Minuten Üben, steigern langsam auf 10-15 Minuten. Pausen sind wichtig!"
  },
  {
    question: "Atme ich durch Mund oder Nase?",
    answer: "Durch den Mund! Schnell und tief einatmen durch den Mundwinkel (nicht durch das Instrument). So haben Sie mehr Kontrolle über den Luftstrom."
  }
];

export default function TrompeteAnsatzAtmungPage() {
  return (
    <div className="min-h-screen bg-background">
      <HowToSchema 
        name="Trompete: Korrekter Ansatz und Atmung"
        description="Lerne den richtigen Trompeten-Ansatz (Embouchure) und die Bauchatmung Schritt für Schritt"
        steps={howToSteps}
        totalTime="P1W"
      />
      <FAQSchema faqs={faqs} />

      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-br from-sky-50 to-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Wind className="h-4 w-4" />
            Technik-Guide für Anfänger
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Trompete Ansatz & Atmung:<br />
            <span className="text-sky-600">Die Grundlagen für guten Ton</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Der richtige Ansatz (Embouchure) und die korrekte Atmung sind das Fundament für alle Trompeten-Techniken. Hier lernst du es Schritt für Schritt.
          </p>

          <div className="bg-white/80 backdrop-blur border-sky-200 border rounded-xl p-6 max-w-2xl mx-auto mb-8">
            <div className="flex items-start gap-3 text-left">
              <CheckCircle className="h-6 w-6 text-sky-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-lg mb-2">
                  <strong>Das Wichtigste:</strong> 70% des Trompeten-Klangs kommen vom richtigen Ansatz. Übe die Grundlagen (Buzzing, Atmung) täglich 5 Minuten – der Erfolg kommt automatisch.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-sky-600 hover:bg-sky-700" asChild>
              <Link to="/videos/ansatz-atmung">
                <PlayCircle className="mr-2 h-4 w-4" />
                Video-Anleitung
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/kurse">Kompletter Technik-Kurs</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16">

        {/* Warum wichtig */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Warum Ansatz & Atmung so wichtig sind</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="h-8 w-8 text-sky-600" />
                  <h3 className="text-xl font-semibold">Der Ansatz (Embouchure)</h3>
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Bestimmt Tonqualität und -höhe</li>
                  <li>• Ermöglicht verschiedene Dynamiken</li>
                  <li>• Basis für großen Tonumfang</li>
                  <li>• Verhindert Lippenmüdigkeit</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Wind className="h-8 w-8 text-sky-600" />
                  <h3 className="text-xl font-semibold">Die Atmung</h3>
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Versorgt die Töne mit Energie</li>
                  <li>• Ermöglicht lange Phrasen</li>
                  <li>• Grundlage für Lautstärke</li>
                  <li>• Reduziert Anspannung</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Die 5 Schritte */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Die 5 Schritte zum perfekten Ansatz</h2>
          
          <div className="space-y-6">
            {howToSteps.map((step) => (
              <Card key={step.position} className="border-l-4 border-l-sky-500">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-lg">
                      {step.position}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-3">{step.name}</h3>
                      <p className="text-muted-foreground leading-relaxed">{step.text}</p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-sky-600">
                        <PlayCircle className="h-4 w-4" />
                        <Link to="#" className="hover:underline">Video zu diesem Schritt ansehen</Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Übungen */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Tägliche Übungen (5 Minuten)</h2>
          
          <Card className="bg-sky-50 border-sky-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-sky-900 mb-4">Morgen-Routine:</h3>
              <ol className="space-y-3 text-sky-800">
                <li><strong>1. Buzzing (2 Min):</strong> Ohne Instrument, nur Lippen</li>
                <li><strong>2. Mundstück-Buzzing (1 Min):</strong> Ton halten, lauter/leiser</li>
                <li><strong>3. Atemübung (1 Min):</strong> 4 Sekunden ein, 4 aus</li>
                <li><strong>4. Lange Töne (1 Min):</strong> Einen Ton so lange wie möglich halten</li>
              </ol>
            </CardContent>
          </Card>
        </section>

        {/* Fehler */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Häufige Fehler vermeiden</h2>
          
          <div className="space-y-4">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-red-900 mb-2">Zu festes Drücken</h4>
                    <p className="text-red-800">Die Lippen müssen vibrieren können! Bei zu viel Druck entsteht kein Ton. Lockerer halten, weniger ist mehr.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-2">Brustatmung statt Bauchatmung</h4>
                    <p className="text-amber-800">Die Schultern sollten sich beim Einatmen NICHT heben. Hand auf den Bauch legen – der muss sich nach außen wölben.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Häufige Fragen zu Ansatz & Atmung</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Zusammenfassung */}
        <section className="mb-16">
          <Card className="bg-sky-50 border-sky-200">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Kurz zusammengefasst</h2>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
                  <span>Der Ansatz (Embouchure) macht 70% des Klangs aus</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
                  <span>Tägliches Buzzing (2-3 Min) ist die beste Übung</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
                  <span>Bauchatmung: Bauch wölbt sich, Brust bleibt ruhig</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
                  <span>Nicht zu fest drücken – Lippen müssen vibrieren</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
                  <span>Geduld: Richtiger Ansatz braucht Wochen, nicht Tage</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="text-center py-12 bg-gradient-to-br from-sky-100 to-blue-100 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4">Mehr Technik-Übungen?</h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
            Im Pro-Kurs findest du über 50 Technik-Übungen mit Video-Begleitung für Ansatz, Atmung und mehr.
          </p>
          <Button size="lg" className="bg-sky-600 hover:bg-sky-700" asChild>
            <Link to="/kurse">
              Technik-Kurs entdecken <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>

      </div>
    </div>
  );
}
