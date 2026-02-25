import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Music, CheckCircle, ArrowRight } from "lucide-react";
import { SEOPageLayout } from "@/components/seo/SEOPageLayout";
import { AnimatedSection } from "@/components/seo/AnimatedSection";

const TrompeteErsterTonPage = () => {
  return (
    <SEOPageLayout>
      <title>Erster Ton auf der Trompete – So gelingt er | Trumpetstar</title>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedSection direction="up">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/15">
              <Music className="h-4 w-4" />
              Dein erster Ton
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Erster Ton auf der Trompete
            </h1>
            <p className="text-xl text-white/75 mb-8 max-w-2xl mx-auto">
              So gelingt dir der erste Ton – einfach, entspannt und mit Spaß.
            </p>
          </AnimatedSection>

          <AnimatedSection direction="up" delay={150}>
            <div className="max-w-3xl mx-auto mb-10">
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
                <iframe
                  src="https://player.vimeo.com/video/955857757?title=0&byline=0&portrait=0&dnt=1"
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                  allowFullScreen
                  title="Erster Ton auf der Trompete"
                />
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection direction="up" delay={300}>
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" asChild>
              <Link to="/signup">Jetzt starten <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </AnimatedSection>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection direction="up">
            <h2 className="text-3xl font-bold text-white mb-10 text-center">Schritt für Schritt</h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-6">
            {["Lippen locker zusammenlegen", "Sanft in das Mundstück summen", "Mundstück an die Trompete – und spielen!"].map((step, i) => (
              <AnimatedSection key={i} direction="up" delay={i * 120}>
                <Card className="hover-lift">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-semibold text-card-foreground">Schritt {i + 1}</p>
                    <p className="text-muted-foreground mt-2 text-sm">{step}</p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <AnimatedSection direction="up" className="max-w-2xl mx-auto text-center glass rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-white mb-4">Bereit für deinen ersten Ton?</h2>
          <p className="text-white/70 mb-6">Starte jetzt kostenlos und lerne Schritt für Schritt mit Video-Begleitung.</p>
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" asChild>
            <Link to="/signup">Kostenlos starten <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </AnimatedSection>
      </section>
    </SEOPageLayout>
  );
};

export default TrompeteErsterTonPage;
