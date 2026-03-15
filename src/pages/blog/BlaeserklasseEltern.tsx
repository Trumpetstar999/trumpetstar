import { Link } from "react-router-dom";
import { SEOPageLayout } from "@/components/seo/SEOPageLayout";
import { AnimatedSection } from "@/components/seo/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle, School } from "lucide-react";

export default function BlaeserklasseEltern() {
  return (
    <SEOPageLayout>
      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection direction="up">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/15">
              <School className="h-4 w-4" /> Eltern-Info
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Bläserklasse – das müssen Eltern wissen
            </h1>
            <p className="text-white/70 text-lg mb-3">
              Ihr Kind kommt in die Bläserklasse? Wir erklären Ablauf, Kosten, Instrument und wie Sie Ihr Kind optimal unterstützen können.
            </p>
            <p className="text-white/50 text-sm">15. März 2026 · 7 Min Lesezeit · Von Valentin | TrumpetStar</p>
          </AnimatedSection>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 pb-20 space-y-8">

        {/* TL;DR */}
        <AnimatedSection direction="up">
          <Card>
            <CardContent className="p-5">
              <p className="font-bold text-sm mb-3 text-white">TL;DR – Das Wichtigste auf einen Blick</p>
              <ul className="space-y-1">
                {[
                  "Bläserklassen sind schulbasierte Bläserunterrichts-Programme – meistens in Klasse 3–6",
                  "Kinder lernen gemeinsam ein Blasinstrument, oft mit Auswahl zwischen Trompete, Klarinette, Flöte, Saxofon etc.",
                  "Eltern tragen in der Regel die Instrumentenkosten (Miete oder Kauf)",
                  "Regelmäßiges Üben zu Hause ist entscheidend für den Fortschritt",
                  "Trumpetstar kann als digitale Ergänzung zum Bläserklassen-Unterricht genutzt werden",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-[hsl(var(--reward-gold))] shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Was ist eine Bläserklasse */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Was ist eine Bläserklasse?</h2>
          <p className="text-white/70 mb-4">Eine Bläserklasse ist ein schulisches Musik-Unterrichtsprogramm, bei dem eine ganze Klasse (oder Gruppe) gleichzeitig Blasinstrumente erlernt. Typische Merkmale:</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            {[
              "Findet im Rahmen des regulären Schulunterrichts statt (oft 1–2 Stunden/Woche)",
              "Kinder wählen zu Beginn ihr Instrument (innerhalb des Angebots)",
              "Unterricht durch einen spezialisierten Musiklehrer",
              "Am Ende des Schuljahres oft ein Konzert oder Auftritt",
            ].map((item, i) => (
              <Card key={i}>
                <CardContent className="p-3 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">{item}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-white/60 text-sm italic">Verbreitung: Bläserklassen finden sich vor allem in Klasse 3–6 an Grundschulen und weiterführenden Schulen, sowohl in Deutschland als auch in Österreich.</p>
        </AnimatedSection>

        {/* Instrument-Wahl */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Welches Instrument können Kinder in der Bläserklasse wählen?</h2>
          <p className="text-white/70 mb-3">Das variiert je nach Schule und Programm. Typische Angebote:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {["Trompete (häufig)", "Klarinette", "Querflöte", "Saxofon", "Posaune", "Tuba / Euphonium (seltener)"].map((item, i) => (
              <Card key={i}>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">{item}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-sm text-white/80"><strong className="text-white">Hinweis für Eltern:</strong> Lassen Sie Ihr Kind mitentscheiden, welches Instrument es möchte. Ein Kind, das das Instrument selbst gewählt hat, ist motivierter. Informieren Sie sich über die Nachfrage – bei Trompete oder Posaune gibt es oft mehr Plätze.</p>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Kosten */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Kosten – was kommt auf Eltern zu?</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Card className="border-l-4 border-l-green-400">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-white mb-2">✅ Was die Schule übernimmt (meistens)</p>
                <ul className="space-y-1">
                  {[
                    "Den Unterricht selbst",
                    "Oft: Notenmaterial, Lehrbücher",
                    "Manchmal: Leihgebühr für das Instrument (subventioniert)",
                  ].map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                      <CheckCircle className="w-3 h-3 text-green-400 shrink-0 mt-0.5" /> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-400">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-white mb-2">📋 Was Eltern meistens selbst tragen</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <tbody className="text-muted-foreground">
                      {[
                        ["Instrumentenmiete (Monat)", "10–25 €"],
                        ["Kauf Schülerinstrument", "150–400 €"],
                        ["Mundstück (falls nicht dabei)", "15–30 €"],
                        ["Reinigungszubehör", "10–20 €"],
                        ["Notenmaterial (falls nicht gestellt)", "10–30 €"],
                      ].map(([pos, kosten], i) => (
                        <tr key={i} className="border-b border-white/5">
                          <td className="py-1 pr-2">{pos}</td>
                          <td className="py-1 text-white/60">{kosten}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
          <p className="text-white/50 text-xs italic">Tipp: Fragen Sie bei der Schule explizit nach Förderungen oder Leihprogrammen. Viele Gemeinden und Schulträger haben Instrumente im Bestand, die kostenlos oder günstig verliehen werden.</p>
        </AnimatedSection>

        {/* Jahresplan */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Wie läuft eine Bläserklasse ab?</h2>
          <h3 className="text-lg font-semibold text-white mb-3">Typischer Jahresplan</h3>
          <div className="space-y-3 mb-4">
            {[
              ["Erstes Quartal", "Grundlagen – Töne erzeugen, Haltung, erste Noten", "border-l-green-400"],
              ["Zweites Quartal", "Einfache Melodien, Rhythmusgefühl, Notenlesen", "border-l-blue-400"],
              ["Drittes Quartal", "Mehrstimmigkeit, Ensemble-Spiel, erstes gemeinsames Repertoire", "border-l-primary"],
              ["Viertes Quartal", "Vorbereitung auf das Schuljahreskonzert", "border-l-[hsl(var(--reward-gold))]"],
            ].map(([quartal, inhalt, border], i) => (
              <AnimatedSection key={i} direction="left" delay={i * 60}>
                <Card className={`border-l-4 ${border}`}>
                  <CardContent className="p-4">
                    <p className="font-semibold text-sm">{quartal}</p>
                    <p className="text-xs text-muted-foreground">{inhalt}</p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
          <h3 className="text-lg font-semibold text-white mb-3">Was von Kindern erwartet wird</h3>
          <div className="space-y-2">
            {[
              "Regelmäßige Teilnahme am Unterricht",
              "Üben zu Hause – das ist der entscheidende Unterschied zwischen Fortschritt und Stagnation",
              "Instrument zur Schule mitnehmen",
              "Hausaufgaben (Übungsaufgaben)",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* Als Elternteil unterstützen */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Schritt für Schritt: Als Elternteil unterstützen</h2>
          <div className="space-y-3">
            {[
              ["Schritt 1 – Übe-Routine etablieren", "Fester Zeitpunkt täglich (10–15 Minuten). Kein Druck, aber Konsequenz. Der Vergleich: Lesen lernt man auch nicht ohne tägliches Üben."],
              ["Schritt 2 – Ruhige Übeumgebung schaffen", "Kinder üben besser ohne Ablenkung. Das Zimmer oder einen ruhigen Bereich reservieren."],
              ["Schritt 3 – Interesse zeigen, nicht überwachen", "Fragen, was heute geübt wurde. Gelegentlich zuhören. Aber: nicht jede Übungseinheit beiwohnen – das erzeugt Druck."],
              ["Schritt 4 – Digitale Unterstützung nutzen", "Plattformen wie Trumpetstar bieten Playalongs und visuelle Notenunterstützung – ideal für Kinder, die alleine üben und trotzdem Feedback brauchen."],
              ["Schritt 5 – Mit dem Lehrer kommunizieren", "Bläserklassen-Lehrer haben meistens begrenzte Zeit pro Kind. Eine kurze E-Mail am Ende des Quartals zeigt Interesse und gibt wertvolles Feedback."],
            ].map(([title, text], i) => (
              <AnimatedSection key={i} direction="left" delay={i * 60}>
                <Card className={`border-l-4 ${i % 3 === 0 ? 'border-l-green-400' : i % 3 === 1 ? 'border-l-primary' : 'border-l-[hsl(var(--reward-gold))]'}`}>
                  <CardContent className="p-4">
                    <p className="font-semibold text-sm mb-1">{title}</p>
                    <p className="text-xs text-muted-foreground">{text}</p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </AnimatedSection>

        {/* Motivation */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Bläserklasse und Motivation – was tun, wenn es hakt?</h2>
          <p className="text-white/70 mb-4">Es ist normal, dass die Motivation nach dem ersten Enthusiasmus nachlässt – bei fast allen Kindern. Was hilft:</p>
          <div className="space-y-2">
            {[
              ["Kontext wechseln", "Andere Genres ausprobieren (statt klassischer Übungsstücke ein Poplied lernen)"],
              ["Playalongs nutzen", "Mitspielen mit aufgenommener Band – macht viel mehr Spaß als alleine üben"],
              ["Mitschüler-Vergleich vermeiden", "Jedes Kind entwickelt sich in eigenem Tempo"],
              ["Kurzpause akzeptieren", "1–2 Wochen Pause sind kein Drama – dann wieder einsteigen"],
              ["Ziel setzen", "\"Ich spiele das Lied beim nächsten Familientreffen vor\" – konkrete Motivation"],
            ].map(([titel, text], i) => (
              <Card key={i}>
                <CardContent className="p-3 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">{titel}</p>
                    <p className="text-xs text-muted-foreground">{text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </AnimatedSection>

        {/* Fehler */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Häufige Fehler – und wie man sie vermeidet</h2>
          <div className="space-y-3">
            {[
              ["Fehler 1: Üben nur kurz vor dem Unterricht", "Tages-vor-Unterricht-Marathons bringen wenig.", "Tägliche 10-Minuten-Sessions statt wöchentlicher 60-Minuten-Einheit."],
              ["Fehler 2: Instrument nicht gewartet", "Ventile ohne Öl bewegen sich schwer – das Kind denkt, es liegt an ihm.", "Wöchentlich Ventilöl auftragen. Zeigen, wie's geht – Kinder können das selbst lernen."],
              ["Fehler 3: Zu hohe Erwartungen", "Nach 3 Monaten Bläserklasse klingt es meistens noch nicht nach Konzert-Niveau.", "Realistisch erwarten: echte Melodien nach 4–8 Wochen, Ensemblespiel nach 3–6 Monaten."],
              ["Fehler 4: Schulkonzert als einziges Ziel", "Wenn das Schuljahreskonzert als einziger Motivationspunkt gilt, fällt nach dem Konzert oft die Motivation weg.", "Nächstes Ziel direkt nach dem Konzert setzen: nächstes Stück, nächstes Level."],
            ].map(([fehler, problem, fix], i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <p className="font-semibold text-sm text-destructive mb-1">❌ {fehler}</p>
                  <p className="text-xs text-muted-foreground mb-1">{problem}</p>
                  <p className="text-xs text-green-400">✅ Fix: {fix}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </AnimatedSection>

        {/* FAQ */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">FAQ</h2>
          <div className="space-y-3">
            {[
              ["Muss mein Kind Noten lesen können vor der Bläserklasse?", "Nein. Bläserklassen starten in der Regel bei null. Noten lesen wird im Unterricht erlernt."],
              ["Wie viel muss mein Kind täglich üben?", "10–15 Minuten täglich sind ideal für den Anfang. Nach 6 Monaten können es 20–30 Minuten werden."],
              ["Was passiert, wenn mein Kind das Instrument wechseln möchte?", "Das kommt vor. Mit dem Bläserklassen-Lehrer besprechen. Manchmal ist ein Wechsel möglich – meistens erst nach dem ersten Schuljahr."],
              ["Ist eine Bläserklasse besser als Privatunterricht?", "Beides hat Vorteile. Bläserklasse: sozialer, günstiger, schulintegriert. Privatunterricht: individueller, schnellere Fortschritte möglich. Ideal: Bläserklasse + digitale Plattform als Ergänzung."],
              ["Kann mein Kind in der Bläserklasse Trompete lernen und gleichzeitig Trumpetstar nutzen?", "Ja – das ist sogar eine sehr gute Kombination. Trumpetstar bietet ergänzende Lektionen, Playalongs und ein klares Level-System, das den Schulunterricht perfekt unterstützt."],
              ["Ab welchem Alter gibt es Bläserklassen?", "Meistens ab Klasse 3 (ca. 8–9 Jahre), manchmal ab Klasse 4."],
            ].map(([q, a], i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <p className="font-semibold text-sm mb-1">❓ {q}</p>
                  <p className="text-sm text-muted-foreground">{a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </AnimatedSection>

        {/* CTA */}
        <AnimatedSection direction="up" className="glass rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Kostenlosen Übungsplan herunterladen 🎺</h3>
          <p className="text-white/60 mb-6 text-sm">Die Bläserklasse ist ein großartiger Start – aber ohne Übung zu Hause werden die Fortschritte langsam sein. Trumpetstar gibt Ihrem Kind einen klaren Übungsplan für zu Hause, abgestimmt auf Anfänger-Level. Der Level-1 Starter Plan ist kostenlos.</p>
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" asChild>
            <a href="https://www.trumpetstar.app/register" target="_blank" rel="noopener noreferrer">
              Kostenlos registrieren <ArrowRight className="ml-2 w-4 h-4" />
            </a>
          </Button>
        </AnimatedSection>

        {/* Weitere Artikel */}
        <AnimatedSection direction="fade" className="border-t border-white/10 pt-6">
          <p className="text-sm text-white/40 mb-3">Weitere Artikel:</p>
          <div className="space-y-2">
            <Link to="/blog/trompete-lernen-kinder" className="flex items-center gap-1 text-primary hover:underline text-sm"><CheckCircle className="w-3 h-3" /> Trompete lernen für Kinder – der große Elternguide</Link>
            <Link to="/blog/trompete-kinder-kaufen" className="flex items-center gap-1 text-primary hover:underline text-sm"><CheckCircle className="w-3 h-3" /> Erste Trompete für Kinder kaufen</Link>
            <Link to="/blog/trompete-fluegelhorn-kind" className="flex items-center gap-1 text-primary hover:underline text-sm"><CheckCircle className="w-3 h-3" /> Trompete oder Flügelhorn – was passt für mein Kind?</Link>
          </div>
        </AnimatedSection>

      </div>
    </SEOPageLayout>
  );
}
