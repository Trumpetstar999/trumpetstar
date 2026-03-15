import { Link } from "react-router-dom";
import { SEOPageLayout } from "@/components/seo/SEOPageLayout";
import { AnimatedSection } from "@/components/seo/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle, ShoppingBag } from "lucide-react";

export default function TrompeteKinderKaufen() {
  return (
    <SEOPageLayout>
      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection direction="up">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/15">
              <ShoppingBag className="h-4 w-4" /> Kauf-Ratgeber
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Erste Trompete für Kinder kaufen – Ratgeber 2026
            </h1>
            <p className="text-white/70 text-lg mb-3">
              Budget, Marken, Leihen vs. Kaufen – unser ehrlicher Ratgeber für Eltern. Inkl. Checkliste.
            </p>
            <p className="text-white/50 text-sm">15. März 2026 · 8 Min Lesezeit · Von Valentin | TrumpetStar</p>
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
                  "Für Kinder unter 10 Jahren: leihen ist oft besser als kaufen",
                  "Unter 150 € investieren ist riskant – Billiginstrumente klingen schlecht und demotivieren",
                  "Gute Schülertrompeten: Yamaha YTR-2330, Jupiter JTR700, Carol Brass CTR-5000",
                  "Gebraucht kaufen ist eine gute Option – wenn das Instrument vorher gecheckt wird",
                  "Mit dem richtigen Instrument und Lernplan klappt der Start deutlich besser",
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

        {/* Leihen oder Kaufen */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Leihen oder Kaufen – die erste Entscheidung</h2>
          <p className="text-white/70 mb-4">Bevor Sie überhaupt nach einem Modell suchen: Überlegen Sie, ob Kaufen wirklich der richtige erste Schritt ist.</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-l-4 border-l-blue-400">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-white mb-2">📋 Wann leihen besser ist</p>
                <ul className="space-y-1">
                  {[
                    "Kind beginnt gerade erst (erste 3–6 Monate)",
                    "Unsicherheit, ob das Kind dabei bleibt",
                    "Instrument wird in der Bläserklasse gestellt",
                    "Budget ist knapp",
                  ].map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                      <CheckCircle className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" /> {item}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-2 italic">Mietkosten: 10–25 €/Monat</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-400">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-white mb-2">✅ Wann kaufen besser ist</p>
                <ul className="space-y-1">
                  {[
                    "Kind hat mind. 6–12 Monate regelmäßig geübt",
                    "Motivation ist stabil und klar vorhanden",
                    "Nach 12–18 Monaten Miete amortisiert sich ein Kauf",
                    "Kind möchte \"sein eigenes\" Instrument haben",
                  ].map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                      <CheckCircle className="w-3 h-3 text-green-400 shrink-0 mt-0.5" /> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </AnimatedSection>

        {/* Budget-Guide */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Budget-Guide: Was bekomme ich für wie viel?</h2>

          <h3 className="text-lg font-semibold text-white mb-3">Unter 100 € – die Gefahrenzone</h3>
          <Card className="border-destructive/30 bg-destructive/5 mb-4">
            <CardContent className="p-4">
              <p className="text-sm text-white/80 mb-2">Trompeten für 60–90 € von unbekannten Marken klingen verlockend. Die Realität:</p>
              <ul className="space-y-1">
                {[
                  "Ventile bewegen sich schwergängig oder ungleichmäßig",
                  "Intonation ist oft unzuverlässig (Töne klingen schief)",
                  "Qualitätskontrolle fehlt – jedes Exemplar klingt anders",
                  "Kein Service, keine Garantie bei Defekten",
                  "Ergebnis: Das Kind glaubt, schlecht zu sein – obwohl das Instrument schuld ist",
                ].map((item, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                    <span className="text-destructive shrink-0">❌</span> {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <h3 className="text-lg font-semibold text-white mb-3">150–300 € – solide Einstiegsklasse</h3>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 pr-4 text-white/60 font-medium">Modell</th>
                  <th className="text-left py-2 pr-4 text-white/60 font-medium">Preis (ca.)</th>
                  <th className="text-left py-2 text-white/60 font-medium">Besonderheit</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[
                  ["Jupiter JTR-700", "200–260 €", "Solide Verarbeitung, weit verbreitet in Schulen"],
                  ["Carol Brass CTR-5000", "180–240 €", "Gute Ventile für den Preis"],
                  ["Startone MTP-300", "150–190 €", "Einstieg, bekannte Marke (Thomann-Eigenmarke)"],
                ].map(([modell, preis, info], i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2 pr-4 font-medium">{modell}</td>
                    <td className="py-2 pr-4">{preis}</td>
                    <td className="py-2">{info}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold text-white mb-3">300–600 € – gehobene Schülerklasse</h3>
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 pr-4 text-white/60 font-medium">Modell</th>
                  <th className="text-left py-2 pr-4 text-white/60 font-medium">Preis (ca.)</th>
                  <th className="text-left py-2 text-white/60 font-medium">Besonderheit</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[
                  ["Yamaha YTR-2330", "380–450 €", "Industriestandard für Schüler, sehr verlässlich"],
                  ["Bach TR300H2", "420–500 €", "Amerikanisches Design, warm im Klang"],
                  ["Jupiter JTR-1100", "500–580 €", "Quasi-Profi-Qualität für Fortgeschrittene"],
                ].map(([modell, preis, info], i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2 pr-4 font-medium">{modell}</td>
                    <td className="py-2 pr-4">{preis}</td>
                    <td className="py-2">{info}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Card className="border-[hsl(var(--reward-gold))]/30 bg-[hsl(var(--reward-gold))]/5">
            <CardContent className="p-4">
              <p className="text-sm text-white/80">⭐ Die <strong className="text-white">Yamaha YTR-2330</strong> ist die am häufigsten empfohlene Schülertrompete in Deutschland und Österreich – von Lehrern, Musikschulen und Eltern. Ein guter Kauf, den das Kind 5–8 Jahre behalten kann.</p>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Schritt für Schritt */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Schritt-für-Schritt: Trompete kaufen</h2>
          <div className="space-y-3">
            {[
              ["Schritt 1 – Lehrer oder Bläserklasse fragen", "Viele Lehrer haben Erfahrungswerte und empfehlen bestimmte Modelle. Fragen kostet nichts."],
              ["Schritt 2 – Budget festlegen", "Nicht unter 150 €. Wenn möglich, 300–450 € einplanen – das ist eine Investition, kein Wegwerfartikel."],
              ["Schritt 3 – Neu oder gebraucht?", "Gebraucht kann sehr gut sein – wenn Sie das Instrument vorher prüfen lassen. Auf Ventile, Züge, keine Beulen im Schalltrichter und Mundstück achten."],
              ["Schritt 4 – Mundstück mitdenken", "Viele Instrumente kommen mit einem Mundstück – prüfen Sie dessen Größe. Für Kinder empfehlen sich Mundstücke der Größe 7C (Bach-Größe) oder ähnlich."],
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

        {/* Zubehör-Checkliste */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Zubehör-Checkliste</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 pr-4 text-white/60 font-medium">Zubehör</th>
                  <th className="text-left py-2 pr-4 text-white/60 font-medium">Notwendig?</th>
                  <th className="text-left py-2 text-white/60 font-medium">Kosten</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[
                  ["Ventilöl", "Ja", "5–10 €"],
                  ["Polierttuch", "Ja", "3–5 €"],
                  ["Koffer/Tasche", "Ja (oft dabei)", "20–40 €"],
                  ["Reinigungsset", "Empfohlen", "10–20 €"],
                  ["Notenständer", "Empfohlen", "15–30 €"],
                ].map(([zubehoer, noetig, kosten], i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2 pr-4">{zubehoer}</td>
                    <td className="py-2 pr-4">{noetig}</td>
                    <td className="py-2">{kosten}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimatedSection>

        {/* Fehler */}
        <AnimatedSection direction="up">
          <h2 className="text-2xl font-bold text-white mb-4">Häufige Fehler – und wie man sie vermeidet</h2>
          <div className="space-y-3">
            {[
              ["Fehler 1: Das günstigste Instrument kaufen", "Kinder merken, wenn ihr Instrument \"nicht richtig klingt\" – das frustriert und führt zu Aufgeben.", "Minimum 150–200 € einplanen."],
              ["Fehler 2: Kein Mundstück-Check", "Das Mundstück ist das wichtigste Element des Klangs. Schlechte Mundstücke (oft bei Billiginstrumenten dabei) sabotieren den Ton.", "Mundstück separat von einem Lehrer bewerten lassen."],
              ["Fehler 3: Gebraucht kaufen ohne Prüfung", "Ältere Trompeten können Ventilprobleme, Undichtigkeiten oder Beulen haben, die man nicht sieht.", "Nur bei vertrauenswürdigen Händlern gebraucht kaufen, oder vor dem Kauf zur Wartung."],
              ["Fehler 4: Das \"Erwachsenen-Instrument\" kaufen", "Eltern kaufen ein professionelles Instrument, \"weil es bestimmt besser ist\". Kinder mit instabilem Ansatz profitieren kaum vom teuren Instrument.", "Gute Schülertrompete kaufen, Profi-Instrumente erst nach Grade 5-Level."],
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
              ["Welche Trompete für ein 8-jähriges Kind?", "Jupiter JTR-700 oder Yamaha YTR-2330 (wenn Budget da ist). Beide sind bewährt und gut für Kinder geeignet."],
              ["Ist eine Kunststoff-Trompete (pTrumpet) sinnvoll?", "Für sehr junge Kinder (6–7 Jahre) als Einstieg möglich – leicht, robust, günstig. Für Kinder ab 8 Jahren empfehlen wir lieber direkt Metall."],
              ["Wie lange hält eine Schülertrompete?", "Bei normaler Pflege 5–10 Jahre. Ventilöl regelmäßig (1–2x pro Woche), Züge schmieren, einmal im Jahr zur Generalreinigung."],
              ["Wo am besten kaufen?", "Stationärer Musikhandel (kann testen, beraten), Online bei Thomann oder session (gutes Preis-Leistungs-Verhältnis, 30-Tage-Rückgabe). eBay für Gebraucht – mit Vorsicht."],
              ["Kann ich auch eine gebrauchte Yamaha YTR-2330 kaufen?", "Ja, das ist oft eine sehr gute Entscheidung. Yamaha-Instrumente halten lange. Preis gebraucht: 200–300 €."],
              ["Braucht mein Kind ein eigenes Mundstück?", "Empfehlenswert. Eigenes Mundstück = eigener Ansatz-Komfort. Kosten: 15–40 €."],
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
          <h3 className="text-2xl font-bold text-white mb-2">Jetzt starten – mit dem richtigen Lernplan 🎺</h3>
          <p className="text-white/60 mb-6 text-sm">Das beste Instrument hilft wenig ohne einen strukturierten Lernweg. Trumpetstar bietet Level-basierte Lektionen, Playalongs und Noten – unser kostenloser Level-1 Starter Plan gibt die ersten 4 Lernwochen klar vor.</p>
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
            <Link to="/blog/trompete-fluegelhorn-kind" className="flex items-center gap-1 text-primary hover:underline text-sm"><CheckCircle className="w-3 h-3" /> Trompete oder Flügelhorn – was passt für mein Kind?</Link>
          </div>
        </AnimatedSection>

      </div>
    </SEOPageLayout>
  );
}
