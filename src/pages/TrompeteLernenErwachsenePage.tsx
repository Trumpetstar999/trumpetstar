import { FAQSchema } from "@/components/SEO/FAQSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Users, Clock, TrendingUp, Award, CheckCircle, ArrowRight, Star, BookOpen } from "lucide-react";
import { SEOPageLayout } from "@/components/seo/SEOPageLayout";

const faqs = [
  { question: "Kann ich mit 40/50/60 noch Trompete lernen?", answer: "Absolut! Unsere erfolgreichsten Wiedereinsteiger sind zwischen 35 und 65 Jahre alt. Erwachsene haben entscheidende Vorteile." },
  { question: "Lerne ich als Erwachsener schneller als Kinder?", answer: "In den ersten 6 Monaten oft ja! Erwachsene verstehen Anweisungen besser und üben zielgerichteter." },
  { question: "Wie viel Zeit muss ich investieren?", answer: "5-15 Minuten täglich reichen völlig aus. Die Regelmäßigkeit ist wichtiger als die Dauer." },
  { question: "Habe ich überhaupt Talent dafür?", answer: "Talent ist überschätzt. Bei der Trompete geht es um Technik und regelmäßiges Üben." },
  { question: "Was ist der Unterschied zum Kinder-Kurs?", answer: "Der Erwachsenen-Kurs geht schneller vor, nutzt andere Lernstrategien und behandelt Zeitmanagement." },
  { question: "Kann ich auch nach 20 Jahren Pause wieder anfangen?", answer: "Definitiv! Das Muskelgedächtnis ist erstaunlich. Viele Wiedereinsteiger sind nach 2-3 Monaten schnell wieder im Fluss." },
  { question: "Wie lange dauert es bis zum ersten Song?", answer: "Mit konsequentem Üben: Erster Ton in 1-2 Wochen, erste Melodie in 4-6 Wochen, erster Song in 8-12 Wochen." },
  { question: "Muss ich Noten lesen können?", answer: "Nein! Wir beginnen mit auditorischem Lernen. Notenlesen wird Schritt für Schritt eingeführt." },
  { question: "Was kostet der Einstieg?", answer: "Instrument: 200-400€ (Kauf) oder 25-35€/Monat (Miete). Basic-Kurs kostenlos, Pro-Kurs ab 29€/Monat." },
  { question: "Was wenn ich aufgeben will?", answer: "Das ist normal! Unsere App erkennt Inaktivität und schickt motivierende Erinnerungen. Unser Support hilft." }
];

const vorteileErwachsener = [
  { icon: Clock, title: "Zeiteffizienz", text: "10 Minuten fokussiertes Üben sind effektiver als 30 Minuten halbherzig." },
  { icon: TrendingUp, title: "Zielorientierung", text: "Sie wissen WARUM Sie lernen wollen und motivieren sich langfristig." },
  { icon: Award, title: "Muskelkontrolle", text: "Bessere Körperwahrnehmung und feinmotorische Kontrolle." },
  { icon: BookOpen, title: "Lernstrategien", text: "Wissen aus Beruf und Sport lässt sich auf Musik übertragen." }
];

