import { Link } from "react-router-dom";
import { SEOPageLayout } from "@/components/seo/SEOPageLayout";
import { AnimatedSection } from "@/components/seo/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Music } from "lucide-react";

export default function TrompeteFluegelhorn() {
  return (
    <SEOPageLayout>
      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection direction="up">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/15">
              <Music className="h-4 w-4" /> Instrument-Vergleich
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Trompete oder Flügelhorn für mein Kind?
            </h1>
            <p className="text-white/70 text-lg mb-3">
              Wir vergleichen Klang, Technik, Kosten und zeigen, welches Instrument besser zum Einstieg passt.
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
                  "Trompete und Flügelhorn sind verwandte Instrumente – aber mit unterschiedlichem Klang und Einsatzgebiet",
                  "Für Kinder ist die B-Trompete die häufiger empfohlene Wahl als Einstiegsinstrument",
                  "Das Flügelhorn klingt wärmer und weicher – ideal für bestimmte Musikstile",
                  "Beide Instrumente teilen grundlegende Spieltechnik – ein Wechsel ist später leicht möglich",
                  "Entscheidend ist, was das Kind selbst möchte und welches Genre es anspricht",
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

        {/* Unterschied */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Der Unterschied auf einen Blick</h2>

          <h3 className="text-lg font-semibold text-white mb-3">Bauform und Mensur</h3>
          <p className="text-white/70 mb-3">Die <strong className="text-white">Trompete</strong> hat eine enge, zylindrische Mensur (Rohrweite). Das ergibt einen hellen, durchdringenden Klang.</p>
          <p className="text-white/70 mb-4">Das <strong className="text-white">Flügelhorn</strong> hat eine weite, konische Mensur. Das ergibt einen runden, warmen, weicheren Klang – ähnlich wie ein Horn. Beide Instrumente verwenden dasselbe Grundprinzip: drei Ventile, Ansatz auf dem Mundstück, Luft durch das Rohr.</p>

          <h3 className="text-lg font-semibold text-white mb-3">Klang im Vergleich</h3>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 pr-4 text-white/60 font-medium">Eigenschaft</th>
                  <th className="text-left py-2 pr-4 text-white/60 font-medium">Trompete</th>
                  <th className="text-left py-2 text-white/60 font-medium">Flügelhorn</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[
                  ["Klangcharakter", "hell, brillant, direkt", "warm, rund, weich"],
                  ["Durchsetzungskraft", "hoch", "mittel"],
                  ["Typische Genres", "Klassik, Marsch, Jazz, Pop", "Jazz, Soul, Ballade, Lyrik"],
                  ["Orchesterrolle", "Standard-Solist", "Ergänzung, Solo-Lyrik"],
                ].map(([e, t, f], i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2 pr-4">{e}</td>
                    <td className="py-2 pr-4">{t}</td>
                    <td className="py-2">{f}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold text-white mb-3">Mundstück</h3>
          <Card className="border-yellow-400/30 bg-yellow-400/5">
            <CardContent className="p-4">
              <p className="text-sm text-white/80">Ein wichtiger Unterschied, der oft übersehen wird: Das Flügelhorn-Mundstück hat einen anderen Rand und Kessel als das Trompeten-Mundstück. Sie sind <strong className="text-white">nicht kompatibel</strong> (ohne Adapter). Kinder, die auf einem Instrument beginnen, sollten beim selben Mundstücktyp bleiben, bis der Ansatz stabil ist.</p>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Für welche Kinder */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Für welche Kinder eignet sich was?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-white mb-2">🎺 Trompete – geeignet wenn:</p>
                <ul className="space-y-1">
                  {[
                    "Interesse an klassischer Musik, Blasmusik oder Bigband",
                    "Bläserklasse in der Schule ist das Ziel",
                    "Mitspielen in Orchester oder Jugendblasorchester",
                    "Breite Auswahl an Lernmaterial gewünscht",
                  ].map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                      <CheckCircle className="w-3 h-3 text-primary shrink-0 mt-0.5" /> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-[hsl(var(--reward-gold))]">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-white mb-2">🎵 Flügelhorn – geeignet wenn:</p>
                <ul className="space-y-1">
                  {[
                    "Kind bevorzugt warmen, weichen Klang",
                    "Fokus auf Jazz, Soul oder Balladenspiel",
                    "Spielen in Jazzband oder Combo geplant",
                    "Lehrer unterrichtet Flügelhorn als Hauptinstrument",
                  ].map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                      <CheckCircle className="w-3 h-3 text-[hsl(var(--reward-gold))] shrink-0 mt-0.5" /> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          <Card className="mt-4 border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-sm text-white/80"><strong className="text-white">Ehrliche Empfehlung:</strong> Für den Einstieg – besonders wenn die Musikrichtung noch offen ist – ist die Trompete die praktischere Wahl. Mehr Lehrer, mehr Lernmaterial, mehr Ensembleplätze in Schulen und Orchestern.</p>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Schritt für Schritt */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Schritt für Schritt: Instrument auswählen</h2>
          <div className="space-y-3">
            {[
              ["Schritt 1 – Genre-Präferenz klären", "Welche Musik mag Ihr Kind? Jazz? Klassik? Blasmusik? Pop? Das ist die wichtigste Leitfrage."],
              ["Schritt 2 – Lehrer-/Schulkontext prüfen", "Welches Instrument wird in der Bläserklasse oder Musikschule verwendet? Das sollte Priorität haben."],
              ["Schritt 3 – Instrumente ausprobieren lassen", "Im Musikhandel (oder beim Lehrer) beide Instrumente ausprobieren – Kinder reagieren oft intuitiv auf einen Klang."],
              ["Schritt 4 – Leihen statt kaufen", "Egal ob Trompete oder Flügelhorn: für die ersten 6–12 Monate leihen. So bleibt die Entscheidung revidierbar."],
              ["Schritt 5 – Lernplattform wählen", "Trumpetstar unterrichtet auf B-Trompete, bietet aber auch Hinweise zum Flügelhorn als Zweitinstrument. Der Level-1 Starter Plan ist kostenlos verfügbar."],
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

        {/* Beide Instrumente */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Kann man als Kind beide Instrumente lernen?</h2>
          <p className="text-white/70 mb-3">Ja – und das ist sogar empfohlen, sobald das Kind Fortschritte macht. Viele professionelle Trompeter spielen auch Flügelhorn als Zweitinstrument. Die Grundtechnik (Ansatz, Atemführung, Tonguing) ist übertragbar.</p>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-sm text-white/80"><strong className="text-white">Sinnvoller Zeitpunkt für das Flügelhorn als Zweitinstrument:</strong> nach 1–2 Jahren Trompetenunterricht, wenn der Ansatz stabil ist.</p>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Fehler */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Häufige Fehler – und wie man sie vermeidet</h2>
          <div className="space-y-3">
            {[
              ["Das \"coolere\" Instrument kaufen, nicht das passende", "Eltern kaufen manchmal ein Flügelhorn, weil es ihnen besser gefällt – aber das Kind spielt es in einer Bläserklasse, wo Trompete gefragt ist.", "Schulkontext und Lernziel zuerst klären."],
              ["Mundstücke mischen", "Trompeten-Mundstück ins Flügelhorn stecken (geht nur mit Adapter) oder umgekehrt.", "Jedes Instrument hat sein eigenes Mundstück. Nicht mischen, solange der Ansatz sich noch entwickelt."],
              ["Billig-Flügelhorn kaufen", "Flügelhorn-Qualitätsunterschiede sind noch deutlicher als bei Trompeten. Billigst-Instrumente intonieren schlecht.", "Leihen oder mindestens 200 € Budget einplanen."],
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
              ["Ist Flügelhorn schwerer zu lernen als Trompete?", "Nicht signifikant. Die Grundtechnik ist dieselbe. Das Flügelhorn verzeiht ein wenig weniger bei der Intonation."],
              ["Kann mein 8-jähriges Kind das Flügelhorn spielen?", "Ja, wenn die Hände groß genug sind. Flügelhörner sind etwas breiter als Trompeten – ausprobieren lassen."],
              ["Welches Instrument klingt besser für Anfänger?", "Das Flügelhorn klingt für Anfänger oft \"voller\", weil die Mensur verzeihender ist. Trompete klingt bei falscher Technik dünner."],
              ["Lohnt sich ein Markenflügelhorn für Kinder?", "Für den Anfang nicht notwendig. Yamaha oder Jupiter im Mittelfeld sind ideal für Schüler."],
              ["Mein Kind will beides – was sagen Sie?", "Erst Trompete lernen, dann Flügelhorn als Zweitinstrument hinzufügen. Das ist der professionelle Standardweg."],
              ["Gibt es Lernvideos für Flügelhorn bei Trumpetstar?", "Trumpetstar fokussiert auf die B-Trompete als Hauptinstrument. Viele Übungen und Techniken sind auf das Flügelhorn übertragbar."],
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
          <h3 className="text-2xl font-bold text-white mb-2">Jetzt starten – kostenloser Lernplan 🎺</h3>
          <p className="text-white/60 mb-6 text-sm">Trumpetstar's kostenloser Level-1 Starter Plan gibt Ihrem Kind die ersten 4 Lernwochen klar vor – mit Noten, Videos und Playalongs.</p>
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
          </div>
        </AnimatedSection>

      </div>
    </SEOPageLayout>
  );
}
