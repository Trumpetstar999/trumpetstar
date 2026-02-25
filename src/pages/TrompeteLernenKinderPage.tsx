import { FAQSchema } from "@/components/SEO/FAQSchema";
import lernweltImg from "@/assets/trumpetstar-lernwelt.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Baby, Clock, Heart, Music, HelpCircle, CheckCircle, Star, ArrowRight, AlertTriangle } from "lucide-react";
import { SEOPageLayout } from "@/components/seo/SEOPageLayout";

const faqs = [
  { question: "Ab welchem Alter kann mein Kind Trompete lernen?", answer: "Idealerweise ab 7-8 Jahren mit der normalen Trompete. Ab 6 Jahren empfehlen wir das Kornett (kleinere Version)." },
  { question: "Was ist der Unterschied zwischen Kornett und Trompete?", answer: "Das Kornett ist kompakter, leichter und hat eine weichere Klangfarbe. Es eignet sich perfekt für kleine Hände." },
  { question: "Wie halte ich mein Kind motiviert?", answer: "Kurze, tägliche Übungseinheiten (5-10 Minuten) statt langer Sessions. Kleine Erfolge feiern, Gamification nutzen." },
  { question: "Muss mein Kind Noten lesen können?", answer: "Nein! Wir beginnen mit auditorischem Lernen – Hören und Nachspielen. Notenlesen wird spielerisch eingeführt." },
  { question: "Wie viel soll mein Kind üben?", answer: "5-10 Minuten täglich sind optimal. Wichtiger als die Dauer ist die Regelmäßigkeit." },
  { question: "Was kostet der Einstieg?", answer: "Kornett: 250-400€ (Kauf) oder 20-30€/Monat (Miete). Dazu kommt das Lehrbuch (ca. 30€) und unsere App." },
  { question: "Soll mein Kind in eine Bläserklasse?", answer: "Bläserklassen sind ideal ab dem 2. Jahr, wenn Grundlagen sitzen. Vorbereitung mit unserer Methode ist empfohlen." },
  { question: "Mein Kind will aufhören – was tun?", answer: "Das ist normal! Fragen Sie nach dem Warum. Oft ist es Frustration. Pausen sind okay." },
  { question: "Kann ich selbst Trompete spielen lernen, um mein Kind zu begleiten?", answer: "Absolut! Viele Eltern starten parallel. Wir haben spezielle Eltern-Kind-Module im Pro-Kurs." },
  { question: "Ist Trompete lernen schwierig für Kinder?", answer: "Der erste Ton ist die größte Hürde. Danach wird es kontinuierlich einfacher." }
];

const altersGruppen = [
  { alter: "6-7 Jahre", instrument: "Kornett", dauer: "5 Min/Tag", merkmale: "Erste Melodien in 3-4 Monaten, spielerisches Lernen" },
  { alter: "8-10 Jahre", instrument: "Kornett oder Trompete", dauer: "10 Min/Tag", merkmale: "Schnelle Fortschritte, Bläserklasse-ready nach 6-12 Monaten" },
  { alter: "11-14 Jahre", instrument: "Trompete", dauer: "15 Min/Tag", merkmale: "Technik- und Höhenausbau, verschiedene Genres" }
];

