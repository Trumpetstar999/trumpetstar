import { FAQSchema } from "@/components/SEO/FAQSchema";
import { HowToSchema } from "@/components/SEO/HowToSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BookOpen, Video, Smartphone, Award, Clock, Users, Child, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

const faqs = [
  {
    question: "Ab welchem Alter kann man Trompete lernen?",
    answer: "Kinder können ab 6-7 Jahren mit dem Kornett (kleinere Version) beginnen, ab 8-9 Jahren mit der normalen Trompete. Erwachsene können jederzeit starten – es ist nie zu spät."
  },
  {
    question: "Wie lange dauert es, Trompete zu lernen?",
    answer: "Für erste einfache Songs benötigt man 3-6 Monate bei regelmäßigem Üben (5-15 Minuten täglich). Fortgeschrittenes Spielen erreicht man nach 1-2 Jahren."
  },
  {
    question: "Kann man als Erwachsener noch Trompete lernen?",
    answer: "Absolut! Erwachsene haben Vorteile wie bessere Disziplin, Zielorientierung und Muskelkontrolle. Mit der richtigen Methode lernen Erwachsene oft effizienter als Kinder."
  },
  {
    question: "Wie viel muss ich täglich üben?",
    answer: "5-15 Minuten täglich sind ausreichend für Anfänger. Wichtiger als die Dauer ist die Regelmäßigkeit. Kurze, fokussierte Übungen sind effektiver als seltene, lange Sessions."
  },
  {
    question: "Was brauche ich zum Anfangen?",
    answer: "Eine Einsteiger-Trompete (oder Kornett für Kinder), ein Mundstück (meist inklusive), ein Lehrbuch (z.B. Trumpetstar Band 1) und unsere App mit Video-Begleitung."
  },
  {
    question: "Ist Trompete lernen schwierig?",
    answer: "Der erste Ton ist die größte Hürde. Mit der richtigen Methode (Lippenschwingungen, korrekter Ansatz) gelingt er in wenigen Tagen bis Wochen. Danach wird es kontinuierlich einfacher."
  },
  {
    question: "Was ist das Kornett?",
    answer: "Das Kornett ist eine kleinere, leichtere Variante der Trompete mit mehr Rundungen. Es ist ideal für Kinder ab 6-7 Jahren mit kleineren Händen und weniger Lippenkraft."
  },
  {
    question: "Kann ich Trompete selbst lernen oder brauche ich einen Lehrer?",
    answer: "Mit unserer Star-Methode (Buch + Videos + App) kannst du selbstständig lernen. Die Videos zeigen genau, wie es geht. Bei Problemen steht unser Support zur Verfügung."
  },
  {
    question: "Wie viel kostet eine Anfänger-Trompete?",
    answer: "Gute Einsteiger-Trompeten gibt es ab 200-300€ zu kaufen oder ab 20-30€/Monat zu mieten. Für Kinder empfiehlt sich das Kornett in ähnlicher Preislage."
  },
  {
    question: "Was ist die Star-Methode?",
    answer: "Die Star-Methode kombiniert ein Lehrbuch mit QR-Codes, Video-Tutorials und einer App mit Gamification. Sie wurde speziell für Anfänger und Erwachsene mit wenig Zeit entwickelt."
  }
];

const ersteSchritte = [
  {
    position: 1,
    name: "Instrument beschaffen",
    text: "Entscheide dich für Kauf oder Miete. Für Kinder ab 6-7 Jahren empfehlen wir das Kornett, für ältere Kinder und Erwachsene die normale Trompete."
  },
  {
    position: 2,
    name: "Lippenschwingungen üben (Buzzing)",
    text: "Beginne ohne Instrument: Versuche, mit geschlossenen Lippen ein brummendes Geräusch zu machen. Das ist die Basis für den ersten Ton."
  },
  {
    position: 3,
    name: "Mundstück probieren",
    text: "Setze das Mundstück mittig auf die Lippen. Die Oberlippe sollte etwas mehr bedeckt sein als die Unterlippe. Nicht zu fest drücken!"
  },
  {
    position: 4,
    name: "Ersten Ton erzeugen",
    text: "Stoße Luft durch die geschlossenen Lippen. Die Lippen beginnen zu schwingen und erzeugen den ersten Ton. Nicht aufgeben – das braucht oft mehrere Versuche!"
  },
  {
    position: 5,
    name: "Regelmäßig üben",
    text: "Übe täglich 5-10 Minuten. Nutze die Trumpetstar-App mit Video-Begleitung für strukturierte Lektionen und Fortschrittstracking."
  }
];

