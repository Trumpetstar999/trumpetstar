import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Loader2, Play, Music, CheckCircle, Star, ArrowRight,
  Users, Tv2, BookOpen, Trophy, Mic2, Zap
} from 'lucide-react';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { FAQSchema } from '@/components/SEO';
import trumpetstarLogo from '@/assets/trumpetstar-logo.png';
import appScreenshot from '@/assets/trumpetstar-app-screenshot.png';
import { useLanguage } from '@/hooks/useLanguage';

export default function LandingPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [audience, setAudience] = useState<'child' | 'adult' | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from('activity_logs').insert([{
          user_id: session.user.id,
          action: 'auto_redirect_to_app',
          metadata: { from: '/' },
        }]).then(() => {});
        navigate('/app', { replace: true });
      } else {
        supabase.from('landing_page_views').insert([{
          path: window.location.pathname,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent.slice(0, 200),
          language: navigator.language || null,
        }]).then(() => {});
        setChecking(false);
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
    const params = new URLSearchParams(window.location.search);
    const utmString = params.toString();
    navigate(`/signup${utmString ? `?${utmString}` : ''}`);
  };

  const landingFaqs = [
    { question: t('landing.faq.q1'), answer: t('landing.faq.a1') },
    { question: t('landing.faq.q2'), answer: t('landing.faq.a2') },
    { question: t('landing.faq.q3'), answer: t('landing.faq.a3') },
    { question: t('landing.faq.q4'), answer: t('landing.faq.a4') },
  ];

  const testimonials = [
    {
      quote: 'Ich hatte mein ganzes Leben lang das Tenorhornspiel „irgendwie" gelernt. Mit Trumpetstar habe ich endlich verstanden, wie Ansatz und Atmung wirklich funktionieren.',
      name: 'Michael R.',
      role: 'Erwachsener Anfänger, 47',
      stars: 5,
    },
    {
      quote: 'Ein fantastisch gelungenes pädagogisches Konzept – meine Tochter übt jetzt freiwillig jeden Tag. Das hätte ich nie erwartet.',
      name: 'Sandra K.',
      role: 'Mutter, Kind 9 Jahre',
      stars: 5,
    },
    {
      quote: 'Die Mitspieltracks sind genial. Ich übe zu echter Begleitung und merke, wie ich von Woche zu Woche besser werde.',
      name: 'Jonas T.',
      role: 'Schüler, 14 Jahre',
      stars: 5,
    },
  ];

  const adultContent = {
    headline: 'Trompete lernen als Erwachsener – es ist nie zu spät',
    sub: 'Tausende Erwachsene haben mit Trumpetstar von Null angefangen. Ohne Blamage. In deinem eigenen Tempo.',
    cta: 'Jetzt kostenlos starten',
  };

  const childContent = {
    headline: 'Trompete für Kinder – spielerisch & pädagogisch fundiert',
    sub: 'Professioneller Unterricht, den Kinder lieben – ab 7 Jahren, strukturiert und motivierend.',
    cta: 'Kostenlos ausprobieren',
  };

  const activeContent = audience === 'child' ? childContent : adultContent;

  return (
    <SEOPageLayout
      title={t('landing.seo.title')}
      description={t('landing.seo.description')}
    >
      <FAQSchema faqs={landingFaqs} />

      <div className="bg-gradient-to-b from-[hsl(212,100%,56%)] via-[hsl(218,88%,46%)] to-[hsl(222,86%,29%)]">

        {/* ── HERO ── */}
        <section className="relative max-w-5xl mx-auto px-5 pt-14 pb-10 text-center">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={trumpetstarLogo} alt="Trumpetstar" className="h-16 w-auto drop-shadow-lg" />
          </div>

          {/* Trust bar – above fold */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/90 text-xs font-medium px-3 py-1.5 rounded-full">
              <Users className="w-3.5 h-3.5 text-[hsl(var(--reward-gold))]" /> 500+ aktive Schüler
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/90 text-xs font-medium px-3 py-1.5 rounded-full">
              <Trophy className="w-3.5 h-3.5 text-[hsl(var(--reward-gold))]" /> Bekannt aus „2 Minuten 2 Millionen"
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/90 text-xs font-medium px-3 py-1.5 rounded-full">
              <Star className="w-3.5 h-3.5 text-[hsl(var(--reward-gold))] fill-[hsl(var(--reward-gold))]" /> 4,9 / 5 Bewertung
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/90 text-xs font-medium px-3 py-1.5 rounded-full">
              <Zap className="w-3.5 h-3.5 text-emerald-400" /> Aktualisiert März 2026
            </span>
          </div>

          {/* Audience switch */}
          <div className="flex justify-center gap-3 mb-8">
            <button
              onClick={() => setAudience('child')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${audience === 'child' ? 'bg-[hsl(var(--reward-gold))] text-slate-900 border-transparent shadow-lg' : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'}`}
            >
              👨‍👧 Für mein Kind
            </button>
            <button
              onClick={() => setAudience('adult')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${audience === 'adult' ? 'bg-[hsl(var(--reward-gold))] text-slate-900 border-transparent shadow-lg' : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'}`}
            >
              🎺 Für mich selbst
            </button>
          </div>

          {/* Dynamic headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
            {audience
              ? activeContent.headline
              : <>{t('landing.hero.title').split('\n').map((line, i, arr) => (
                  i < arr.length - 1 ? <span key={i}>{line}<br /></span> : <span key={i}>{line}</span>
                ))}{' '}
                <span className="text-[hsl(var(--reward-gold))]">{t('landing.hero.titleHighlight')}</span>
              </>
            }
          </h1>

          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-4">
            {audience ? activeContent.sub : t('landing.hero.subtitle')}
          </p>


          {/* Single dominant CTA */}
          <Button
            size="lg"
            onClick={handleCtaClick}
            className="h-16 px-10 text-xl font-bold bg-[hsl(var(--reward-gold))] hover:bg-[hsl(48,100%,45%)] text-slate-900 rounded-xl shadow-2xl shadow-yellow-500/40 gap-2 mb-3"
          >
            {audience ? activeContent.cta : 'Jetzt kostenlos starten'} <ArrowRight className="w-6 h-6" />
          </Button>
          <p className="text-white/50 text-xs mb-3">Keine Kreditkarte · Jederzeit kündbar</p>
          <button
            onClick={() => navigate('/login')}
            className="text-white/60 hover:text-white/90 text-sm underline underline-offset-2 transition-colors"
          >
            Bereits registriert? Einloggen →
          </button>
        </section>

        {/* ── DEMO VIDEO ── */}
        <section className="max-w-3xl mx-auto px-5 pb-14">
          <p className="text-center text-white/50 text-xs uppercase tracking-widest mb-4 font-medium">Sieh wie es funktioniert</p>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <iframe
              src="https://player.vimeo.com/video/955857757?title=0&byline=0&portrait=0&dnt=1"
              className="w-full aspect-video"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
              title="Trumpetstar Demo – So funktioniert das Lernen"
            />
          </div>
          <p className="text-center text-white/50 text-xs mt-3">90 Sekunden · Kein Ton nötig</p>
        </section>

        {/* ── APP SCREENSHOT ── */}
        <section className="max-w-4xl mx-auto px-5 pb-14">
          <div className="relative">
            <div className="absolute inset-0 bg-[hsl(var(--reward-gold))]/10 blur-3xl rounded-full scale-75 pointer-events-none" />
            <button onClick={handleCtaClick} className="block w-full max-w-2xl mx-auto group cursor-pointer relative">
              <img
                src={appScreenshot}
                alt={t('landing.hero.imageAlt')}
                className="relative w-full rounded-2xl shadow-2xl shadow-black/40 border border-white/10 transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="bg-[hsl(var(--reward-gold))] text-slate-900 font-bold px-6 py-3 rounded-xl shadow-lg text-lg flex items-center gap-2">
                  <Play className="w-5 h-5 fill-current" /> Jetzt starten
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* ── GRATIS FRAMING + PREISTABELLE ── */}
        <section className="max-w-4xl mx-auto px-5 pb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-3">Kostenlos anfangen. Bezahlen wenn du wächst.</h2>
          <p className="text-center text-white/60 mb-10 text-sm">Kein Risiko, kein Vertrag, 30 Tage Geld-zurück-Garantie</p>

          <div className="grid md:grid-cols-3 gap-5">
            {/* FREE */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-6 flex flex-col">
              <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-2">Gratis</p>
              <p className="text-4xl font-bold text-white mb-1">0 €</p>
              <p className="text-white/50 text-xs mb-5">für immer kostenlos</p>
              <ul className="space-y-2 text-sm text-white/80 flex-1 mb-6">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> 30 kostenlose Lieder</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Anfänger-Kurs komplett</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Notenleser & Metronom</li>
              </ul>
              <Button onClick={handleCtaClick} variant="outline" className="w-full border-white/30 text-white hover:bg-white/10">
                Gratis starten
              </Button>
            </div>

            {/* BASIC */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-6 flex flex-col">
              <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-2">Buch</p>
              <p className="text-4xl font-bold text-white mb-1">39 €</p>
              <p className="text-white/50 text-xs mb-5">einmalig · Notenhefte</p>
              <ul className="space-y-2 text-sm text-white/80 flex-1 mb-6">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Gedrucktes Notenheft</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Ohne App-Zugang</li>
                <li className="flex items-center gap-2 opacity-40"><CheckCircle className="w-4 h-4 shrink-0" /> Keine Videos inklusive</li>
              </ul>
              <Button onClick={() => navigate('/preise')} variant="outline" className="w-full border-white/30 text-white hover:bg-white/10">
                Zum Shop
              </Button>
            </div>

            {/* PRO — highlighted */}
            <div className="bg-[hsl(var(--reward-gold))]/15 backdrop-blur-sm border-2 border-[hsl(var(--reward-gold))]/60 rounded-2xl p-6 flex flex-col relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[hsl(var(--reward-gold))] text-slate-900 text-xs font-bold px-3 py-1 rounded-full shadow">
                🏆 Empfohlen
              </span>
              <p className="text-[hsl(var(--reward-gold))] text-xs uppercase tracking-widest font-semibold mb-2">PRO</p>
              <p className="text-4xl font-bold text-white mb-1">15 €<span className="text-lg font-normal text-white/60">/Monat</span></p>
              <p className="text-white/50 text-xs mb-5">erster Monat nur 1 €</p>
              <ul className="space-y-2 text-sm text-white/80 flex-1 mb-6">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Alle 200+ Lernvideos</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Alle Mitspieltracks</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> KI-Assistent & Noten-Tool</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Direktes Lehrer-Feedback</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Prioritäts-Support</li>
              </ul>
              <Button onClick={handleCtaClick} className="w-full bg-[hsl(var(--reward-gold))] hover:bg-[hsl(48,100%,45%)] text-slate-900 font-bold">
                1 € – Jetzt testen
              </Button>
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF – TESTIMONIALS ── */}
        <section className="max-w-5xl mx-auto px-5 pb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-3">Was unsere Schüler sagen</h2>
          <div className="flex justify-center gap-1 mb-8">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="w-5 h-5 text-[hsl(var(--reward-gold))] fill-[hsl(var(--reward-gold))]" />
            ))}
            <span className="text-white/60 text-sm ml-2">4,9 von 5 · 500+ Schüler</span>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-4 h-4 text-[hsl(var(--reward-gold))] fill-[hsl(var(--reward-gold))]" />
                  ))}
                </div>
                <p className="text-white/85 text-sm leading-relaxed flex-1">„{t.quote}"</p>
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-white/50 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 2 MIN 2 MIO BADGE ── */}
        <section className="max-w-3xl mx-auto px-5 pb-16">
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-8 text-center flex flex-col md:flex-row items-center gap-6">
            <div className="text-5xl shrink-0">📺</div>
            <div className="text-left">
              <p className="text-[hsl(var(--reward-gold))] font-bold text-sm uppercase tracking-widest mb-1">Bekannt aus dem TV</p>
              <p className="text-white text-xl font-bold mb-2">„2 Minuten 2 Millionen"</p>
              <p className="text-white/65 text-sm">Trumpetstar wurde in der österreichischen Startup-Show vorgestellt und überzeugte mit innovativem, digitalem Trompetenunterricht.</p>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="max-w-4xl mx-auto px-5 pb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">{t('landing.howItWorks.title')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: Tv2, title: 'Video anschauen', desc: 'Professionelle Lehrvideos – klar, kurz und praxisnah.' },
              { step: '2', icon: Mic2, title: 'Mitspielen', desc: 'Echte Begleitmusik für jede Übung. Du spielst, die Band spielt mit.' },
              { step: '3', icon: Music, title: 'Fortschritt spüren', desc: 'Woche für Woche neue Stücke – sichtbarer Fortschritt von Anfang an.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-[hsl(var(--reward-gold))] text-slate-900 font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/70">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── USPs ── */}
        <section className="max-w-5xl mx-auto px-5 pb-20">
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: BookOpen, title: 'Kompletter Lehrplan', desc: 'Vom ersten Ton bis zum fortgeschrittenen Repertoire – strukturiert und pädagogisch aufgebaut.' },
              { icon: Mic2, title: 'Echtzeit-Feedback', desc: 'Das Mikrofon-Game erkennt deine Töne live. Üben wird zum Spiel.' },
              { icon: CheckCircle, title: '30 Tage Garantie', desc: 'Nicht überzeugt? Volle Rückerstattung. Kein Wenn und Aber.' },
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

        {/* ── FAQ ── */}
        <section className="max-w-3xl mx-auto px-5 pb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-8">{t('landing.faq.title')}</h2>
          <div className="space-y-4">
            {landingFaqs.map(({ question, answer }) => (
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

        {/* ── FINAL CTA ── */}
        <section className="max-w-2xl mx-auto px-5 pb-24 text-center">
          <div className="bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] rounded-3xl p-8 md:p-12 shadow-2xl">
            <p className="text-[hsl(var(--reward-gold))] font-bold text-sm uppercase tracking-widest mb-3">
              Starte noch heute
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Die ersten 30 Lieder — gratis
            </h2>
            <p className="text-white/60 mb-8 text-sm">
              Kein Abo, keine Kreditkarte. Einfach registrieren und loslegen.
            </p>
            <Button
              size="lg"
              onClick={handleCtaClick}
              className="h-14 px-10 text-lg font-bold bg-[hsl(var(--reward-gold))] hover:bg-[hsl(48,100%,45%)] text-slate-900 rounded-xl shadow-2xl shadow-yellow-500/30 gap-2 w-full md:w-auto"
            >
              Jetzt kostenlos starten <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-white/40 text-xs mt-4">423 Schüler lernen gerade mit Trumpetstar</p>
          </div>
        </section>

      </div>
    </SEOPageLayout>
  );
}
