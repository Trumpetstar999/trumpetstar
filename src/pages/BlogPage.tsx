import { Link } from "react-router-dom";
import { SEOPageLayout } from "@/components/seo/SEOPageLayout";
import { AnimatedSection } from "@/components/seo/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Clock } from "lucide-react";

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
    <SEOPageLayout>
      {/* Hero */}
      <section className="py-16 px-4 text-center">
        <AnimatedSection direction="up">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/15">
            🎺 Trumpetstar Blog
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Tipps, Guides & Anleitungen
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Alles rund ums Trompete lernen — für Anfänger, Berufstätige und Wiedereinsteiger.
          </p>
        </AnimatedSection>
      </section>

      {/* Posts */}
      <div className="max-w-3xl mx-auto px-4 pb-20 space-y-6">
        {posts.map((post, i) => (
          <AnimatedSection key={post.slug} direction="up" delay={i * 100}>
            <Link to={`/blog/${post.slug}`}>
              <Card className="hover-lift cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                      {post.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{post.tag}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                      </div>
                      <h2 className="text-lg font-bold mb-1 leading-tight">{post.title}</h2>
                      <p className="text-muted-foreground text-sm leading-relaxed">{post.excerpt}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">{post.date}</span>
                        <span className="text-primary text-sm font-medium flex items-center gap-1">Lesen <ArrowRight className="w-3 h-3" /></span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </AnimatedSection>
        ))}
      </div>

      {/* CTA */}
      <AnimatedSection direction="up" className="max-w-3xl mx-auto px-4 pb-20">
        <div className="glass rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Bereit für deinen ersten Ton? 🎺</h3>
          <p className="text-white/60 mb-6 text-sm">7-Tage kostenlose Challenge · 5 Minuten am Tag · Kein Vorwissen nötig</p>
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" asChild>
            <Link to="/auth">Jetzt kostenlos starten <ArrowRight className="ml-2 w-4 h-4" /></Link>
          </Button>
        </div>
      </AnimatedSection>
    </SEOPageLayout>
  );
}
