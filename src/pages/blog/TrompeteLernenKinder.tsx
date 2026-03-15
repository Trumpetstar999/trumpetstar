import { Link } from "react-router-dom";
import { SEOPageLayout } from "@/components/seo/SEOPageLayout";
import { AnimatedSection } from "@/components/seo/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Baby } from "lucide-react";

export default function TrompeteLernenKinder() {
  return (
    <SEOPageLayout>
      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection direction="up">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/15">
              <Baby className="h-4 w-4" /> Elternguide
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Trompete lernen für Kinder – was Eltern wirklich wissen müssen
            </h1>
            <p className="text-white/70 text-lg mb-3">
              Alter, Instrumente, Kosten, Übungsplan – alles was Eltern wissen müssen. Mit kostenlosem Starter Plan.
            </p>
            <p className="text-white/50 text-sm">15. März 2026 · 10 Min Lesezeit · Von Valentin | TrumpetStar</p>
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
                  "Kinder können ab ca. 7–8 Jahren mit der Trompete beginnen – früher ist selten sinnvoll",
                  "Die richtige Kindervariante (Perinet oder B-Trompete in kleinerer Bauform) macht den Unterschied",
                  "Kurze, regelmäßige Übeeinheiten (10–15 Min/Tag) schlagen lange, unregelmäßige",
                  "Trumpetstar bietet einen strukturierten digitalen Lernweg mit Noten, Videos und Playalongs – auch für Kinder",
                  "Dieser Artikel zeigt Schritt für Schritt, wie der Einstieg gelingt",
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

        {/* Ab welchem Alter */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Ab welchem Alter kann ein Kind Trompete lernen?</h2>
          <p className="text-white/70 mb-4">Die häufigste Frage zuerst. Die ehrliche Antwort: Es gibt keine magische Altersgrenze. Entscheidend sind drei Faktoren:</p>
          <div className="space-y-4 mb-4">
            {[
              ["1. Körperliche Voraussetzungen", "Die Trompete erfordert Lippenspannung (Ansatz) und Lungenvolumen. Kinder unter 6 Jahren haben in der Regel noch nicht die physische Reife, um einen stabilen Ton zu erzeugen – das führt zu Frust. Ab 7–8 Jahren sind die meisten Kinder körperlich bereit."],
              ["2. Konzentrationsfähigkeit", "Trompetenlernen braucht Fokus. Ein Kind, das 10–15 Minuten konzentriert üben kann, ist bereit. Das ist bei den meisten Kindern ab 7–8 Jahren der Fall."],
              ["3. Eigene Motivation", "Das wichtigste Kriterium. Ein Kind, das selbst möchte, macht in 3 Monaten mehr Fortschritte als ein Kind, das 1 Jahr lang gedrückt wird. Fragen Sie Ihr Kind ehrlich: \u201eWillst du das wirklich, oder findest du es nur gerade cool?\u201c"],
            ].map(([title, text], i) => (
              <AnimatedSection key={i} direction="left" delay={i * 80}>
                <Card>
                  <CardContent className="p-4">
                    <p className="font-semibold text-sm mb-1">{title}</p>
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-sm text-white/80"><strong className="text-white">Empfehlung:</strong> 7–10 Jahre ist die ideale Zeitspanne für den ersten Einstieg. Ältere Kinder und Teenager können jederzeit starten – der Einstieg ist dann sogar oft schneller.</p>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Welche Trompete */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Welche Trompete ist die richtige für Kinder?</h2>
          <p className="text-white/70 mb-4">Der Markt ist unübersichtlich. Hier eine klare Orientierung:</p>

          <h3 className="text-lg font-semibold text-white mb-3">Kindertrompeten vs. normale B-Trompete</h3>
          <p className="text-white/70 mb-4">Viele Hersteller verkaufen sogenannte "Kindertrompeten" – oft aus Kunststoff oder in kleinerem Format. Diese klingen anders und haben andere Ventilabstände. Für Kinder ab 7 Jahren empfehlen Lehrer häufig eine normale B-Trompete in Studentenqualität.</p>
          <p className="text-white/70 mb-4">Warum? Weil das Kind von Anfang an ein richtiges Instrument lernt. Der Wechsel auf eine vollwertige Trompete later entfällt.</p>
          <p className="text-white/60 mb-6 text-sm italic"><strong className="text-white/80">Ausnahmen:</strong> Sehr kleine Kinder (unter 7 Jahren) oder Kinder mit besonders kleinen Händen profitieren von Modellen mit engerer Mensur oder kürzerer Bauform.</p>

          <h3 className="text-lg font-semibold text-white mb-3">Kaufen oder leihen?</h3>
          <p className="text-white/70 mb-3">Für den Einstieg empfehlen wir: <strong className="text-white">leihen</strong>. Viele Musikschulen und Musikhäuser verleihen Instrumente. Das hat Vorteile:</p>
          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            {[
              "Kein Kapitalrisiko, falls das Kind nach 3 Monaten aufhört",
              "Möglichkeit, verschiedene Instrumente auszuprobieren",
              "Oft inkl. Wartung und Service",
            ].map((item, i) => (
              <Card key={i}>
                <CardContent className="p-3 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">{item}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <h3 className="text-lg font-semibold text-white mb-3">Budget-Orientierung (Kauf)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 pr-4 text-white/60 font-medium">Kategorie</th>
                  <th className="text-left py-2 pr-4 text-white/60 font-medium">Preisbereich</th>
                  <th className="text-left py-2 text-white/60 font-medium">Geeignet für</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[
                  ["Einstieg (Schüler)", "150–300 €", "Erste 1–3 Jahre"],
                  ["Mittelfeld", "300–600 €", "Fortgeschrittene Schüler"],
                  ["Semi-Profi", "600–1.500 €", "Ab ABRSM Grade 5+"],
                ].map(([kat, preis, fuer], i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2 pr-4">{kat}</td>
                    <td className="py-2 pr-4">{preis}</td>
                    <td className="py-2">{fuer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-white/50 text-xs mt-3 italic">Hinweis: Instrumente unter 100 € (No-Name-Ware) vermeiden. Sie klingen schlecht und sind schwer zu spielen – das demotiviert Kinder schnell.</p>
        </AnimatedSection>

        {/* Schritt für Schritt */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Schritt für Schritt: So starten Kinder mit der Trompete</h2>
          <div className="space-y-3">
            {[
              ["Schritt 1 – Den richtigen Lernweg wählen", "Es gibt drei Wege: Musikschule / privater Lehrer (persönliche Betreuung, höhere Kosten), Bläserklasse in der Schule (günstiger, sozialer), oder digitale Lernplattform (flexibel, günstig). Trumpetstar kombiniert strukturierte Video-Lektionen, interaktive Noten und Playalongs."],
              ["Schritt 2 – Die ersten Töne produzieren", "Lippen locker formen, leichter Druck auf das Mundstück, Luft wie durch einen Strohhalm blasen. Viele Lehrer empfehlen Mundstück-Übungen für die ersten 1–2 Wochen."],
              ["Schritt 3 – Die ersten Noten: C, D, E", "Auf der B-Trompete sind das C (ohne Ventile), D (1. Ventil), E (2. Ventil oder 1+2). Ein strukturierter Lehrplan ist hier entscheidend."],
              ["Schritt 4 – Routine aufbauen", "10–15 Minuten täglich schlagen 1 Stunde einmal pro Woche. Fester Zeitpunkt (z.B. nach den Hausaufgaben), kleine Ziele, kurze Pause nach 5–7 Minuten."],
              ["Schritt 5 – Fortschritte sichtbar machen", "Übekalender mit Stickern, ein einfaches Lied komplett spielen können als Meilenstein, Aufnahmen machen und 4 Wochen später vergleichen."],
            ].map(([title, text], i) => (
              <AnimatedSection key={i} direction="left" delay={i * 60}>
                <Card className={`border-l-4 ${i === 0 ? 'border-l-green-400' : i === 1 ? 'border-l-blue-400' : i === 2 ? 'border-l-primary' : i === 3 ? 'border-l-yellow-400' : 'border-l-[hsl(var(--reward-gold))]'}`}>
                  <CardContent className="p-4">
                    <p className="font-semibold text-sm mb-1">{title}</p>
                    <p className="text-xs text-muted-foreground">{text}</p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </AnimatedSection>

        {/* Häufige Fehler */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Häufige Fehler – und wie man sie vermeidet</h2>
          <div className="space-y-3">
            {[
              ["Fehler 1: Zu früh anfangen", "Kinder unter 6 sind oft frustriert, weil die körperlichen Voraussetzungen fehlen.", "Bis 7 warten. In der Zwischenzeit: Klavier, Blockflöte oder Schlagzeug als \"Vorschule\"."],
              ["Fehler 2: Das falsche Instrument kaufen", "Billigst-Instrumente klingen schlecht und sind schlecht zu spielen.", "Leihen statt kaufen für die ersten Monate. Beratung im Musikfachhandel einholen."],
              ["Fehler 3: Zu lange Übeeinheiten", "Kinder verlieren nach 15–20 Minuten die Konzentration, dann wird Üben zur Qual.", "Max. 15 Minuten täglich in den ersten 6 Monaten. Qualität vor Quantität."],
              ["Fehler 4: Ohne Plan üben", "Kind spielt dasselbe immer wieder, macht keine sichtbaren Fortschritte, verliert Lust.", "Strukturierter Lehrplan (Musikschule, digitale Plattform, Heft mit klaren Lektionen)."],
              ["Fehler 5: Elterndruck", "Wenn Kinder das Gefühl haben, es \"für die Eltern\" zu tun, setzt die Gegenwehr ein.", "Interesse wecken statt erzwingen. Vorbilder zeigen (Aufnahmen von coolen Trompetenstücken)."],
            ].map(([fehler, problem, fix], i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <p className="font-semibold text-sm text-destructive mb-1">❌ {fehler}</p>
                  <p className="text-xs text-muted-foreground mb-1">Problem: {problem}</p>
                  <p className="text-xs text-green-400">✅ Fix: {fix}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </AnimatedSection>

        {/* Kosten */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Kosten im Überblick</h2>
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 pr-4 text-white/60 font-medium">Position</th>
                  <th className="text-left py-2 text-white/60 font-medium">Monatliche Kosten</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[
                  ["Instrumentenmiete", "10–25 €"],
                  ["Musikschule / Privatlehrer", "60–120 €"],
                  ["Digitale Plattform (z.B. Trumpetstar)", "9–19 €"],
                  ["Noten, Zubehör", "5–15 € (einmalig)"],
                  ["Gesamt", "75–160 €/Monat"],
                ].map(([pos, kosten], i) => (
                  <tr key={i} className={`border-b border-white/5 ${i === 4 ? 'font-bold text-white' : ''}`}>
                    <td className="py-2 pr-4">{pos}</td>
                    <td className="py-2">{kosten}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-white/50 text-xs italic">Tipp: Manche Musikschulen bieten Förderungen oder vergünstigte Tarife für Kinder an. In Österreich und Deutschland gibt es teils kommunale Zuschüsse – beim Gemeindeamt oder der Musikschule nachfragen.</p>
        </AnimatedSection>

        {/* FAQ */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">FAQ – Häufige Fragen</h2>
          <div className="space-y-3">
            {[
              ["Kann mein Kind ohne Vorkenntnisse mit der Trompete starten?", "Ja. Noten lesen ist nicht zwingend notwendig für den Anfang – viele Lehrer und Plattformen führen Kinder Schritt für Schritt ein."],
              ["Wie lange dauert es, bis mein Kind ein Lied spielen kann?", "Mit regelmäßigem Üben (10–15 Min/Tag) spielen die meisten Kinder nach 4–8 Wochen ein einfaches Lied."],
              ["Braucht mein Kind unbedingt einen Lehrer?", "Nein – strukturierte Lernplattformen wie Trumpetstar ermöglichen selbstständiges Lernen. Ein Lehrer ist vor allem am Anfang hilfreich, um die Grundtechnik (Ansatz) korrekt zu erlernen."],
              ["Was ist der Unterschied zwischen B-Trompete und Es-Trompete?", "Die B-Trompete (Bb) ist die Standard-Konzerttrompete und ideal für Kinder. Die Es-Trompete ist kleiner und wird vor allem von jüngeren Kindern (6–8 Jahre) manchmal bevorzugt."],
              ["Mein Kind findet Trompete nach 3 Monaten langweilig – was tun?", "Normal. Die \"Honeymoon-Phase\" endet immer. Variante anbieten: anderes Genre spielen, Playalongs nutzen, kleines Konzert zu Hause veranstalten."],
              ["Gibt es eine Mindestübungszeit pro Tag?", "10 Minuten täglich sind besser als nichts. Unter 5 Minuten lohnt sich kaum. 20–30 Minuten sind für Kinder im ersten Jahr bereits sehr solide."],
              ["Ist Trompete für Mädchen oder Jungen gleich geeignet?", "Vollständig gleichwertig. Es gibt keine geschlechtsspezifischen Unterschiede beim Trompetenlernen."],
              ["Lohnt sich eine digitale Lernplattform neben der Musikschule?", "Sehr. Digitale Plattformen erlauben Üben mit Playalongs, visuelle Notenführung und Fortschrittsübersicht – ideal als Ergänzung zum Unterricht."],
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
          <h3 className="text-2xl font-bold text-white mb-2">Jetzt kostenlos starten 🎺</h3>
          <p className="text-white/60 mb-6 text-sm">Trumpetstar's kostenloser Level-1 Starter Plan – die ersten 4 Wochen Lernplan für Kinder. Strukturiert, kindgerecht, ohne Vorkenntnisse nutzbar.</p>
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
            <Link to="/blog/trompete-fluegelhorn-kind" className="flex items-center gap-1 text-primary hover:underline text-sm"><CheckCircle className="w-3 h-3" /> Trompete oder Flügelhorn – was passt für mein Kind?</Link>
            <Link to="/blog/trompete-kinder-kaufen" className="flex items-center gap-1 text-primary hover:underline text-sm"><CheckCircle className="w-3 h-3" /> Erste Trompete für Kinder kaufen – Ratgeber</Link>
            <Link to="/blog/blaeserklasse-trompete" className="flex items-center gap-1 text-primary hover:underline text-sm"><CheckCircle className="w-3 h-3" /> Bläserklasse: Was Eltern wissen sollten</Link>
          </div>
        </AnimatedSection>

      </div>
    </SEOPageLayout>
  );
}
