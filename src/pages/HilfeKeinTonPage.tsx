import { FAQSchema } from "@/components/SEO/FAQSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle, Wrench, ArrowRight, Video } from "lucide-react";

const faqs = [
  {
    question: "Warum kommt bei meiner Trompete überhaupt kein Ton?",
    answer: "Die häufigsten Ursachen: 1) Zu festes Drücken des Mundstücks (Lippen können nicht vibrieren), 2) Zu wenig Luftdruck, 3) Lippen nicht geschlossen genug, 4) Falsche Mundstück-Position. Gehen Sie zurück zum Buzzing ohne Instrument und üben Sie diesen Schritt intensiver."
  },
  {
    question: "Es kommt nur Luftgeräusche, aber kein richtiger Ton – was tun?",
    answer: "Das bedeutet, die Lippen vibrieren nicht richtig. Versuchen Sie: 1) Mehr Lippenspannung (fester schließen), 2) Kräftigeren Luftstoß, 3) Mundstück leicht zu kippen (oben etwas mehr Druck), 4) Den 'Mmmh'-Laut vor dem Blasen."
  },
  {
    question: "Der Ton bricht immer wieder ab – warum?",
    answer: "Ursachen: Zu wenig Atemluft, ungleichmäßiger Luftstrom oder nachlassende Lippenspannung. Üben Sie lange Töne: Einatmen, Ton erzeugen und SO LANGE WIE MÖGLICH halten. Notieren Sie die Zeit und versuchen Sie, sie zu steigern."
  },
  {
    question: "Ich habe schon Tage geübt, aber immer noch kein Ton – ist das normal?",
    answer: "Das ist ungewöhnlich, aber nicht unmöglich. Mögliche Gründe: Instrumentendefekt (Loch/Leck?), zu hohe Ansprüche (erstmal nur 'irgendein' Ton, nicht gleich schön), psychischer Druck. Unser Tipp: Lassen Sie sich von einem Profi beraten oder nutzen Sie unseren Video-Support."
  },
  {
    question: "Könnte das Instrument defekt sein?",
    answer: "Möglich, aber selten bei neuen Instrumenten. Prüfen: 1) Alle Ventile richtig eingeschraubt?, 2) Keine sichtbaren Löcher oder Dellen?, 3) Mundstück ganz eingesteckt?, 4) Wasser/Speichel abgelassen? Bei Verdacht: Fachhandler fragen oder unseren Support kontaktieren."
  }
];

const checkliste = [
  { text: "Mundstück richtig eingesteckt (nicht zu fest)?", done: true },
  { text: "Ventile alle in richtiger Position (Nummern sichtbar)?", done: true },
  { text: "Wasser/Speichel aus dem Instrument abgelassen?", done: false },
  { text: "Lippen entspannt (nicht angespannt vom Üben)?", done: false },
  { text: "Tief genug eingeatmet (Bauch, nicht Brust)?", done: false }
];