export default function TrompeteLernenErwachsenePage() {
  return (
    <SEOPageLayout>
      <FAQSchema faqs={faqs} />

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/15">
            <Users className="h-4 w-4" />
            Speziell für Erwachsene
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Trompete lernen als Erwachsener:<br />
            <span className="text-gold-gradient">Nie zu spät für Musik</span>
          </h1>
          
          <p className="text-xl text-white/75 mb-8 max-w-2xl mx-auto">
            Mit 30, 40, 50 oder 60 – es ist nie zu spät. Unsere Methode ist für Berufstätige mit wenig Zeit optimiert.
          </p>

          <div className="glass rounded-2xl p-6 mb-8 max-w-2xl mx-auto text-left">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-[hsl(var(--reward-gold))] flex-shrink-0 mt-1" />
              <div>
                <p className="text-white"><strong>Der Fakt:</strong> Erwachsene lernen in den ersten 6 Monaten oft schneller als Kinder.</p>
                <p className="text-white/60 text-sm mt-1">Disziplin + Zielorientierung + richtige Methode = Erfolg</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" asChild>
              <Link to="/kurse/erwachsene">Pro-Kurs für Erwachsene</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
              <Link to="/webinar">Gratis-Webinar ansehen</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 pb-16">

        {/* Vorteile */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Warum Erwachsene oft besser lernen</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {vorteileErwachsener.map((v, idx) => (
              <Card key={idx} className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <v.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{v.title}</h3>
                      <p className="text-muted-foreground text-sm">{v.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Zeitplan */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Dein realistischer Zeitplan</h2>
          <div className="space-y-4">
            {[
              { color: "border-l-green-400", label: "Woche 1-2: Der erste Ton", time: "5-10 min/Tag", desc: "Mundstück-Position, Lippenschwingungen, erster klarer Ton." },
              { color: "border-l-primary", label: "Monat 1-2: Erste Melodien", time: "10-15 min/Tag", desc: "3-5 einfache Lieder, Grundrhythmen, erste Skala." },
              { color: "border-l-purple-400", label: "Monat 3-6: Song-Repertoire", time: "15 min/Tag", desc: "10-20 Songs, erweiterter Tonumfang, dynamisches Spielen." },
              { color: "border-l-[hsl(var(--reward-gold))]", label: "Jahr 1+: Fortgeschritten", time: "20-30 min/Tag", desc: "Komplexe Stücke, verschiedene Genres, Improvisation." },
            ].map((item, i) => (
              <Card key={i} className={`${item.color} border-l-4 hover-lift`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">{item.label}</h3>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Testimonial */}
        <section className="mb-16">
          <div className="glass rounded-2xl p-8">
            <div className="flex items-center gap-1 mb-4">
              {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-[hsl(var(--reward-gold))] text-[hsl(var(--reward-gold))]" />)}
            </div>
            <blockquote className="text-xl italic text-white mb-4">
              „Mit 52 Jahren dachte ich, das ist unmöglich. Jetzt, 8 Monate später, spiele ich bei unserem Firmen-Event vor Kollegen."
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-white font-bold">MK</div>
              <div>
                <p className="font-semibold text-white">Michael K.</p>
                <p className="text-sm text-white/60">52 Jahre, Projektmanager, München</p>
              </div>
            </div>
          </div>
        </section>

        {/* Methode */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Die Erwachsenen-Methode</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { num: "1", title: "Flexible Zeitplanung", desc: "Keine festen Termine. Übe wann es dir passt." },
              { num: "2", title: "Video-Begleitung", desc: "Schau dir Anweisungen so oft an wie nötig." },
              { num: "3", title: "Progress Tracking", desc: "Sieh deine Fortschritte in der App." },
            ].map((item, i) => (
              <Card key={i} className="text-center hover-lift">
                <CardContent className="p-6">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">{item.num}</span>
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
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
            <h2 className="text-2xl font-bold text-white mb-4">Das Wichtigste in Kürze</h2>
            <ul className="space-y-2">
              {[
                "Mit 30–60+ Jahren ist Trompete lernen absolut möglich",
                "Erwachsene haben entscheidende Lernvorteile",
                "5–15 Minuten täglich reichen – Regelmäßigkeit vor Dauer",
                "Erste Songs in 3–6 Monaten realistisch",
                "Spezielle Methode für Berufstätige entwickelt",
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
            <p><strong className="text-white/70">Autor:</strong> Mario Schulter – Professioneller Trompeter mit 25+ Jahren Erfahrung</p>
            <p><strong className="text-white/70">Aktualisiert:</strong> 23. Februar 2026</p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center glass rounded-2xl p-10">
          <h2 className="text-3xl font-bold text-white mb-4">Starte dein Trompeten-Abenteuer</h2>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">Überzeuge dich selbst mit unserem kostenlosen Webinar oder starte direkt durch.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" asChild>
              <Link to="/kurse/erwachsene">Pro-Kurs entdecken <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
              <Link to="/webinar">Gratis-Webinar ansehen</Link>
            </Button>
          </div>
        </section>
      </div>
    </SEOPageLayout>
  );
}
