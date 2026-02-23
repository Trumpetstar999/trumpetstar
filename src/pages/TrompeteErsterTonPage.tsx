import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Music, CheckCircle, ArrowRight } from "lucide-react";

const TrompeteErsterTonPage = () => {
  return (
    <>
      <title>Erster Ton auf der Trompete – So gelingt er | Trumpetstar</title>
      <div className="min-h-screen bg-background">
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Music className="h-4 w-4" />
              Dein erster Ton
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Erster Ton auf der Trompete
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              So gelingt dir der erste Ton – einfach, entspannt und mit Spaß.
            </p>
            <Button size="lg" asChild>
              <Link to="/auth">Jetzt starten <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>

        <section className="py-12 px-4 bg-muted/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Schritt für Schritt</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {["Lippen locker zusammenlegen", "Sanft in das Mundstück summen", "Mundstück an die Trompete – und spielen!"].map((step, i) => (
                <Card key={i}>
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="h-8 w-8 text-primary mx-auto mb-4" />
                    <p className="font-medium text-foreground">Schritt {i + 1}</p>
                    <p className="text-muted-foreground mt-2">{step}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default TrompeteErsterTonPage;
