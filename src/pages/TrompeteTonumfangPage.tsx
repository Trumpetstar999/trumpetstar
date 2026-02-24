import { HowToSchema } from "@/components/SEO/HowToSchema";
import { FAQSchema } from "@/components/SEO/FAQSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowUp, AlertCircle, CheckCircle, Activity, PlayCircle, ArrowRight } from "lucide-react";

const howToSteps = [
  {
    position: 1,
    name: "Grundlage: Feste Töne stabilisieren",
    text: "Bevor Sie höher spielen können, müssen die mittleren Töne (c'-g') absolut stabil sitzen. Üben Sie lange Töne: 10 Sekunden halten, gleichmäßig, klar, ohne Zittern. Erst dann weiter nach oben.",
    image: "https://trumpetstar.com/images/stable-tones.jpg"
  },
  {
    position: 2,
    name: "Lippen-Attack-Übung",
    text: "Spielen Sie einzelne Töne (nur Ansatz, keine Zunge) im mittleren Register. Ziel: Sauberer Start ohne 'Puff' oder Zögern. Wechseln Sie langsam zwischen benachbarten Tönen.",
    image: "https://trumpetstar.com/images/lip-attack.jpg"
  },
  {
    position: 3,
    name: "Gleitende Übergänge (Glissando)",
    text: "Gleiten Sie langsam von einem tiefen Ton (z.B. c') zu einem höheren (z.B. g') und zurück. OHNE Ventile! Nur mit Lippenspannung und Luft. Das trainiert die Feinmotorik.",
    image: "https://trumpetstar.com/images/glissando.jpg"
  },
  {
    position: 4,
    name: "Erste Überblastechnik",
    text: "Spielen Sie c', dann überblasen Sie zum g' (gleiches Ventil, höhere Schwingung). Die Übung: c' → g' → c', langsam und kontrolliert. Wichtig: Gleiche Lautstärke, gleiche Anstrengung!",
    image: "https://trumpetstar.com/images/overblow.jpg"
  },
  {
    position: 5,
    name: "Chromatischer Aufstieg",
    text: "Spielen Sie chromatisch aufwärts (Halbtonschritte) bis zu Ihrer aktuellen Grenze. Halten Sie den höchsten Ton 3 Sekunden, dann zurück. Jeden Tag eine kleine Steigerung versuchen (nur wenn es locker geht!)."
    image: "https://trumpetstar.com/images/chromatic.jpg"
  }
];

const faqs = [
  {
    question: "Wie lange dauert es, den Tonumfang zu erweitern?",
    answer: "Realistisch: 3-6 Monate für eine Quinte (z.B. von c' bis g'). Viel schneller geht es nicht, da die Lippenmuskulatur Zeit zum Aufbau braucht. Geduld ist entscheidend!"
  },
  {
    question: "Meine Lippen werden beim hohen Spielen schnell müde – normal?",
    answer: "Ja, völlig normal! Hohe Töne erfordern mehr Lippenspannung. Beginnen Sie mit 5 Minuten Höhen-Training pro Tag und steigern langsam. Bei Schmerzen sofort pausieren!"
  },
  {
    question: "Soll ich mehr Druck machen für hohe Töne?",
    answer: "NEIN! Das ist der häufigste Fehler. Mehr Druck = Lippen können nicht vibrieren = noch schlechter. Hohe Töne kommen aus: 1) Schnellerer Luftstrom, 2) Mehr Lippenspannung (nicht Druck!), 3) Bessere Atemstütze."
  },
  {
    question: "Was ist die höchste Note, die ich erlernen kann?",
    answer: "Das ist individuell. Die meisten Hobby-Trompeter erreichen komfortabel das c'' (2. Oktave über c'). Professionelle spielen bis g'' oder höher – das braucht aber Jahre Training."
  },
  {
    question: "Kann ich den Tonumfang auch ohne Instrument trainieren?",
    answer: "Ja! Mundstück-Buzzing und Lippenspannungs-Übungen können überall gemacht werden. Ideal für unterwegs. Aber: Das eigentliche Spielen braucht das Feedback des Instruments."
  }
];

