import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Play, BookOpen, Music, Headphones, CheckCircle, Star, ArrowRight } from 'lucide-react';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { FAQSchema } from '@/components/SEO';
import trumpetstarLogo from '@/assets/trumpetstar-logo.png';

const LANDING_FAQS = [
  { question: 'Ist die App wirklich kostenlos?', answer: 'Ja! Du kannst mit dem kostenlosen Plan starten und hast Zugriff auf die ersten Lektionen und alle Tools. Für den vollen Zugang gibt es Premium-Pläne.' },
  { question: 'Brauche ich die Trumpetstar-Hefte?', answer: 'Die App ist perfekt auf die Trumpetstar-Hefte abgestimmt, funktioniert aber auch eigenständig mit den enthaltenen Video-Lektionen und Tools.' },
  { question: 'Für welches Alter ist die App geeignet?', answer: 'Für alle! Kinder ab 6 Jahren lernen spielerisch, Erwachsene profitieren von strukturierten Lektionen und professionellen Tools.' },
  { question: 'Kann ich die App auf dem iPad nutzen?', answer: 'Ja, die App läuft auf allen Geräten mit einem modernen Browser – Smartphone, Tablet und Desktop.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  // Check session and redirect if logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Track auto-redirect
        supabase.from('activity_logs').insert([{
          user_id: session.user.id,
          action: 'auto_redirect_to_app',
          metadata: { from: '/' },
        }]).then(() => {});
        navigate('/app', { replace: true });
      } else {
        setChecking(false);
        // Track landing view (anonymous)
        // No user_id available for anonymous tracking
      }
    });
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[hsl(212,100%,56%)] via-[hsl(218,88%,46%)] to-[hsl(222,86%,29%)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  const handleCtaClick = () => {
    // Pass UTM params
    const params = new URLSearchParams(window.location.search);
    const utmString = params.toString();
    navigate(`/signup${utmString ? `?${utmString}` : ''}`);
  };

  return (
    <SEOPageLayout>
      <FAQSchema faqs={LANDING_FAQS} />

      <div className="bg-gradient-to-b from-[hsl(212,100%,56%)] via-[hsl(218,88%,46%)] to-[hsl(222,86%,29%)]">
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-5 pt-16 pb-20 text-center">
          <div className="flex justify-center mb-8">
            <img src={trumpetstarLogo} alt="Trumpetstar" className="h-20 w-auto drop-shadow-lg" />
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Trompete lernen –<br />kinderleicht.{' '}
            <span className="text-[hsl(var(--reward-gold))]">Auch für Erwachsene.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Schritt für Schritt, total flexibel – mit Mitspielvideos und persönlichem Feedback von ausgebildeten Lehrern.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg"
              onClick={handleCtaClick}
              className="h-14 px-8 text-lg font-bold bg-[hsl(var(--reward-gold))] hover:bg-[hsl(48,100%,45%)] text-slate-900 rounded-xl shadow-lg shadow-yellow-500/30 gap-2"
            >
              Kostenlos starten <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="lg"
              onClick={() => navigate('/login')}
              className="h-14 px-8 text-lg text-white/90 hover:text-white hover:bg-white/10 rounded-xl"
            >
              Ich habe schon einen Account
            </Button>
          </div>
        </section>

        {/* USPs */}
        <section className="max-w-5xl mx-auto px-5 pb-20">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Play, title: 'Video-Lektionen', desc: 'Strukturierte Kurse vom Anfänger bis zum Fortgeschrittenen – Schritt für Schritt erklärt.' },
              { icon: Headphones, title: 'Playbacks & Audio', desc: 'Übe mit professionellen Begleit-Tracks in verschiedenen Tempi zu deinen Noten.' },
              { icon: Music, title: 'Übe-Tools', desc: 'Metronom, Stimmgerät, Grifftabelle und Noten-Viewer – alles in einer App.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-[hsl(var(--reward-gold))]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/70">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-4xl mx-auto px-5 pb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">So funktioniert's</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Kostenlos registrieren', desc: 'Erstelle in Sekunden ein Konto – ganz ohne Kreditkarte.' },
              { step: '2', title: 'Lektionen starten', desc: 'Wähle dein Level und lerne mit Videos, Noten und Playbacks.' },
              { step: '3', title: 'Fortschritt verfolgen', desc: 'Sammle Sterne, nutze die Übe-Tools und werde besser – Tag für Tag.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[hsl(var(--reward-gold))] text-slate-900 font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/70">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Social Proof */}
        <section className="max-w-4xl mx-auto px-5 pb-20">
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-8 text-center">
            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-6 h-6 text-[hsl(var(--reward-gold))] fill-[hsl(var(--reward-gold))]" />
              ))}
            </div>
            <p className="text-white/90 text-lg italic mb-4">
              „Von Musikpädagogen entwickelt – für alle, die Trompete lernen wollen."
            </p>
            <div className="flex flex-wrap gap-4 justify-center text-sm text-white/60">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-400" /> Strukturierte Lernpfade</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-400" /> Für Kinder & Erwachsene</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-400" /> Perfekt zu den Heften</span>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-5 pb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Häufige Fragen</h2>
          <div className="space-y-4">
            {LANDING_FAQS.map(({ question, answer }) => (
              <details key={question} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl overflow-hidden group">
                <summary className="cursor-pointer px-6 py-4 text-white font-semibold flex items-center justify-between">
                  {question}
                  <ArrowRight className="w-4 h-4 text-white/50 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-6 pb-4 text-white/70 text-sm">
                  {answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-3xl mx-auto px-5 pb-20 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Bereit loszulegen?</h2>
          <Button 
            size="lg"
            onClick={handleCtaClick}
            className="h-14 px-8 text-lg font-bold bg-[hsl(var(--reward-gold))] hover:bg-[hsl(48,100%,45%)] text-slate-900 rounded-xl shadow-lg shadow-yellow-500/30 gap-2"
          >
            Kostenlos starten <ArrowRight className="w-5 h-5" />
          </Button>
        </section>
      </div>
    </SEOPageLayout>
  );
}
