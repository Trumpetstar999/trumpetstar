import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Loader2, CheckCircle, Star, ArrowRight,
  Trophy, Mic2, BookOpen, Music2,
  ChevronDown, Play, Shield, Zap
} from 'lucide-react';

import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { FAQSchema } from '@/components/SEO';
import trumpetstarLogo from '@/assets/trumpetstar-logo.png';
import appPreview from '@/assets/app-preview.png';
import { useLanguage } from '@/hooks/useLanguage';

/* ─── Korrekte Daten aus der Wissensdatenbank ─── */
const CHECKOUT_URL = 'https://www.digistore24.com/product/345378';

const TESTIMONIALS = [
  {
    quote: 'Ich hatte mein ganzes Leben lang das Trompetespielen „irgendwie" gelernt. Mit Trumpetstar habe ich endlich verstanden, wie Ansatz und Atmung wirklich funktionieren.',
    name: 'Michael R.',
    role: 'Erwachsener Anfänger, 47 Jahre',
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

const FREE_FEATURES = [
  'Ausgewählte Lernvideos',
  'PDF-Noten (Auswahl)',
  'Stimmgerät & Basistools',
];

const PRO_FEATURES = [
  '300+ Lern- & Mitspielvideos',
  'Komplette Anfängerschule',
  '55 Kinderlieder + Playbacks',
  'KI-Assistent (DE/EN/ES)',
  'Persönliches Feedback vom Lehrer',
  'Fortschritt, Kalender & Erfolge',
  '30 Tage Geld-zurück-Garantie',
  'Jederzeit kündbar – kein Vertrag',
];

const STEPS = [
  {
    icon: Play,
    title: 'Video anschauen',
    desc: 'Professionelle Lehrvideos – klar, kurz und praxisnah. Von Mario Schulter persönlich erklärt.',
  },
  {
    icon: Music2,
    title: 'Mitspielen',
    desc: 'Echte Playbacks für jede Übung. Du spielst, die Band spielt mit – sofort motivierend.',
  },
  {
    icon: Trophy,
    title: 'Fortschritt spüren',
    desc: 'Lernjournal, Sterne-System und strukturierter Aufbau – von Null bis Bronze.',
  },
];

const FAQS = [
  {
    q: 'Brauche ich Vorkenntnisse?',
    a: 'Nein. Trumpetstar wurde speziell für absolute Anfänger entwickelt – Kinder ab 5–6 Jahren und Erwachsene ohne Vorkenntnisse.',
  },
  {
    q: 'Kann ich jederzeit kündigen?',
    a: 'Ja. Das Abo ist monatlich kündbar – per E-Mail bis 48h vor dem Folgemonat. Kein Vertrag, keine versteckten Kosten.',
  },
  {
    q: 'Gibt es eine Geld-zurück-Garantie?',
    a: 'Ja, 30 Tage Geld-zurück-Garantie. Wenn du nicht überzeugt bist, erhältst du dein Geld zurück – ohne Wenn und Aber.',
  },
  {
    q: 'Eignet sich Trumpetstar auch für Kinder?',
    a: 'Absolut. Die Starmethode mit Sticker-Sternen motiviert Kinder besonders gut. Für die Kleinsten empfehlen wir ein Kornett (leichter zu halten).',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [audience, setAudience] = useState<'child' | 'adult' | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
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

  const handleCta = () => {
    const params = new URLSearchParams(window.location.search);
    const utmString = params.toString();
    navigate(`/signup${utmString ? `?${utmString}` : ''}`);
  };

  const heroHeadline = audience === 'child'
    ? 'Trompete für Kinder – spielerisch & fundiert'
    : audience === 'adult'
    ? 'Trompete lernen als Erwachsener – es ist nie zu spät'
    : 'Trompete lernen – mit System & Spaß';

  const heroSub = audience === 'child'
    ? 'Strukturierter Unterricht, den Kinder lieben. Die Starmethode motiviert ab dem ersten Tag – ab 5–6 Jahren.'
    : audience === 'adult'
    ? 'Keine Vorkenntnisse nötig. In deinem eigenen Tempo, mit professionellem Aufbau und persönlicher Begleitung.'
    : 'Von Null bis zu deinen ersten Stücken – mit 300+ Videos, Playbacks und persönlichem Feedback.';

  const landingFaqs = FAQS.map(f => ({ question: f.q, answer: f.a }));

  return (
    <SEOPageLayout
      title="Trompete lernen | Trumpetstar – Online Trompetenunterricht"
      description="Trompete lernen für Anfänger & Kinder. 300+ Videos, Playbacks, KI-Assistent & persönliches Feedback. Bekannt aus 2 Minuten 2 Millionen. Jetzt kostenlos starten."
    >
      <FAQSchema faqs={landingFaqs} />

      <div className="bg-gradient-to-b from-[hsl(212,100%,56%)] via-[hsl(218,88%,46%)] to-[hsl(222,86%,29%)] min-h-screen">

        {/* ══════════════════════════════════════
            SECTION 1 — HERO
        ══════════════════════════════════════ */}
        <section className="relative max-w-6xl mx-auto px-5 pt-12 pb-16">

          {/* Logo – centred */}
          <div className="flex justify-center mb-8">
            <img src={trumpetstarLogo} alt="Trumpetstar" className="h-14 w-auto drop-shadow-lg" />
          </div>

          {/* Two-column hero */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* LEFT */}
            <div className="flex-1 text-center lg:text-left max-w-xl mx-auto lg:mx-0">

              {/* Audience toggle */}
              <div className="flex justify-center lg:justify-start gap-2 mb-7">
                <button
                  onClick={() => setAudience('child')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                    audience === 'child'
                      ? 'bg-[hsl(var(--reward-gold))] text-slate-900 border-transparent shadow-md'
                      : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                  }`}
                >
                  👨‍👧 Für mein Kind
                </button>
                <button
                  onClick={() => setAudience('adult')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                    audience === 'adult'
                      ? 'bg-[hsl(var(--reward-gold))] text-slate-900 border-transparent shadow-md'
                      : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                  }`}
                >
                  🎺 Für mich selbst
                </button>
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-5">
                {heroHeadline}
              </h1>

              <p className="text-lg text-white/75 leading-relaxed mb-8">
                {heroSub}
              </p>

              <Button
                size="lg"
                onClick={handleCta}
                className="h-14 px-9 text-lg font-bold bg-[hsl(var(--reward-gold))] hover:bg-[hsl(48,100%,43%)] text-slate-900 rounded-xl shadow-2xl shadow-yellow-500/40 gap-2 w-full sm:w-auto"
              >
                Jetzt kostenlos starten <ArrowRight className="w-5 h-5" />
              </Button>

              {/* Trust bar – below CTA, centred on mobile / left on desktop */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-5">
              {[
                  { icon: Trophy, label: 'Bekannt aus „2 Minuten 2 Millionen"', color: 'text-[hsl(var(--reward-gold))]' },
                  { icon: Star,  label: '4,9 / 5 Bewertung', color: 'text-[hsl(var(--reward-gold))]' },
                  { icon: Shield, label: '30 Tage Geld-zurück', color: 'text-emerald-400' },
                  { icon: CheckCircle, label: '500+ Schüler:innen', color: 'text-emerald-400' },
                ].map(({ icon: Icon, label, color }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/90 text-xs font-medium px-3 py-1.5 rounded-full"
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
                    {label}
                  </span>
                ))}
              </div>

            </div>

            {/* RIGHT – App preview */}
            <div className="flex-1 w-full max-w-md lg:max-w-none">
              <div
                onClick={handleCta}
                className="relative cursor-pointer group"
                aria-label="App starten"
              >
                <img
                  src={appPreview}
                  alt="Trumpetstar App – Vorschau"
                  className="w-full transition-transform duration-300 group-hover:scale-[1.02] drop-shadow-2xl mix-blend-normal"
                  style={{ background: 'transparent' }}
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 backdrop-blur-sm gap-3">
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base font-bold bg-[hsl(var(--reward-gold))] hover:bg-[hsl(48,100%,43%)] text-slate-900 rounded-xl shadow-2xl shadow-yellow-500/40 gap-2 pointer-events-none"
                  >
                    Jetzt anmelden <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 2 — SO FUNKTIONIERT'S
        ══════════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-5 py-16 border-t border-white/10">
          <h2 className="text-3xl font-bold text-white text-center mb-2">So funktioniert Trumpetstar</h2>
          <p className="text-center text-white/55 text-sm mb-12">Drei Schritte – vom ersten Ton zum ersten Stück</p>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="bg-white/[0.08] border border-white/[0.12] rounded-2xl p-7 text-center">
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--reward-gold))]/20 border border-[hsl(var(--reward-gold))]/30 flex items-center justify-center mx-auto mb-5">
                  <Icon className="w-6 h-6 text-[hsl(var(--reward-gold))]" />
                </div>
                <p className="text-[hsl(var(--reward-gold))] text-xs font-bold uppercase tracking-widest mb-2">Schritt {i + 1}</p>
                <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>


        {/* ══════════════════════════════════════
            SECTION 4 — WARUM TRUMPETSTAR (USPs)
        ══════════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-5 py-16 border-t border-white/10">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Warum Trumpetstar?</h2>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: BookOpen,
                title: 'Kompletter Lehrplan',
                desc: 'Strukturierter Aufbau vom ersten Ton bis zur Übertrittsprüfung. Anfänger, Level 1 bis Bronze – alles abgedeckt.',
              },
              {
                icon: Mic2,
                title: 'Persönliches Feedback',
                desc: 'Kein anonymes System – Mario Schulter und sein Team helfen dir persönlich weiter. Direkt und menschlich.',
              },
              {
                icon: Zap,
                title: 'Für Jung & Alt',
                desc: 'Kinder ab 5–6 Jahren mit Starmethode. Erwachsene ohne Vorkenntnisse. Beide Wege vollständig abgedeckt.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/[0.08] border border-white/[0.12] rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-[hsl(var(--reward-gold))]" />
                </div>
                <h3 className="text-white font-bold text-base mb-2">{title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 5 — TESTIMONIALS
        ══════════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-5 py-16 border-t border-white/10">
          <h2 className="text-3xl font-bold text-white text-center mb-3">Was unsere Schüler sagen</h2>
          <div className="flex items-center justify-center gap-1 mb-10">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="w-4 h-4 text-[hsl(var(--reward-gold))] fill-[hsl(var(--reward-gold))]" />
            ))}
            <span className="text-white/50 text-sm ml-2">4,9 von 5 · 500+ Schüler</span>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ quote, name, role, stars }) => (
              <div key={name} className="bg-white/[0.08] border border-white/[0.12] rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[hsl(var(--reward-gold))] fill-[hsl(var(--reward-gold))]" />
                  ))}
                </div>
                <p className="text-white/80 text-sm leading-relaxed flex-1">„{quote}"</p>
                <div className="border-t border-white/10 pt-3">
                  <p className="text-white font-semibold text-sm">{name}</p>
                  <p className="text-white/45 text-xs">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 6 — TV BADGE
        ══════════════════════════════════════ */}
        <section className="max-w-3xl mx-auto px-5 py-10">
          <div className="bg-white/[0.07] border border-white/[0.12] rounded-2xl p-7 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="text-5xl shrink-0">📺</div>
            <div>
              <p className="text-[hsl(var(--reward-gold))] font-bold text-xs uppercase tracking-widest mb-1">Bekannt aus dem TV</p>
              <p className="text-white text-lg font-bold mb-1">„2 Minuten 2 Millionen"</p>
              <p className="text-white/55 text-sm">
                Trumpetstar wurde in der österreichischen Startup-Show vorgestellt und überzeugte mit seinem innovativen Ansatz für digitalen Trompetenunterricht.
              </p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 7 — FAQ
        ══════════════════════════════════════ */}
        <section className="max-w-2xl mx-auto px-5 py-16 border-t border-white/10">
          <h2 className="text-3xl font-bold text-white text-center mb-10">Häufige Fragen</h2>
          <div className="space-y-3">
            {FAQS.map(({ q, a }, i) => (
              <div
                key={q}
                className="bg-white/[0.08] border border-white/[0.12] rounded-xl overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-white font-semibold text-sm pr-4">{q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-white/50 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-white/65 text-sm leading-relaxed">
                    {a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 8 — FINAL CTA
        ══════════════════════════════════════ */}
        <section className="max-w-2xl mx-auto px-5 pb-24">
          <div className="bg-white/[0.07] border border-white/[0.12] rounded-3xl p-10 md:p-14 text-center">
            <p className="text-[hsl(var(--reward-gold))] font-bold text-xs uppercase tracking-widest mb-4">
              Starte noch heute
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
              Dein erstes Stück wartet auf dich
            </h2>
            <p className="text-white/55 text-sm mb-8 max-w-md mx-auto">
              Registriere dich kostenlos und leg sofort los. Kein Abo nötig – upgrade wann du willst.
            </p>
            <Button
              size="lg"
              onClick={handleCta}
              className="h-14 px-10 text-lg font-bold bg-[hsl(var(--reward-gold))] hover:bg-[hsl(48,100%,43%)] text-slate-900 rounded-xl shadow-2xl shadow-yellow-500/30 gap-2 w-full sm:w-auto"
            >
              Jetzt kostenlos starten <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-white/35 text-xs mt-4">
              Keine Kreditkarte · 30 Tage Geld-zurück-Garantie · Jederzeit kündbar
            </p>
          </div>
        </section>

      </div>
    </SEOPageLayout>
  );
}
