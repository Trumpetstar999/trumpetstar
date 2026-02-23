import { FAQSchema } from "@/components/SEO/FAQSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Users, Clock, TrendingUp, Award, CheckCircle, ArrowRight, Star, BookOpen } from "lucide-react";

const faqs = [
  {
    question: "Kann ich mit 40/50/60 noch Trompete lernen?",
    answer: "Absolut! Es ist nie zu spät. Unsere erfolgreichsten Wiedereinsteiger sind zwischen 35 und 65 Jahre alt. Erwachsene haben entscheidende Vorteile: Disziplin, Zielorientierung und bessere Muskelkontrolle."
  },
  {
    question: "Lerne ich als Erwachsener schneller als Kinder?",
    answer: "In den ersten 6 Monaten oft ja! Erwachsene verstehen Anweisungen besser, üben zielgerichteter und haben mehr intrinsische Motivation. Kinder holen nach 1-2 Jahren auf, da sie mehr Zeit haben."
  },
  {
    question: "Wie viel Zeit muss ich investieren?",
    answer: "5-15 Minuten täglich reichen völlig aus. Die Regelmäßigkeit ist wichtiger als die Dauer. Viele unserer erfolgreichen Teilnehmer üben morgens vor der Arbeit oder abends nach dem Essen."
  },
  {
    question: "Habe ich überhaupt Talent dafür?",
    answer: "Talent ist überschätzt. Bei der Trompete geht es um Technik und regelmäßiges Üben. Mit der richtigen Methode kann jeder Erwachsene in 3-6 Monaten erste Songs spielen."
  },
  {
    question: "Was ist der Unterschied zum Kinder-Kurs?",
    answer: "Der Erwachsenen-Kurs geht schneller vor, nutzt andere Lernstrategien (Visualisierung, analytisches Verstehen) und behandelt Themen wie Zeitmanagement, Motivation und gesundes Üben im Berufsalltag."
  },
  {
    question: "Kann ich auch nach 20 Jahren Pause wieder anfangen?",
    answer: "Definitiv! Das Muskelgedächtnis ist erstaunlich. Viele Wiedereinsteiger sind nach 2-3 Monaten schneller wieder im Fluss als absolute Anfänger. Wir haben spezielle Programme für Rostlöser."
  },
  {
    question: "Wie lange dauert es bis zum ersten Song?",
    answer: "Mit konsequentem Üben (5-10 Min/Tag): Erster Ton in 1-2 Wochen, erste einfache Melodie in 4-6 Wochen, erster kompletter Song in 8-12 Wochen."
  },
  {
    question: "Muss ich Noten lesen können?",
    answer: "Nein! Wir beginnen mit auditorischem Lernen (Hören-Nachspielen). Notenlesen wird Schritt für Schritt eingeführt, parallel zum praktischen Spielen."
  },
  {
    question: "Was kostet der Einstieg?",
    answer: "Instrument: 200-400€ (Kauf) oder 25-35€/Monat (Miete). Unser Basic-Kurs startet kostenlos, der Pro-Kurs für Erwachsene ist ab 29€/Monat verfügbar."
  },
  {
    question: "Was wenn ich aufgeben will?",
    answer: "Das ist normal! Jeder hat Tiefs. Unsere App erkennt Inaktivität und schickt motivierende Erinnerungen. Unser Support-Team steht per Chat zur Verfügung. Die Community hilft ebenfalls."
  }
];

const vorteileErwachsener = [
  {
    icon: Clock,
    title: "Zeiteffizienz",
    text: "Erwachsene nutzen die begrenzte Zeit zielgerichteter. 10 Minuten fokussiertes Üben sind effektiver als 30 Minuten halbherzig."
  },
  {
    icon: TrendingUp,
    title: "Zielorientierung",
    text: "Sie wissen WARUM Sie lernen wollen und können sich langfristig motivieren. Kein 'Eltern zwingen mich'."
  },
  {
    icon: Award,
    title: "Muskelkontrolle",
    text: "Bessere Körperwahrnehmung und feinmotorische Kontrolle der Lippen- und Atemmuskulatur."
  },
  {
    icon: BookOpen,
    title: "Lernstrategien",
    text: "Wissen aus anderen Lebensbereichen (Beruf, Sport) lässt sich auf Musik übertragen."
  }
];

