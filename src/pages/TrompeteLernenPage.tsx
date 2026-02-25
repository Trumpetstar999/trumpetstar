import { FAQSchema } from "@/components/SEO/FAQSchema";
import { HowToSchema } from "@/components/SEO/HowToSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BookOpen, Video, Smartphone, Award, Clock, Users, Baby, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { SEOPageLayout } from "@/components/seo/SEOPageLayout";

const faqs = [
  { question: "Ab welchem Alter kann man Trompete lernen?", answer: "Kinder können ab 6-7 Jahren mit dem Kornett (kleinere Version) beginnen, ab 8-9 Jahren mit der normalen Trompete. Erwachsene können jederzeit starten – es ist nie zu spät." },
  { question: "Wie lange dauert es, Trompete zu lernen?", answer: "Für erste einfache Songs benötigt man 3-6 Monate bei regelmäßigem Üben (5-15 Minuten täglich). Fortgeschrittenes Spielen erreicht man nach 1-2 Jahren." },
  { question: "Kann man als Erwachsener noch Trompete lernen?", answer: "Absolut! Erwachsene haben Vorteile wie bessere Disziplin, Zielorientierung und Muskelkontrolle. Mit der richtigen Methode lernen Erwachsene oft effizienter als Kinder." },
  { question: "Wie viel muss ich täglich üben?", answer: "5-15 Minuten täglich sind ausreichend für Anfänger. Wichtiger als die Dauer ist die Regelmäßigkeit. Kurze, fokussierte Übungen sind effektiver als seltene, lange Sessions." },
  { question: "Was brauche ich zum Anfangen?", answer: "Eine Einsteiger-Trompete (oder Kornett für Kinder), ein Mundstück (meist inklusive), ein Lehrbuch (z.B. Trumpetstar Band 1) und unsere App mit Video-Begleitung." },
  { question: "Ist Trompete lernen schwierig?", answer: "Der erste Ton ist die größte Hürde. Mit der richtigen Methode (Lippenschwingungen, korrekter Ansatz) gelingt er in wenigen Tagen bis Wochen. Danach wird es kontinuierlich einfacher." },
  { question: "Was ist das Kornett?", answer: "Das Kornett ist eine kleinere, leichtere Variante der Trompete mit mehr Rundungen. Es ist ideal für Kinder ab 6-7 Jahren mit kleineren Händen und weniger Lippenkraft." },
  { question: "Kann ich Trompete selbst lernen oder brauche ich einen Lehrer?", answer: "Mit unserer Star-Methode (Buch + Videos + App) kannst du selbstständig lernen. Die Videos zeigen genau, wie es geht. Bei Problemen steht unser Support zur Verfügung." },
  { question: "Wie viel kostet eine Anfänger-Trompete?", answer: "Gute Einsteiger-Trompeten gibt es ab 200-300€ zu kaufen oder ab 20-30€/Monat zu mieten. Für Kinder empfiehlt sich das Kornett in ähnlicher Preislage." },
  { question: "Was ist die Star-Methode?", answer: "Die Star-Methode kombiniert ein Lehrbuch mit QR-Codes, Video-Tutorials und einer App mit Gamification. Sie wurde speziell für Anfänger und Erwachsene mit wenig Zeit entwickelt." }
];

const ersteSchritte = [
  { position: 1, name: "Instrument beschaffen", text: "Entscheide dich für Kauf oder Miete. Für Kinder ab 6-7 Jahren empfehlen wir das Kornett, für ältere Kinder und Erwachsene die normale Trompete." },
  { position: 2, name: "Lippenschwingungen üben (Buzzing)", text: "Beginne ohne Instrument: Versuche, mit geschlossenen Lippen ein brummendes Geräusch zu machen. Das ist die Basis für den ersten Ton." },
  { position: 3, name: "Mundstück probieren", text: "Setze das Mundstück mittig auf die Lippen. Die Oberlippe sollte etwas mehr bedeckt sein als die Unterlippe. Nicht zu fest drücken!" },
  { position: 4, name: "Ersten Ton erzeugen", text: "Stoße Luft durch die geschlossenen Lippen. Die Lippen beginnen zu schwingen und erzeugen den ersten Ton. Nicht aufgeben – das braucht oft mehrere Versuche!" },
  { position: 5, name: "Regelmäßig üben", text: "Übe täglich 5-10 Minuten. Nutze die Trumpetstar-App mit Video-Begleitung für strukturierte Lektionen und Fortschrittstracking." }
];

