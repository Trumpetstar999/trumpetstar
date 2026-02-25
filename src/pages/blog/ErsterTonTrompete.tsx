import { Link } from "react-router-dom";


export default function ErsterTonTrompete() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-purple-600 font-bold text-xl">🎺 TrumpetStar</Link>
          <Link to="/blog" className="text-sm text-gray-500 hover:text-gray-700">← Blog</Link>
        </div>
      </div>

      <article className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Tutorial</span>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-3 leading-tight">
            Der erste Ton auf der Trompete: Schritt-für-Schritt-Anleitung
          </h1>
          <p className="text-gray-500 text-sm">25. Februar 2026 · 6 Min Lesezeit · Von Valentin | TrumpetStar</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 text-sm font-medium">💡 Lass dich nicht entmutigen — die meisten brauchen 3–7 Tage, bis ein klarer Ton entsteht. Das ist völlig normal.</p>
          </div>

          <h2 className="text-xl font-bold text-gray-900">Phase 1: Buzzing (Tag 1–2)</h2>
          <p>Buzzing ist das Vibrieren deiner Lippen beim Blasen. Das ist die absolute Basis alles Trompetenspiels.</p>
          <div className="bg-gray-50 rounded-xl p-5">
            <p className="font-semibold mb-3">Übung: Lippen-Vibration</p>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li><strong>Lippen leicht zusammenpressen</strong> — nicht zu fest, nicht zu locker</li>
              <li><strong>Luft blasen</strong> — langsam, kontrolliert</li>
              <li><strong>Vibration spüren</strong> — ein „brrrr"-Gefühl in den Lippen</li>
              <li><strong>2 Minuten üben</strong> — mehr nicht!</li>
            </ol>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Häufige Fehler:</p>
            <p>❌ Zu viel Druck (Lippen werden weiß)</p>
            <p>❌ Zu wenig Druck (Luft entweicht pfeifend)</p>
            <p>❌ Lippen nicht leicht nach innen gerollt</p>
          </div>

          <h2 className="text-xl font-bold text-gray-900">Phase 2: Mundstück-Training (Tag 3–4)</h2>
          <p>Mit Mundstück wirst du plötzlich Töne hören. Nicht perfekt, nicht klar, aber hörbar. Das ist dein erster Erfolg!</p>
          <p><strong>Ziel:</strong> Ein durchgehender Ton für 3 Sekunden.</p>

          <h2 className="text-xl font-bold text-gray-900">Phase 3: Die Trompete (Tag 5–7)</h2>
          <p>Spiele genau wie beim Mundstück-Training. Nicht anders atmen, nicht mehr Druck. <strong>Vertrau der Physik</strong> — die Trompete verstärkt nur, was deine Lippen tun.</p>

          <h2 className="text-xl font-bold text-gray-900">Tagesplan: Woche 1</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="bg-purple-50"><th className="text-left p-3 font-semibold">Tag</th><th className="text-left p-3 font-semibold">Übung</th><th className="text-left p-3 font-semibold">Ziel</th></tr></thead>
              <tbody>
                {[
                  ["1","Buzzing ohne Instrument","Lippen vibrieren lassen"],
                  ["2","Buzzing vertiefen","Konstantes Brrrr"],
                  ["3","Mundstück ansetzen","Erster Ton hörbar"],
                  ["4","Mundstück halten","3-Sekunden-Ton"],
                  ["5","Trompete + Buzzing","Erster Ton am Instrument"],
                  ["6","Ton halten","5-Sekunden-Ton klar"],
                  ["7","Mehrere Versuche","3x hintereinander reproduzierbar"],
                ].map(([d,u,z]) => (
                  <tr key={d} className="border-t border-gray-100"><td className="p-3 font-medium">{d}</td><td className="p-3">{u}</td><td className="p-3 text-gray-500 text-xs">{z}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-bold text-gray-900">Troubleshooting</h2>
          <div className="space-y-3">
            {[
              ["Es kommt gar kein Ton", "Mehr Buzzing-Übungen ohne Instrument."],
              ["Es klingt gepresst und hoch", "Weniger Druck, entspannter blasen. Wie Seifenblasen pusten."],
              ["Meine Lippen tun weh", "Normal! 2–3 Tage Pause, dann mit kürzeren Einheiten weiter."],
              ["Ich bekomme Schwindel", "Zu viel Druck. Blase weniger kräftig, atme zwischendurch normal."],
            ].map(([p, l]) => (
              <div key={p} className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-sm">❓ „{p}"</p>
                <p className="text-sm text-gray-600 mt-1">→ {l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 bg-purple-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-xl font-bold mb-2">Du schaffst das! 🎺</h3>
          <p className="text-purple-200 mb-6 text-sm">Starte die 7-Tage-Challenge mit Video-Tutorials für jeden Schritt</p>
          <Link to="/" className="bg-white text-purple-600 font-bold px-6 py-3 rounded-xl inline-block">
            Kostenlos starten
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Weitere Artikel:</p>
          <div className="space-y-2">
            <Link to="/blog/trompete-lernen-erwachsene" className="block text-purple-600 hover:underline text-sm">→ Trompete lernen als Erwachsener: Der ultimative Guide</Link>
            <Link to="/blog/trompete-ueben-routine" className="block text-purple-600 hover:underline text-sm">→ Die optimale Übe-Routine für Berufstätige</Link>
          </div>
        </div>
      </article>
    </div>
  );
}
