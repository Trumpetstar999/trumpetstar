import { FAQSchema } from "@/components/SEO/FAQSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Baby, Clock, Heart, Music, HelpCircle, CheckCircle, Star, ArrowRight, AlertTriangle } from "lucide-react";

const faqs = [
  {
    question: "Ab welchem Alter kann mein Kind Trompete lernen?",
    answer: "Idealerweise ab 7-8 Jahren mit der normalen Trompete. Ab 6 Jahren empfehlen wir das Kornett (kleinere Version). Jünger als 6 Jahre ist selten sinnvoll, da die Milchzähne noch fehlen und die Lippenmuskulatur noch nicht ausreichend entwickelt ist."
  },
  {
    question: "Was ist der Unterschied zwischen Kornett und Trompete?",
    answer: "Das Kornett ist kompakter, leichter und hat eine weichere Klangfarbe. Es eignet sich perfekt für kleine Hände und weniger Lippenkraft. Nach 1-2 Jahren kann problemlos auf Trompete gewechselt werden – die Fingerführung ist identisch."
  },
  {
    question: "Wie halte ich mein Kind motiviert?",
    answer: "Kurze, tägliche Übungseinheiten (5-10 Minuten) statt langer Sessions. Kleine Erfolge feiern, Gamification nutzen (unsere App), gemeinsames Musizieren und vor allem: Geduld haben. Druck erzeugt Gegendruck."
  },
  {
    question: "Muss mein Kind Noten lesen können?",
    answer: "Nein! Wir beginnen mit auditorischem Lernen – Hören und Nachspielen. Notenlesen wird spielerisch ab Lektion 5 eingeführt, parallel zum praktischen Spielen."
  },
  {
    question: "Wie viel soll mein Kind üben?",
    answer: "5-10 Minuten täglich sind optimal für Kinder. Wichtiger als die Dauer ist die Regelmäßigkeit. Lieber 5 Minuten jeden Tag als einmal 30 Minuten."
  },
  {
    question: "Was kostet der Einstieg?",
    answer: "Kornett: 250-400€ (Kauf) oder 20-30€/Monat (Miete). Trompete: ähnliche Preise. Dazu kommt das Lehrbuch (ca. 30€) und unsere App (Basic kostenlos, Pro 9,90€/Monat)."
  },
  {
    question: "Soll mein Kind in eine Bläserklasse?",
    answer: "Bläserklassen sind ideal ab dem 2. Jahr, wenn Grundlagen sitzen. Sie fördern das Zusammenspiel und die Motivation. Vorbereitung mit unserer Methode ist empfohlen."
  },
  {
    question: "Mein Kind will aufhören – was tun?",
    answer: "Das ist normal! Fragen Sie nach dem Warum. Oft ist es Frustration über Fortschritte oder zu hoher Druck. Pausen sind okay. Unsere App erkennt Inaktivität und schickt motivierende Erinnerungen."
  },
  {
    question: "Kann ich selbst Trompete spielen lernen, um mein Kind zu begleiten?",
    answer: "Absolut! Viele Eltern starten parallel und machen es zum gemeinsamen Familienprojekt. Wir haben spezielle Eltern-Kind-Module im Pro-Kurs."
  },
  {
    question: "Ist Trompete lernen schwierig für Kinder?",
    answer: "Der erste Ton ist die größte Hürde (1-3 Wochen). Danach wird es kontinuierlich einfacher. Kinder haben oft schneller Erfolg als Erwachsene, weil sie weniger Zweifel haben und spielerischer üben."
  }
];

const altersGruppen = [
  {
    alter: "6-7 Jahre",
    instrument: "Kornett",
    dauer: "5 Min/Tag",
    merkmale: "Erste Melodien in 3-4 Monaten, spielerisches Lernen, Elternbegleitung wichtig"
  },
  {
    alter: "8-10 Jahre",
    instrument: "Kornett oder Trompete",
    dauer: "10 Min/Tag",
    merkmale: "Schnelle Fortschritte, Bläserklasse-ready nach 6-12 Monaten, eigenständiges Üben möglich"
  },
  {
    alter: "11-14 Jahre",
    instrument: "Trompete",
    dauer: "15 Min/Tag",
    merkmale: "Technik- und Höhenausbau, verschiedene Genres, Ensemblespiel"
  }
];