export default function TrompeteLernenErwachsenePage() {
  return (
    <div className="min-h-screen bg-background">
      <FAQSchema faqs={faqs} />

      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Users className="h-4 w-4" />
            Speziell für Erwachsene entwickelt
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Trompete lernen als Erwachsener:<br />
            <span className="text-primary">Nie zu spät für Musik</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Mit 30, 40, 50 oder 60 Jahren – es ist nie zu spät, Trompete zu lernen. Unsere Methode ist speziell für Berufstätige mit wenig Zeit optimiert. Täglich 5–15 Minuten genügen.
          </p>

          <Card className="bg-white/80 backdrop-blur border-primary/20 mb-8 max-w-2xl mx-auto">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 text-left">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="text-lg mb-2">
                    <strong>Der Fakt:</strong> Erwachsene lernen in den ersten 6 Monaten oft schneller als Kinder.
                  </p>
                  <p className="text-muted-foreground">
                    Disziplin + Zielorientierung + richtige Methode = Erfolg
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/kurse/erwachsene">Pro-Kurs für Erwachsene</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/webinar">Gratis-Webinar ansehen</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">

        {/* Warum Erwachsene */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Warum Erwachsene oft besser lernen als Kinder
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {vorteileErwachsener.map((vorteil, idx) => (
              <Card key={idx} className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <vorteil.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{vorteil.title}</h3>
                      <p className="text-muted-foreground text-sm">{vorteil.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Zeitplan */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Dein realistischer Zeitplan</h2>
          
          <div className="space-y-4">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">Woche 1-2: Der erste Ton</h3>
                  <span className="text-sm text-muted-foreground">5-10 min/Tag</span>
                </div>
                <p className="text-muted-foreground">
                  Mundstück-Position, Lippenschwingungen, erster klarer Ton. Die größte Hürde – danach wird es einfacher!
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">Monat 1-2: Erste Melodien</h3>
                  <span className="text-sm text-muted-foreground">10-15 min/Tag</span>
                </div>
                <p className="text-muted-foreground">
                  3-5 einfache Lieder, Grundrhythmen, erste Skala. Du wirst überrascht sein, wie schnell Fortschritte sichtbar werden.
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">Monat 3-6: Song-Repertoire</h3>
                  <span className="text-sm text-muted-foreground">15 min/Tag</span>
                </div>
                <p className="text-muted-foreground">
                  10-20 Songs, erweiterter Tonumfang, dynamisches Spielen. Zeit für die erste Jam-Session oder Bläserklasse!
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">Jahr 1+: Fortgeschritten</h3>
                  <span className="text-sm text-muted-foreground">20-30 min/Tag</span>
                </div>
                <p className="text-muted-foreground">
                  Komplexe Stücke, verschiedene Genres, Improvisation. Die Trompete wird zu deinem ständigen Begleiter.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Testimonial */}
        <section className="mb-16">
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardContent className="p-8">
              <div className="flex items-center gap-1 mb-4">
                {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-primary text-primary" />)}
              </div>
              <blockquote className="text-xl italic mb-4">
                „Mit 52 Jahren dachte ich, das ist unmöglich. Jetzt, 8 Monate später, spiele ich bei unserem Firmen-Event vor Kollegen. Die Methode mit kurzen Videos passt perfekt in meinen Alltag als Manager."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  MK
                </div>
                <div>
                  <p className="font-semibold">Michael K.</p>
                  <p className="text-sm text-muted-foreground">52 Jahre, Projektmanager, München</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Methode */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Die Erwachsenen-Methode</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold mb-2">Flexible Zeitplanung</h3>
                <p className="text-sm text-muted-foreground">
                  Keine festen Termine. Übe wann es dir passt – morgens, mittags oder abends.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-semibold mb-2">Video-Begleitung</h3>
                <p className="text-sm text-muted-foreground">
                  Schau dir Anweisungen so oft an wie nötig. Pause, zurück, wiederholen.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-semibold mb-2">Progress Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Siehe deine Fortschritte in der App. Kleine Erfolge halten motiviert.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Häufige Fragen von Erwachsenen</h2>
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
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Das Wichtigste in Kürze</h2>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Mit 30–60+ Jahren ist Trompete lernen absolut möglich</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Erwachsene haben entscheidende Lernvorteile</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>5–15 Minuten täglich reichen – Regelmäßigkeit vor Dauer</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Erste Songs in 3–6 Monaten realistisch</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Spezielle Methode für Berufstätige entwickelt</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* E-E-A-T */}
        <section className="mb-8 border-t pt-8">
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Autor:</strong> Mario Schulter – Professioneller Trompeter mit 25+ Jahren Erfahrung, Musikpädagoge und Spezialist für Erwachsenenbildung</p>
            <p><strong>Zuletzt aktualisiert:</strong> 23. Februar 2026</p>
            <p><strong>Methodik:</strong> Basierend auf aktueller Didaktik-Forschung und 10.000+ erfolgreichen Teilnehmern</p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center py-12 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4">Starte dein Trompeten-Abenteuer</h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
            Überzeuge dich selbst mit unserem kostenlosen Webinar oder starte direkt durch mit dem Pro-Kurs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/kurse/erwachsene">
                Pro-Kurs entdecken <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/webinar">Gratis-Webinar ansehen</Link>
            </Button>
          </div>
        </section>

      </div>
    </div>
  );
}
