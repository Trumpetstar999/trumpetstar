import { Link } from "react-router-dom";


const posts = [
  {
    slug: "trompete-lernen-erwachsene",
    title: "Trompete lernen als Erwachsener: Der ultimative Guide",
    excerpt: "Warum es nie zu spät ist, Trompete zu lernen — und wie du mit nur 5 Minuten am Tag echte Fortschritte machst.",
    date: "25. Februar 2026",
    readTime: "8 Min",
    emoji: "🎺",
    tag: "Anfänger-Guide",
  },
  {
    slug: "erster-ton-trompete",
    title: "Der erste Ton auf der Trompete: Schritt-für-Schritt",
    excerpt: "Von Buzzing bis zum ersten klaren Ton — die komplette Anleitung für absolute Anfänger in der ersten Woche.",
    date: "25. Februar 2026",
    readTime: "6 Min",
    emoji: "🎵",
    tag: "Tutorial",
  },
  {
    slug: "trompete-ueben-routine",
    title: "Trompete üben mit Vollzeitjob: Die beste Routine",
    excerpt: "5-Minuten-Methode für Berufstätige. Wie du trotz Zeitmangel echte Fortschritte machst.",
    date: "25. Februar 2026",
    readTime: "7 Min",
    emoji: "⏱️",
    tag: "Übe-Tipps",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-purple-600 font-bold text-xl">🎺 TrumpetStar</Link>
          <Link to="/auth" className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium">App starten</Link>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white border-b border-gray-100 px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Blog</h1>
          <p className="text-gray-600">Trompete lernen leicht gemacht — Tipps, Guides und Anleitungen</p>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {posts.map((post) => (
          <Link key={post.slug} to={`/blog/${post.slug}`}
            className="block bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl shrink-0">
                {post.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">{post.tag}</span>
                  <span className="text-xs text-gray-400">{post.readTime} Lesezeit</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{post.title}</h2>
                <p className="text-gray-600 text-sm leading-relaxed">{post.excerpt}</p>
                <p className="text-xs text-gray-400 mt-3">{post.date}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="bg-purple-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-xl font-bold mb-2">Bereit für deinen ersten Ton? 🎺</h3>
          <p className="text-purple-200 mb-6 text-sm">7-Tage kostenlose Challenge · 5 Minuten am Tag · Kein Vorwissen nötig</p>
          <Link to="/" className="bg-white text-purple-600 font-bold px-6 py-3 rounded-xl inline-block hover:bg-purple-50">
            Jetzt kostenlos starten
          </Link>
        </div>
      </div>
    </div>
  );
}