export default function TrompeteTonumfangPage() {
  return (
    <div className="min-h-screen bg-background">
      <HowToSchema 
        name="Trompete Tonumfang erhöhen: Range-Training Guide"
        description="Lerne in 5 Schritten, höhere Töne an der Trompete zu spielen – ohne zu pressen, mit gesunder Technik"
        steps={howToSteps}
        totalTime="P3M"
      />
      <FAQSchema faqs={faqs} />

      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <ArrowUp className="h-4 w-4" />
            Fortgeschrittene Technik
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Trompete Tonumfang erhöhen:<br />
            <span className="text-indigo-600">Range-Training ohne Druck</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Höhere Töne spielen – aber gesund und ohne zu pressen. Mit dieser Schritt-für-Schritt-Methode erweitern Sie Ihren Tonumfang nachhaltig.
          </p>

          <div className="bg-white/80 backdrop-blur border-indigo-200 border rounded-xl p-6 max-w-2xl mx-auto mb-8">
            <div className="flex items-start gap-3 text-left">
              <CheckCircle className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-lg mb-2">
                  <strong>Wichtig:</strong> Mehr Druck ist NICHT die Lösung! Hohe Töne entstehen durch schnelleren Luftstrom und kontrollierte Lippenspannung – nicht durch härteres Drücken des Mundstücks.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700" asChild>
              <Link to="/videos/tonumfang">
                <PlayCircle className="mr-2 h-4 w-4" />
                Video-Anleitung
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/kurse/fortgeschritten">Pro-Kurs: Range</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16">

        {/* Warum */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Warum höhere Töne schwierig sind</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <Activity className="h-10 w-10 text-indigo-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Physik</h3>
                <p className="text-muted-foreground">Höhere Töne = höhere Frequenz = schnellere Lippenvibration. Die Lippen müssen sich schneller öffnen und schließen.</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <AlertCircle className="h-10 w-10 text-amber-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Falle: Druck</h3>
                <p className="text-muted-foreground">Mehr Druck erstarrt die Lippen. Sie können dann nicht mehr vibrieren = gar kein Ton möglich.</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <CheckCircle className="h-10 w-10 text-green-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Lösung</h3>
                <p className="text-muted-foreground">Schnellere Luft + mehr Lippenspannung (nicht Druck) + bessere Atemstütze = Höhe ohne Kraft.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Die 5 Schritte */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Die 5 Schritte zum größeren Tonumfang</h2>
          
          <div className="space-y-6">
            {howToSteps.map((step) => (
              <Card key={step.position} className="border-l-4 border-l-indigo-500">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-lg">
                      {step.position}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-3">{step.name}</h3>
                      <p className="text-muted-foreground leading-relaxed">{step.text}</p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-indigo-600">
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
          <h2 className="text-3xl font-bold mb-6">10-Wochen-Übungsplan</h2>
          
          <div className="space-y-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-green-900 mb-2">Woche 1-2: Grundlagen</h3>
                <p className="text-green-800">Nur Schritt 1 & 2. Täglich 5 Minuten. Fokus: Stabilität, nicht Höhe!</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-blue-900 mb-2">Woche 3-4: Übergänge</h3>
                <p className="text-blue-800">Schritt 3 hinzufügen. Glissando-Übungen. 7 Minuten/Tag.</p>
              </CardContent>
            </Card>

            <Card className="bg-indigo-50 border-indigo-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-indigo-900 mb-2">Woche 5-6: Überblasen</h3>
                <p className="text-indigo-800">Schritt 4. Erste echte Höhen (bis g'). 10 Minuten/Tag.</p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-purple-900 mb-2">Woche 7-10: Ausbau</h3>
                <p className="text-purple-800">Alle 5 Schritte. Chromatisch aufwärts. 10-15 Minuten/Tag.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Warnung */}
        <section className="mb-16">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-2">⚠️ Warnung: Gesundheit geht vor!</h4>
                  <p className="text-red-800">
                    Bei Lippenschmerzen, Ansatzschwellung oder Anspannung sofort pausieren! Niemals durch Schmerzen hindurch üben. Das führt zu langfristigen Schäden. Mehr Pausen = schnellerer Fortschritt.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Häufige Fragen zum Tonumfang</h2>
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
          <Card className="bg-indigo-50 border-indigo-200">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Merken Sie sich</h2>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span>Mehr Druck = Weniger Höhe (Lippen erstarren)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span>Schnellerer Luftstrom + Lippenspannung = Höhe</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span>3-6 Monate für eine Quinte ist realistisch</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span>Bei Schmerzen sofort pausieren!</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span>Täglich 5-10 Minuten Höhen-Training maximum</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="text-center py-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4">Mehr Range mit Profi-Begleitung?</h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
            Im Fortgeschrittenen-Kurs zeigen wir Ihnen persönlich, wie Sie Ihre Höhen gesund ausbauen.
          </p>
          <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700" asChild>
            <Link to="/kurse/fortgeschritten">
              Range-Kurs entdecken <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>

      </div>
    </div>
  );
}