export default function TrompeteLernenPage() {
  return (
    <SEOPageLayout>
      <FAQSchema faqs={faqs} />
      <HowToSchema name="Trompete lernen: Erste Schritte für Anfänger" description="Schritt-für-Schritt-Anleitung zum Erlernen der Trompete" steps={ersteSchritte} />

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Trompete lernen: Der komplette Guide für Anfänger (2026)
          </h1>
          <p className="text-xl text-white/75 mb-8 max-w-2xl mx-auto">
            Trompete lernen ist mit der richtigen Methode in 3–6 Monaten möglich – egal ob als Kind, Erwachsener oder Wiedereinsteiger.
          </p>
          
          <div className="glass rounded-2xl p-6 mb-8 max-w-2xl mx-auto text-left">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-[hsl(var(--reward-gold))] flex-shrink-0 mt-1" />
              <p className="text-white">
                <strong>Kurz gesagt:</strong> Trompete lernen dauert 3–6 Monate für erste Songs. Kinder ab 7 Jahren und Erwachsene können mit der Star-Methode effizient lernen. Täglich 5–15 Minuten sind ausreichend.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" asChild>
              <Link to="/auth">Kurs entdecken</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 pb-16">

        {/* Video */}
        <section className="mb-16">
          <div className="rounded-2xl overflow-hidden shadow-2xl aspect-video">
            <iframe
              src="https://player.vimeo.com/video/995373130"
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>

        {/* Für wen */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Für wen ist Trompete lernen geeignet?</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Baby className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-semibold">Kinder & Jugendliche</h3>
                </div>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li>• Ab 6-7 Jahren mit Kornett möglich</li>
                  <li>• Ab 8-9 Jahren mit normaler Trompete</li>
                  <li>• Ideale Ergänzung zur Bläserklasse</li>
                  <li>• Fördert Konzentration und Disziplin</li>
                </ul>
                <Button variant="link" className="mt-4 text-primary p-0" asChild>
                  <Link to="/trompete-lernen-kinder">Mehr zu Kinder →</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-semibold">Erwachsene</h3>
                </div>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li>• Jederzeit möglich – nie zu spät!</li>
                  <li>• Schnellerer Lernfortschritt als Kinder</li>
                  <li>• Perfekt für Berufstätige (5 Min/Tag)</li>
                  <li>• Wiedereinsteiger willkommen</li>
                </ul>
                <Button variant="link" className="mt-4 text-primary p-0" asChild>
                  <Link to="/trompete-lernen-erwachsene">Mehr zu Erwachsene →</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Star-Methode */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Die Star-Methode: Modernes Trompete-Lernen</h2>
          <p className="text-lg text-white/70 mb-8">
            Die Star-Methode wurde von <Link to="/ueber-mario" className="text-[hsl(var(--reward-gold))] hover:underline">Mario Schulter</Link> entwickelt und verbindet bewährte Unterrichtsmethoden mit moderner Technologie.
          </p>
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: BookOpen, title: "1. Buch", desc: "Strukturierter Lehrplan mit QR-Codes" },
              { icon: Video, title: "2. Videos", desc: "Jeder Schritt visuell erklärt" },
              { icon: Smartphone, title: "3. App", desc: "Interaktive Übungen & Tracking" },
              { icon: Award, title: "4. Gamification", desc: "Belohnungen für Fortschritte" },
            ].map((item, i) => (
              <Card key={i} className="text-center hover-lift">
                <CardContent className="p-6">
                  <item.icon className="h-10 w-10 mx-auto mb-3 text-primary" />
                  <h4 className="font-semibold mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="glass rounded-2xl p-6 mb-8">
            <h4 className="font-semibold flex items-center gap-2 mb-3 text-white">
              <BookOpen className="h-5 w-5 text-[hsl(var(--reward-gold))]" />
              Was bedeutet "Ansatz"?
            </h4>
            <p className="text-white/75 text-sm">
              Der Ansatz (auch <em>Embouchure</em>) beschreibt die Lippenstellung am Mundstück. Ein korrekter Ansatz ist die Basis für guten Ton. <strong className="text-white">Zu fest = kein Ton, zu locker = Luft entweicht.</strong> In unserem <Link to="/trompete-ansatz-atmung" className="text-[hsl(var(--reward-gold))] hover:underline">Ansatz-Guide</Link> zeigen wir die optimale Technik.
            </p>
          </div>
        </section>

        {/* Erste Schritte */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Deine ersten Schritte</h2>
          <div className="space-y-4">
            {ersteSchritte.map((schritt) => (
              <Card key={schritt.position} className="border-l-4 border-l-primary hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {schritt.position}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{schritt.name}</h3>
                      <p className="text-muted-foreground text-sm">{schritt.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="glass rounded-xl p-5 mt-6 border border-[hsl(var(--accent-red))]/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-[hsl(var(--accent-red))] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white mb-1">Wichtig: Überlastung vermeiden</h4>
                <p className="text-white/75 text-sm">
                  Beginne mit maximal 10 Minuten täglich. Die Lippenmuskulatur braucht Zeit. Bei Schmerzen sofort pausieren!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Praxisbeispiel */}
        <section className="mb-16">
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-2">Erfahrung aus der Praxis</h4>
                  <blockquote className="text-muted-foreground italic mb-2 text-sm">
                    "Ich habe mit 45 Jahren begonnen und dachte, es ist zu spät. Nach 3 Monaten mit der Star-Methode spiele ich meine ersten Songs!"
                  </blockquote>
                  <p className="text-xs text-muted-foreground">— Peter M., Wien, Pro-Kurs Teilnehmer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Zeitplan */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Wie lange dauert es wirklich?</h2>
          <div className="space-y-3">
            {[
              { label: "Woche 1-2: Der erste Ton", desc: "Lippenschwingungen, Mundstück-Position, erster Ton" },
              { label: "Monat 1-3: Erste Melodien", desc: "5-10 einfache Songs, Grundtonarten, Rhythmus" },
              { label: "Monat 3-6: Bläserklasse-ready", desc: "20+ Songs, erweiterter Tonumfang, dynamisch" },
              { label: "Jahr 1-2: Fortgeschritten", desc: "Komplexe Stücke, Improvisation, Stilrichtungen" },
            ].map((item, i) => (
              <div key={i} className="glass rounded-xl p-4 flex items-center gap-4">
                <Clock className="h-7 w-7 text-[hsl(var(--reward-gold))] flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-white text-sm">{item.label}</h4>
                  <p className="text-xs text-white/60">{item.desc}</p>
                </div>
              </div>
            ))}
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
                "Trompete lernen ist in 3–6 Monaten realistisch für erste Songs",
                "Kinder ab 7 Jahren (Kornett), Erwachsene jederzeit möglich",
                "Star-Methode: Buch + QR-Codes + Videos + App",
                "Täglich 5–15 Minuten Üben sind ausreichend",
                "Kostenloser Start mit Gratis-Lektion möglich",
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-[hsl(var(--reward-gold))] flex-shrink-0 mt-0.5" />
                  <span className="text-white/85 text-sm">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* E-E-A-T */}
        <section className="mb-16 border-t border-white/10 pt-8">
          <div className="text-sm text-white/50 space-y-1">
            <p><strong className="text-white/70">Autor:</strong> Mario Schulter – Professioneller Trompeter, Musikpädagoge</p>
            <p><strong className="text-white/70">Aktualisiert:</strong> 23. Februar 2026</p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center glass rounded-2xl p-10">
          <h2 className="text-3xl font-bold text-white mb-4">Bereit durchzustarten?</h2>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">
            Starte jetzt mit der kostenlosen Star-Lektion – ohne Anmeldung, sofort verfügbar.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" asChild>
              <Link to="/auth">Kurs entdecken</Link>
            </Button>
          </div>
        </section>
      </div>
    </SEOPageLayout>
  );
}