export default function TrompeteLernenKinderPage() {
  return (
    <SEOPageLayout>
      <FAQSchema faqs={faqs} />

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[hsl(var(--reward-gold))]/15 text-[hsl(var(--reward-gold))] px-4 py-2 rounded-full text-sm font-medium mb-6 border border-[hsl(var(--reward-gold))]/25">
            <Baby className="h-4 w-4" />
            Für Eltern und ihre Musikstars
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Trompete lernen für Kinder:<br />
            <span className="text-gold-gradient">Der Eltern-Guide</span>
          </h1>
          
          <p className="text-xl text-white/75 mb-8 max-w-2xl mx-auto">
            Ab welchem Alter? Kornett oder Trompete? Wie motiviere ich mein Kind? Alle Antworten für Eltern.
          </p>

          <div className="glass rounded-2xl p-6 mb-8 max-w-2xl mx-auto text-left">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-[hsl(var(--reward-gold))] flex-shrink-0 mt-1" />
              <p className="text-white">
                <strong>Die Kurzfassung:</strong> Kinder können ab 6 Jahren mit dem Kornett beginnen, ab 8 Jahren mit der Trompete. Täglich 5-10 Minuten, mit spielerischer Methode und Geduld.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" asChild>
              <Link to="/auth">Kinder-Kurs entdecken</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
              <a href="mailto:valentin@trumpetstar.com?subject=Kostenlose%20Beratung&body=Ich%20m%C3%B6chte%20eine%20Beratung%20-%20Der%20Eltern-Guide.">Kostenlose Beratung</a>
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 pb-16">

        {/* Lernwelt Bild */}
        <section className="mb-16">
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={lernweltImg}
              alt="Deine multimediale Lernwelt für Trompete – Trumpetstar"
              className="w-full h-auto object-cover"
            />
          </div>
        </section>

        {/* Alters-Übersicht */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Der richtige Einstieg nach Alter</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {altersGruppen.map((gruppe, idx) => (
              <Card key={idx} className="h-full hover-lift border-t-4 border-t-[hsl(var(--reward-gold))]">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-primary mb-2">{gruppe.alter}</div>
                  <div className="space-y-3">
                    <div><span className="text-xs text-muted-foreground">Instrument:</span><p className="font-medium text-sm">{gruppe.instrument}</p></div>
                    <div><span className="text-xs text-muted-foreground">Übendauer:</span><p className="font-medium text-sm">{gruppe.dauer}</p></div>
                    <p className="text-xs text-muted-foreground">{gruppe.merkmale}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Kornett vs Trompete */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Kornett oder Trompete?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Music className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-semibold">Das Kornett</h3>
                </div>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  {["Kompakter und leichter", "Ideal für 6-8 Jährige", "Weichere Klangfarbe", "Wechsel auf Trompete problemlos"].map((t, i) => (
                    <li key={i} className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" /><span>{t}</span></li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Music className="h-8 w-8 text-[hsl(var(--reward-gold))]" />
                  <h3 className="text-xl font-semibold">Die Trompete</h3>
                </div>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  {["Das echte Instrument", "Ab 8-9 Jahren geeignet", "Direkter Einstieg", "Kein Umstieg nötig"].map((t, i) => (
                    <li key={i} className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-[hsl(var(--reward-gold))] flex-shrink-0 mt-0.5" /><span>{t}</span></li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl mt-6">
            <iframe
              src="https://player.vimeo.com/video/469638164?title=0&byline=0&portrait=0&dnt=1"
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
              title="Kornett oder Trompete für Kinder"
            />
          </div>

          <div className="glass rounded-xl p-5 mt-6">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-6 w-6 text-[hsl(var(--reward-gold))] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white mb-1">Unsere Empfehlung</h4>
                <p className="text-white/75 text-sm">
                  Für die meisten Kinder empfehlen wir den Einstieg mit dem <strong className="text-white">Kornett</strong>. Erfolgserlebnisse kommen schneller, die Frustration ist geringer.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Motivation */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Motivation: So bleibt Ihr Kind dran</h2>
          <div className="space-y-4">
            {[
              { icon: Clock, color: "text-primary", title: "Kurze Einheiten statt langer Märsche", desc: "5-10 Minuten täglich sind effektiver als einmal 30 Minuten pro Woche." },
              { icon: Star, color: "text-[hsl(var(--reward-gold))]", title: "Gamification & Belohnungen", desc: "Sterne sammeln, Level aufsteigen – unsere App macht Lernen spielerisch." },
              { icon: Heart, color: "text-[hsl(var(--accent-red))]", title: "Gemeinsam musizieren", desc: "Spielen Sie mit Ihrem Kind zusammen – gemeinsame Erlebnisse stärken die Bindung." },
            ].map((item, i) => (
              <Card key={i} className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <item.icon className={`h-7 w-7 ${item.color} flex-shrink-0`} />
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">{item.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Warnhinweis */}
        <section className="mb-16">
          <div className="glass rounded-xl p-5 border border-[hsl(var(--accent-red))]/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-[hsl(var(--accent-red))] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white mb-1">Wichtig: Überlastung vermeiden</h4>
                <p className="text-white/75 text-sm">
                  Kinderliche Lippenmuskulatur ist empfindlich. Bei roten Lippen oder Anspannung: Pausieren! Nie zum Üben zwingen.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Methode */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Die Star-Methode für Kinder</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { emoji: "📚", title: "1. Buch", desc: "Bunte Illustrationen, QR-Codes zu Videos" },
              { emoji: "📱", title: "2. Videos", desc: "Kindgerechte Anleitungen, Wiederholung" },
              { emoji: "🎮", title: "3. App", desc: "Spielerische Übungen, Belohnungen" },
              { emoji: "👨‍👩‍👧", title: "4. Eltern", desc: "Begleitung, gemeinsames Musizieren" },
            ].map((item, i) => (
              <Card key={i} className="text-center hover-lift">
                <CardContent className="p-6">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center text-2xl">{item.emoji}</div>
                  <h3 className="font-semibold mb-1 text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Häufige Fragen von Eltern</h2>
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
                "Kinder können ab 6 Jahren (Kornett) bzw. 8 Jahren (Trompete) beginnen",
                "Kornett ist für kleine Hände ideal, Wechsel später problemlos",
                "5-10 Minuten täglich – Regelmäßigkeit vor Dauer",
                "Geduld und positive Begleitung sind der Schlüssel",
                "Spielerische Methoden mit Gamification halten motiviert",
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
          <h2 className="text-3xl font-bold text-white mb-4">Bereit für den Musikstart Ihres Kindes?</h2>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">Starten Sie direkt mit unserem Kinder-Kurs oder lassen Sie sich beraten.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" asChild>
              <Link to="/auth">Kinder-Kurs entdecken <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
              <a href="mailto:valentin@trumpetstar.com?subject=Kostenlose%20Beratung&body=Ich%20m%C3%B6chte%20eine%20Beratung%20-%20Der%20Eltern-Guide.">Kostenlose Beratung</a>
            </Button>
          </div>
        </section>
      </div>
    </SEOPageLayout>
  );
}