export default function HilfeKeinTonPage() {
  return (
    <div className="min-h-screen bg-background">
      <FAQSchema faqs={faqs} />

      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <AlertCircle className="h-4 w-4" />
            Problem-Lösung
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Trompete macht keinen Ton?<br />
            <span className="text-red-600">So lösen Sie das Problem</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Kein Panik! Fast immer liegt es an kleinen, leicht korrigierbaren Fehlern. Mit dieser Checkliste finden und beheben Sie das Problem in Minuten.
          </p>

          <div className="bg-white/80 backdrop-blur border-red-200 border rounded-xl p-6 max-w-2xl mx-auto mb-8">
            <div className="flex items-start gap-3 text-left">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-lg">
                  <strong>Gute Nachrichten:</strong> 95% der "kein Ton"-Probleme liegen am Ansatz (zu fest, zu locker, falsche Position) – nicht am Instrument. In 10 Minuten können wir das fixen.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-red-600 hover:bg-red-700" asChild>
              <Link to="/support/chat">
                <Video className="mr-2 h-4 w-4" />
                Video-Support starten
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/trompete-erster-ton">Zurück zur Anleitung</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16">

        {/* Schnell-Checkliste */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">🔍 Schnell-Checkliste (2 Minuten)</h2>
          
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-6">
              <p className="text-amber-800 mb-4">Arbeiten Sie diese Punkte der Reihe nach ab:</p>
              <ol className="space-y-3">
                {checkliste.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-green-500 text-white' : 'bg-amber-200 text-amber-700'}`}>
                      {item.done ? '✓' : (idx + 1)}
                    </div>
                    <span className={item.done ? 'text-green-800 line-through' : 'text-amber-900'}>{item.text}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>

        {/* Top 3 Ursachen */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Die 3 häufigsten Ursachen</h2>
          
          <div className="space-y-6">
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center font-bold text-red-600">1</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Zu festes Drücken</h3>
                    <p className="text-muted-foreground mb-3">
                      Der häufigste Fehler! Die Lippen müssen <strong>vibrieren</strong> können. Bei zu viel Druck erstarren sie.
                    </p>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-green-800 text-sm">
                        <strong>Lösung:</strong> Mundstück lockerer halten (nur so fest, dass kein Luft entweicht). Üben Sie das "Buzzing" ohne Instrument.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600">2</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Zu wenig Luftdruck</h3>
                    <p className="text-muted-foreground mb-3">
                      Vorsichtig pusten funktioniert nicht. Die Trompete braucht einen <strong>kontrollierten, kräftigen Luftstoß</strong>.
                    </p>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-green-800 text-sm">
                        <strong>Lösung:</strong> Stellen Sie sich vor, Sie wollen ein Kerzenflamme 1 Meter weit wegpusten – nicht blasen, sondern stoßartig!
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-600">3</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Lippen nicht geschlossen genug</h3>
                    <p className="text-muted-foreground mb-3">
                      Die Lippen müssen leicht geschlossen sein, damit sie vibrieren können. Offene Lippen = Luft entweicht.
                    </p>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-green-800 text-sm">
                        <strong>Lösung:</strong> Machen Sie den "Mmmh"-Laut (wie "Mmmh, lecker!"). Genau diese Lippenposition brauchen Sie.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Diagnose-Tool */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Selbst-Diagnose: Was hören Sie?</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">🔇 Gar nichts – totale Stille</h3>
                <p className="text-sm text-muted-foreground">
                  → Wahrscheinlich zu festes Drücken oder falsche Mundstück-Position. Zurück zu Schritt 1 der Anleitung.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">💨 Nur Luftgeräusche</h3>
                <p className="text-sm text-muted-foreground">
                  → Lippen vibrieren nicht. Mehr Spannung, kräftigerer Luftstoß, oder "Mmmh"-Position üben.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">🎺 Ton bricht ab</h3>
                <p className="text-sm text-muted-foreground">
                  → Zu wenig Luft oder nachlassende Lippenspannung. Lange-Töne-Übung machen!
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">🦆 Enten-quacken</h3>
                <p className="text-sm text-muted-foreground">
                  → Das ist gut! Fast ein Ton. Etwas mehr Luft und Lippenspannung – dann wird's ein richtiger Ton.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Soforthilfe */}
        <section className="mb-16">
          <Card className="bg-red-600 text-white">
            <CardContent className="p-8 text-center">
              <Wrench className="h-12 w-12 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Kommen Sie nicht weiter?</h2>
              <p className="mb-6 text-red-100">
                Unser Support-Team hilft Ihnen persönlich. Per Video-Call können wir Ihren Ansatz direkt korrigieren – oft in wenigen Minuten.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="bg-white text-red-600 hover:bg-red-50" asChild>
                  <Link to="/support/chat">Video-Support buchen</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-red-700" asChild>
                  <Link to="/kurse">Pro-Kurs mit Support</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Häufige Fragen zum Problem</h2>
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

        {/* Verwandte Themen */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Das könnte auch helfen</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">📖 Erster Ton Anleitung</h3>
                <p className="text-sm text-muted-foreground mb-3">Die komplette Schritt-für-Schritt-Anleitung zum ersten Ton.</p>
                <Link to="/trompete-erster-ton" className="text-red-600 hover:underline text-sm">Zur Anleitung →</Link>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">🎯 Ansatz & Atmung</h3>
                <p className="text-sm text-muted-foreground mb-3">Lernen Sie den korrekten Ansatz (Embouchure) und die Bauchatmung.</p>
                <Link to="/trompete-ansatz-atmung" className="text-red-600 hover:underline text-sm">Technik-Guide →</Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Zusammenfassung */}
        <section className="mb-8">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-green-900">Merken Sie sich</h2>
              <ul className="space-y-2 text-green-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>95% der Probleme liegen am Ansatz, nicht am Instrument</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>Zu fest drücken ist der häufigste Fehler</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>Buzzing ohne Instrument ist die beste Lösung</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>Video-Support kann in Minuten helfen</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

      </div>
    </div>
  );
}
