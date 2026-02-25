import { Link } from "react-router-dom";


const slots = [
  { time: "☀️ Morgens", ideal: "Frühaufsteher", desc: "Frischer Kopf, keine Ablenkung" },
  { time: "🚆 Pendeln", ideal: "ÖPNV-Nutzer", desc: "Nur Mundstück/Buzzing — Totzeit produktiv nutzen" },
  { time: "🌤️ Mittagspause", ideal: "Büroangestellte", desc: "Konferenzraum, Auto oder Park" },
  { time: "🏠 Feierabend", ideal: "Alle", desc: "Stressabbau, Übergang zum Privaten" },
  { time: "🌙 Abend", ideal: "Eltern", desc: "Nach dem Kind ins Bett — Zeit für sich" },
];

export default function TrompeteUebenRoutine() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Trompete üben mit Vollzeitjob – TrumpetStar"
        description="5-Minuten-Methode für Berufstätige. Die beste Übe-Routine wenn du wenig Zeit hast."
      />
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-purple-600 font-bold text-xl">🎺 TrumpetStar</Link>
          <Link to="/blog" className="text-sm text-gray-500 hover:text-gray-700">← Blog</Link>
        </div>
      </div>

      <article className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Übe-Tipps</span>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-3 leading-tight">
            Trompete üben mit Vollzeitjob: Die ultimative Routine für Berufstätige
          </h1>
          <p className="text-gray-500 text-sm">25. Februar 2026 · 7 Min Lesezeit · Von Valentin | TrumpetStar</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
          <h2 className="text-xl font-bold text-gray-900">Das Zeit-Paradox</h2>
          <p>„Ich würde gerne Trompete lernen, aber ich habe keine Zeit." — Hier ist die Wahrheit: <strong>Du brauchst keine Stunden. Du brauchst 5–15 Minuten am Tag. Konsequent. Über Monate.</strong></p>
          <p>Ein Student, der einmal pro Woche 2 Stunden übt, macht weniger Fortschritte als ein Berufstätiger mit 10 Minuten täglich. Muskeln brauchen tägliche Wiederholung, nicht wöchentliche Marathons.</p>

          <h2 className="text-xl font-bold text-gray-900">Die 5-Minuten-Routine</h2>
          <div className="grid grid-cols-3 gap-3">
            {[["Min 0–1","Aufwärmen","Buzzing + tiefe Atemzüge"],["Min 1–4","Hauptübung","Technik-Element, konzentriert"],["Min 4–5","Cooldown","Lieblingston, entspannt"]].map(([t,n,d]) => (
              <div key={t} className="bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-xs text-purple-500 font-medium mb-1">{t}</p>
                <p className="font-bold text-gray-900 text-sm">{n}</p>
                <p className="text-xs text-gray-500 mt-1">{d}</p>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold text-gray-900">5 Übe-Slots für deinen Alltag</h2>
          <div className="space-y-3">
            {slots.map((s) => (
              <div key={s.time} className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-4">
                <span className="text-2xl">{s.time.split(" ")[0]}</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{s.time.split(" ").slice(1).join(" ")}</p>
                  <p className="text-xs text-purple-600 font-medium">{s.ideal}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold text-gray-900">Praktische Tipps</h2>
          <div className="space-y-4">
            {[
              ["Das sichtbare Instrument 👁️","Stelle die Trompete sichtbar auf — nicht im Kasten. Die Hürde zum Greifen muss minimal sein."],
              ["Die 2-Minuten-Regel ⏱️","Keine Lust? Sag dir: 'Nur 2 Minuten.' In 90% der Fälle machst du danach weiter."],
              ["Wenn du mal aussetzt 🔄","1 Tag verpasst? Kein Problem. 1 Woche? Wieder bei 5 Min starten — nie 'nachholen'."],
            ].map(([t, d]) => (
              <div key={t} className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-900 text-sm mb-1">{t}</p>
                <p className="text-sm text-gray-600">{d}</p>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold text-gray-900">Realistische Fortschritte</h2>
          <div className="space-y-2">
            {[["Woche 1–4","Erste Töne klar, 3–5 einfache Melodien"],["Monat 2–3","Erweiterter Tonumfang, erste Songs mit Begleitung"],["Monat 4–6","10+ Songs, eigenständiges Üben möglich"]].map(([z,f]) => (
              <div key={z} className="flex gap-3 items-start">
                <span className="text-purple-600 font-bold text-sm shrink-0">✅ {z}</span>
                <span className="text-sm text-gray-600">{f}</span>
              </div>
            ))}
          </div>

          <blockquote className="border-l-4 border-purple-300 pl-4 italic text-gray-600">
            „Ich übe jeden Morgen 5 Minuten beim Kaffee. Nach 3 Monaten spiele ich für meine Enkelkinder." — Klaus, 64
          </blockquote>
        </div>

        <div className="mt-12 bg-purple-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-xl font-bold mb-2">Deine 5 Minuten starten jetzt 🎺</h3>
          <p className="text-purple-200 mb-6 text-sm">Persönlicher Übeplan · Tägliche Erinnerungen · Fortschritts-Tracking</p>
          <Link to="/" className="bg-white text-purple-600 font-bold px-6 py-3 rounded-xl inline-block">
            Kostenlos anmelden
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Weitere Artikel:</p>
          <div className="space-y-2">
            <Link to="/blog/trompete-lernen-erwachsene" className="block text-purple-600 hover:underline text-sm">→ Trompete lernen als Erwachsener: Der ultimative Guide</Link>
            <Link to="/blog/erster-ton-trompete" className="block text-purple-600 hover:underline text-sm">→ Der erste Ton: Schritt-für-Schritt-Anleitung</Link>
          </div>
        </div>
      </article>
    </div>
  );
}