export default function TrompeteLernenPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* SEO Schema */}
      <FAQSchema faqs={faqs} />
      <HowToSchema 
        name="Trompete lernen: Erste Schritte für Anfänger"
        description="Schritt-für-Schritt-Anleitung zum Erlernen der Trompete"
        steps={ersteSchritte}
      />

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Trompete lernen: Der komplette Guide für Anfänger (2026)
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Trompete lernen ist mit der richtigen Methode in 3–6 Monaten möglich – egal ob als Kind, Erwachsener oder Wiedereinsteiger. Die Star-Methode kombiniert Bücher mit QR-Codes, Videos und App-Begleitung für nachhaltigen Erfolg.
          </p>
          
          {/* Answer-First Box */}
          <Card className="bg-primary/5 border-primary/20 mb-8">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <p className="text-lg">
                  <strong>Kurz gesagt:</strong> Trompete lernen dauert 3–6 Monate für erste Songs. Kinder ab 7 Jahren und Erwachsene können mit der Star-Methode (Buch + Videos + App) effizient lernen. Täglich 5–15 Minuten Üben sind ausreichend.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/kostenlos-starten">Gratis-Lektion testen</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/kurse">Kurs entdecken</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Haupt-Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        
        {/* Abschnitt: Für wen */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Für wen ist Trompete lernen geeignet?</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Child className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-semibold">Kinder & Jugendliche</h3>
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Ab 6-7 Jahren mit Kornett möglich</li>
                  <li>• Ab 8-9 Jahren mit normaler Trompete</li>
                  <li>• Ideale Ergänzung zur Bläserklasse</li>
                  <li>• Fördert Konzentration und Disziplin</li>
                </ul>
                <Button variant="link" className="mt-4" asChild>
                  <Link to="/trompete-lernen-kinder">Mehr zu Kinder →</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-semibold">Erwachsene</h3>
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Jederzeit möglich – nie zu spät!</li>
                  <li>• Schnellerer Lernfortschritt als Kinder</li>
                  <li>• Perfekt für Berufstätige (5 Min/Tag)</li>
                  <li>• Wiedereinsteiger willkommen</li>
                </ul>
                <Button variant="link" className="mt-4" asChild>
                  <Link to="/trompete-lernen-erwachsene">Mehr zu Erwachsene →</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Abschnitt: Star-Methode */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Die Star-Methode: So funktioniert modernes Trompete-Lernen</h2>
          
          <p className="text-lg text-muted-foreground mb-8">
            Die Star-Methode wurde von <Link to="/ueber-mario" className="text-primary hover:underline">Mario Schulter</Link> (erfolgreicher Trompeter und Musikpädagoge) entwickelt und verbindet bewährte Unterrichtsmethoden mit moderner Technologie.
          </p>

          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <BookOpen className="h-10 w-10 mx-auto mb-3 text-primary" />
                <h4 className="font-semibold mb-2">1. Buch</h4>
                <p className="text-sm text-muted-foreground">Strukturierter Lehrplan mit QR-Codes</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <Video className="h-10 w-10 mx-auto mb-3 text-primary" />
                <h4 className="font-semibold mb-2">2. Videos</h4>
                <p className="text-sm text-muted-foreground">Jeder Schritt visuell erklärt</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <Smartphone className="h-10 w-10 mx-auto mb-3 text-primary" />
                <h4 className="font-semibold mb-2">3. App</h4>
                <p className="text-sm text-muted-foreground">Interaktive Übungen & Tracking</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <Award className="h-10 w-10 mx-auto mb-3 text-primary" />
                <h4 className="font-semibold mb-2">4. Gamification</h4>
                <p className="text-sm text-muted-foreground">Belohnungen für Fortschritte</p>
              </CardContent>
            </Card>
          </div>

          {/* Definition Box */}
          <Card className="bg-amber-50 border-amber-200 mb-8">
            <CardContent className="p-6">
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <BookOpen className="h-5 w-5 text-amber-600" />
                Was bedeutet "Ansatz"?
              </h4>
              <p className="text-muted-foreground">
                Der Ansatz (auch <em>Embouchure</em>) beschreibt die Lippenstellung und -spannung am Mundstück. Ein korrekter Ansatz ist die Basis für guten Ton und Höhe. <strong>Zu fest = kein Ton, zu locker = Luft entweicht.</strong> In unserem <Link to="/trompete-ansatz-atmung" className="text-primary hover:underline">Ansatz-Guide</Link> zeigen wir Schritt für Schritt die optimale Technik.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Abschnitt: Erste Schritte */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Deine ersten Schritte: So startest du heute</h2>
          
          <div className="space-y-6">
            {ersteSchritte.map((schritt) => (
              <Card key={schritt.position} className="border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {schritt.position}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{schritt.name}</h3>
                      <p className="text-muted-foreground">{schritt.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Warnhinweis */}
          <Card className="bg-red-50 border-red-200 mt-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-2">Wichtig: Überlastung vermeiden</h4>
                  <p className="text-red-800">
                    Beginne mit maximal 10 Minuten täglich. Die Lippenmuskulatur braucht Zeit zum Aufbau. Bei Schmerzen oder Anspannung sofort pausieren! Mehr zu gesundem Üben findest du in unserem <Link to="/gesund-ueben" className="underline">Gesundheits-Guide</Link>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Praxisbeispiel */}
        <section className="mb-16">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-2">Erfahrung aus der Praxis</h4>
                  <blockquote className="text-green-800 italic mb-2">
                    "Ich habe mit 45 Jahren begonnen und dachte, es ist zu spät. Nach 3 Monaten mit der Star-Methode spiele ich meine ersten Songs! Die kurzen Übungseinheiten passen perfekt in meinen Arbeitstag."
                  </blockquote>
                  <p className="text-green-700 text-sm">— Peter M., Wien, Pro-Kurs Teilnehmer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Zeitplan */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Wie lange dauert es wirklich?</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <h4 className="font-semibold">Woche 1-2: Der erste Ton</h4>
                <p className="text-sm text-muted-foreground">Lippenschwingungen, Mundstück-Position, erster klangerfüllter Ton</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <h4 className="font-semibold">Monat 1-3: Erste Melodien</h4>
                <p className="text-sm text-muted-foreground">5-10 einfache Songs, Grundtonarten, rhythmisches Sicherheit</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <h4 className="font-semibold">Monat 3-6: Bläserklasse-ready</h4>
                <p className="text-sm text-muted-foreground">20+ Songs, erweiterter Tonumfang, dynamisches Spielen</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <h4 className="font-semibold">Jahr 1-2: Fortgeschritten</h4>
                <p className="text-sm text-muted-foreground">Komplexe Stücke, Improvisation, verschiedene Stilrichtungen</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Häufige Fragen zum Trompete lernen</h2>
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

        {/* Kurz zusammengefasst */}
        <section className="mb-16">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Kurz zusammengefasst</h2>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Trompete lernen ist in 3–6 Monaten realistisch für erste Songs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Kinder ab 7 Jahren (Kornett), Erwachsene jederzeit möglich</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Star-Methode: Buch + QR-Codes + Videos + App = moderne Lernmethode</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Täglich 5–15 Minuten Üben sind ausreichend (Regelmäßigkeit vor Dauer!)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Kostenloser Start mit Gratis-Lektion möglich – ohne Anmeldung</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* E-E-A-T Signale */}
        <section className="mb-16 border-t pt-8">
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Autor:</strong> <Link to="/ueber-mario" className="text-primary hover:underline">Mario Schulter</Link> – Professioneller Trompeter, Musikpädagoge und Gründer von Trumpetstar</p>
            <p><strong>Zuletzt aktualisiert:</strong> 23. Februar 2026</p>
            <p><strong>Redaktion:</strong> Geprüft von unserem pädagogischen Beirat</p>
            <p><strong>Quellen:</strong> Instrumentenphysiologie-Studien, Didaktik-Forschung</p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center py-12 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4">Bereit durchzustarten?</h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
            Starte jetzt mit der kostenlosen Star-Lektion – ohne Anmeldung, sofort verfügbar. Überzeuge dich selbst von der Methode.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/kostenlos-starten">🎯 Gratis-Lektion starten</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/kurse">Pro-Kurs entdecken</Link>
            </Button>
          </div>
        </section>

      </div>
    </div>
  );
}