export default function TrompeteLernenKinderPage() {
  return (
    <div className="min-h-screen bg-background">
      <FAQSchema faqs={faqs} />

      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Baby className="h-4 w-4" />
            Für Eltern und ihre Musikstars
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Trompete lernen für Kinder:<br />
            <span className="text-amber-600">Der Eltern-Guide</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Ab welchem Alter? Kornett oder Trompete? Wie motiviere ich mein Kind? Alle Antworten für Eltern, die ihre Kinder musikalisch begleiten möchten.
          </p>

          <Card className="bg-white/80 backdrop-blur border-amber-200 mb-8 max-w-2xl mx-auto">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 text-left">
                <CheckCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-lg mb-2">
                    <strong>Die Kurzfassung:</strong> Kinder können ab 6 Jahren mit dem Kornett beginnen, ab 8 Jahren mit der Trompete. Täglich 5-10 Minuten üben, mit spielerischer Methode und viel Geduld.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-amber-600 hover:bg-amber-700" asChild>
              <Link to="/kurse/kinder">Kinder-Kurs entdecken</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/instrumenten-beratung">Kostenlose Beratung</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16">

        {/* Alters-Übersicht */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Der richtige Einstieg nach Alter</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {altersGruppen.map((gruppe, idx) => (
              <Card key={idx} className="h-full border-t-4 border-t-amber-400">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-amber-600 mb-2">{gruppe.alter}</div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Instrument:</span>
                      <p className="font-medium">{gruppe.instrument}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Übendauer:</span>
                      <p className="font-medium">{gruppe.dauer}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{gruppe.merkmale}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Kornett vs Trompete */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Kornett oder Trompete? Die Wahl für kleine Hände</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Music className="h-8 w-8 text-blue-600" />
                  <h3 className="text-xl font-semibold">Das Kornett</h3>
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-1" />
                    <span>Kompakter und leichter</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-1" />
                    <span>Ideal für 6-8 Jährige</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-1" />
                    <span>Weichere Klangfarbe</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-1" />
                    <span>Wechsel auf Trompete später problemlos</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Music className="h-8 w-8 text-amber-600" />
                  <h3 className="text-xl font-semibold">Die Trompete</h3>
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-1" />
                    <span>"Das echte Instrument"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-1" />
                    <span>Ab 8-9 Jahren geeignet</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-1" />
                    <span>Direkter Einstieg</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-1" />
                    <span>Kein Umstieg nötig</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <HelpCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-2">Unsere Empfehlung</h4>
                  <p className="text-green-800">
                    Für die meisten Kinder empfehlen wir den Einstieg mit dem <strong>Kornett</strong>. Die Erfolgserlebnisse kommen schneller, die Frustration ist geringer. Nach 1-2 Jahren erfolgt problemloser Wechsel auf Trompete. Bei größeren Kindern (ab 9 Jahre) kann direkt mit der Trompete begonnen werden.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Motivation */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Motivation: So bleibt Ihr Kind dran</h2>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Clock className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Kurze Einheiten statt langer Märsche</h3>
                    <p className="text-muted-foreground">
                      5-10 Minuten täglich sind effektiver als einmal 30 Minuten pro Woche. Die Konzentrationsspanne von Kindern ist begrenzt – nutzen Sie das! Unsere App unterteilt Übungen in kleine, machbare Häppchen.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Star className="h-8 w-8 text-amber-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Gamification & Belohnungen</h3>
                    <p className="text-muted-foreground">
                      Sterne sammeln, Level aufsteigen, Badges freischalten – unsere App macht Lernen spielerisch. Feiern Sie auch offline kleine Erfolge: Der erste Ton, die erste Melodie, der erste Song!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Heart className="h-8 w-8 text-red-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Gemeinsam musizieren</h3>
                    <p className="text-muted-foreground">
                      Spielen Sie mit Ihrem Kind zusammen – auch wenn Sie selbst nicht trompeten können. Klavierbegleitung, Rhythmuselemente oder einfach nur zuhören und applaudieren. Gemeinsame musikalische Erlebnisse stärken die Bindung.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Warnhinweis */}
        <section className="mb-16">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-2">Wichtig: Überlastung vermeiden</h4>
                  <p className="text-red-800">
                    Kinderliche Lippenmuskulatur ist empfindlich. Bei roten Lippen, Anspannung oder dem Wunsch aufzuhören: Pausieren! Nie zum Üben zwingen. Gesundes, freiwilliges Musizieren ist das Ziel.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Methode */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Die Star-Methode für Kinder</h2>
          
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center text-2xl">📚</div>
                <h3 className="font-semibold mb-2">1. Buch</h3>
                <p className="text-sm text-muted-foreground">Bunte Illustrationen, kindgerechte Erklärungen, QR-Codes zu Videos</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center text-2xl">📱</div>
                <h3 className="font-semibold mb-2">2. Videos</h3>
                <p className="text-sm text-muted-foreground">Visuelle Vorbilder, kindgerechte Anleitungen, Wiederholung möglich</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center text-2xl">🎮</div>
                <h3 className="font-semibold mb-2">3. App</h3>
                <p className="text-sm text-muted-foreground">Spielerische Übungen, Fortschritts-Tracking, Belohnungen</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center text-2xl">👨‍👩‍👧</div>
                <h3 className="font-semibold mb-2">4. Eltern</h3>
                <p className="text-sm text-muted-foreground">Begleitung, Motivation, gemeinsames Musizieren</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Häufige Fragen von Eltern</h2>
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
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Kurz zusammengefasst</h2>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Kinder können ab 6 Jahren (Kornett) bzw. 8 Jahren (Trompete) beginnen</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Kornett ist für kleine Hände ideal, Wechsel auf Trompete später problemlos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>5-10 Minuten täglich üben – Regelmäßigkeit vor Dauer</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Geduld und positive Begleitung sind wichtiger als Perfektionismus</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Spielerische Methoden mit Gamification halten die Motivation hoch</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="text-center py-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4">Bereit für den Musikstart Ihres Kindes?</h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
            Lassen Sie sich kostenlos beraten oder starten Sie direkt mit unserem Kinder-Kurs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-amber-600 hover:bg-amber-700" asChild>
              <Link to="/kurse/kinder">
                Kinder-Kurs entdecken <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/instrumenten-beratung">Kostenlose Beratung</Link>
            </Button>
          </div>
        </section>

      </div>
    </div>
  );
}
