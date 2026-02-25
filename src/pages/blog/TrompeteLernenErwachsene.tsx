import { Link } from "react-router-dom";


export default function TrompeteLernenErwachsene() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Trompete lernen als Erwachsener – TrumpetStar"
        description="Warum es nie zu spät ist, Trompete zu lernen. Der ultimative Guide für Erwachsene mit der 5-Minuten-Methode."
      />
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-purple-600 font-bold text-xl">🎺 TrumpetStar</Link>
          <Link to="/blog" className="text-sm text-gray-500 hover:text-gray-700">← Blog</Link>
        </div>
      </div>

      <article className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Anfänger-Guide</span>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-3 leading-tight">
            Trompete lernen als Erwachsener: Der ultimative Guide für Einsteiger
          </h1>
          <p className="text-gray-500 text-sm">25. Februar 2026 · 8 Min Lesezeit · Von Valentin | TrumpetStar</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
          <h2 className="text-xl font-bold text-gray-900">Warum es nie zu spät ist, Trompete zu lernen</h2>
          <p>„Ich bin doch schon 40..." — Diesen Satz höre ich fast täglich. Und meine Antwort ist immer dieselbe: <strong>Das ist nonsense.</strong></p>
          <p>Als Erwachsener hast du entscheidende Vorteile gegenüber Kindern:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Disziplin:</strong> Du weißt, dass Erfolg Übung erfordert</li>
            <li><strong>Zeitmanagement:</strong> Du kannst feste Übezeiten einplanen</li>
            <li><strong>Motivation:</strong> Du lernst aus eigenem Antrieb</li>
            <li><strong>Musikalisches Verständnis:</strong> Du hast Jahrzehnte Musik hören hinter dir</li>
          </ul>
          <p>Unser ältester aktiver Schüler ist 67. Er spielt jetzt seit 2 Jahren und hat gerade sein erstes Weihnachtskonzert gemeistert.</p>

          <h2 className="text-xl font-bold text-gray-900">Die 5 größten Mythen über Trompete lernen</h2>
          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            {[
              ["Mythos 1: Deine Lungen sind nicht gut genug", "Die Trompete braucht kein extremes Lungenvolumen — sie braucht Luftkontrolle. Und die trainierst du."],
              ["Mythos 2: Deine Lippen werden zu schnell müde", "Normal! Mundmuskulatur muss sich aufbauen wie jeder andere Muskel. Unsere 5-Minuten-Methode ist genau dafür gemacht."],
              ["Mythos 3: Du hast kein musikalisches Talent", "Talent ist überbewertet. Systematik schlägt Talent."],
              ["Mythos 4: Du hast keine Zeit", "5 Minuten am Tag reichen für echte Fortschritte."],
              ["Mythos 5: Es dauert Jahre bis du was spielst", "Nach 30 Tagen kannst du 3–4 einfache Melodien spielen."],
            ].map(([m, f]) => (
              <div key={m}>
                <p className="font-semibold text-gray-900">❌ {m}</p>
                <p className="text-sm text-gray-600 mt-1">✅ {f}</p>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold text-gray-900">Die TrumpetStar-Methode: 5-Minuten-Prinzip</h2>
          <p>Die meisten Erwachsenen scheitern nicht am Können, sondern am Übermut. Sie üben eine Stunde am ersten Tag, haben Muskelkater in den Lippen und hören auf.</p>
          <p>Unsere Lösung: <strong>Mikro-Übungen</strong></p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Tag 1–7: 2–5 Minuten täglich</li>
            <li>Woche 2–4: 5–10 Minuten täglich</li>
            <li>Ab Monat 2: 15–20 Minuten täglich</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900">Deine erste Woche: Der Plan</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="bg-purple-50"><th className="text-left p-3 font-semibold">Tag</th><th className="text-left p-3 font-semibold">Übung</th><th className="text-left p-3 font-semibold">Dauer</th></tr></thead>
              <tbody>
                {[["1","Buzzing (nur Lippen)","2 Min"],["2–3","Mundstück-Training","3 Min"],["4–7","Erste Töne am Instrument","5 Min"]].map(([d,u,z]) => (
                  <tr key={d} className="border-t border-gray-100"><td className="p-3 font-medium">Tag {d}</td><td className="p-3">{u}</td><td className="p-3 text-gray-500">{z}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-purple-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-xl font-bold mb-2">Starte jetzt deine 7-Tage-Challenge 🎺</h3>
          <p className="text-purple-200 mb-6 text-sm">Kostenlos · 5 Min/Tag · Erster Ton in Woche 1</p>
          <Link to="/" className="bg-white text-purple-600 font-bold px-6 py-3 rounded-xl inline-block">
            Jetzt kostenlos anmelden
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Weitere Artikel:</p>
          <div className="space-y-2">
            <Link to="/blog/erster-ton-trompete" className="block text-purple-600 hover:underline text-sm">→ Der erste Ton: Schritt-für-Schritt-Anleitung</Link>
            <Link to="/blog/trompete-ueben-routine" className="block text-purple-600 hover:underline text-sm">→ Die optimale Übe-Routine für Berufstätige</Link>
          </div>
        </div>
      </article>
    </div>
  );
}
