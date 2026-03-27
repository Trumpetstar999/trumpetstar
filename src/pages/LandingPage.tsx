import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Loader2, CheckCircle, Star, ArrowRight,
  Trophy, Mic2, BookOpen, Music2,
  ChevronDown, Play, Shield, Zap,
  Smartphone, Video, Users, Award,
  Heart, Clock, Target, Sparkles
} from 'lucide-react';

import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { FAQSchema } from '@/components/SEO';
import trumpetstarLogo from '@/assets/trumpetstar-logo.png';
import appPreview from '@/assets/app-preview.png';
import { useLanguage } from '@/hooks/useLanguage';

/* ─── Produkt-URLs aus Wissensdatenbank ─── */
const PRO_CHECKOUT_URL = 'https://www.digistore24.com/product/346007';
const KIDS_COURSE_URL  = 'https://trumpetstar.com/tsv1/';
const ADULT_COURSE_URL = 'https://trumpetstar.onepage.me/erwachsenenkurs';

/* ─── Zielgruppen-Inhalte ─── */
const AUDIENCE_CONTENT = {
  child: {
    badge: '👨‍👧 Für Kinder ab 5–6 Jahren',
    headline: 'Trompete für Kinder – die Starmethode macht aus Üben echten Spaß',
    sub: 'Sticker, Sterne & 55 Kinderlieder: Die Trumpetstar-Starmethode motiviert von der ersten Stunde an. Eltern berichten, dass ihre Kinder plötzlich freiwillig üben.',
    cta: 'Kurs für mein Kind ansehen',
    ctaHref: KIDS_COURSE_URL,
    stats: [
      { value: '101', label: 'Lernvideos' },
      { value: '55', label: 'Kinderlieder' },
      { value: '11', label: 'Levels' },
      { value: '5+', label: 'Jahre' },
    ],
  },
  adult: {
    badge: '🎺 Für Erwachsene jeden Alters',
    headline: 'Es ist nie zu spät – Trompete lernen als Erwachsener, in deinem eigenen Tempo',
    sub: 'Keine Vorkenntnisse nötig. Lerne mit Mario Schulter & Klemens Kollmann – flexible Zeiten, kein Unterricht von zu Hause aus, sofort erster Ton garantiert.',
    cta: 'Erwachsenenkurs ansehen',
    ctaHref: ADULT_COURSE_URL,
    stats: [
      { value: '300+', label: 'Videos' },
      { value: '0', label: 'Vorkenntnisse nötig' },
      { value: '100%', label: 'Online & flexibel' },
      { value: '30 Tage', label: 'Geld-zurück-Garantie' },
    ],
  },
  adult: {
    badge: '🎺 Für Erwachsene jeden Alters',
    headline: 'Es ist nie zu spät – Trompete lernen als Erwachsener, in deinem eigenen Tempo',
    sub: 'Keine Vorkenntnisse nötig. Lerne mit Mario Schulter & Klemens Kollmann – flexible Zeiten, kein Unterricht von zu Hause aus, sofort erster Ton garantiert.',
    cta: 'Erwachsenenkurs ansehen',
    ctaHref: ADULT_COURSE_URL,
    stats: [
      { value: '300+', label: 'Videos' },
      { value: '0', label: 'Vorkenntnisse nötig' },
      { value: '100%', label: 'Online & flexibel' },
      { value: '30 Tage', label: 'Geld-zurück-Garantie' },
    ],
  },
};

/* ─── Features nach Zielgruppe ─── */
const FEATURES_CHILD = [
  { icon: Video,     title: '101 Lernvideos vom ersten Ton an',   desc: 'Professionell produziert, klar erklärt – damit Kinder ab der ersten Stunde mitspielen können.' },
  { icon: Music2,    title: '55 bekannte Kinderlieder',            desc: 'Von Alle meine Entchen bis Bruder Jakob – Lieder, die Kinder kennen und lieben.' },
  { icon: Trophy,    title: 'Starmethode & Gamification',          desc: 'Sterne sammeln, Sticker kleben, Level aufsteigen – Kinder üben freiwillig und mit Begeisterung.' },
  { icon: Users,     title: '10 echte Trompeter:innen aufgenommen', desc: 'Virtuelle Ensemble-Erfahrung: Dein Kind spielt mit echten Profi-Mitspielern zusammen.' },
  { icon: Target,    title: '11 Levels & 11 Musikstile',           desc: 'Von Pop bis Klassik – strukturierter Aufbau mit klar sichtbarem Fortschritt.' },
  { icon: Smartphone,title: 'iOS & Android App inkl.',             desc: 'Auf Handy, Tablet und Browser – überall dabei, auch offline.' },
];

const FEATURES_ADULT = [
  { icon: Video,     title: '300+ Lern- & Mitspielvideos',         desc: 'Schritt-für-Schritt erklärt von Mario Schulter & Klemens Kollmann – klar, praxisnah, motivierend.' },
  { icon: Sparkles,  title: 'KI-Coach Tim',                        desc: 'Dein persönlicher KI-Assistent beantwortet Fragen, gibt Tipps und begleitet deinen Fortschritt.' },
  { icon: Mic2,      title: 'Persönliches Feedback',               desc: 'Kein anonymes System – echte Rückmeldung vom Lehrer-Team, direkt und menschlich.' },
  { icon: Clock,     title: '100% flexibel – kein fixer Termin',   desc: 'Lerne wann und wo du willst. Pause einlegen? Kein Problem. Dein Tempo, deine Regeln.' },
  { icon: Target,    title: 'Strukturierter Aufbau ab Null',        desc: 'Vom ersten Ton bis zu vollständigen Stücken – mit klarem Lehrplan, der wirklich funktioniert.' },
  { icon: Smartphone,title: 'iOS, Android & Browser',              desc: 'Alle Inhalte auf allen Geräten. Kein Download zwingend nötig – alles läuft im Browser.' },
];

const FEATURES_DEFAULT = [
  { icon: Video,     title: '300+ professionelle Lernvideos',      desc: 'Klar erklärt, praxisnah aufgebaut. Kinder- und Erwachsenenpfad vollständig enthalten.' },
  { icon: Music2,    title: 'Echte Playbacks & Mitspieltracks',    desc: 'Du spielst – die Band spielt mit. Sofort motivierend, von der ersten Übung an.' },
  { icon: Sparkles,  title: 'KI-Coach Tim & Gamification',         desc: 'Sterne, Levels, Badges und ein KI-Assistent, der dich durch deinen Lernweg begleitet.' },
  { icon: Mic2,      title: 'Persönliches Feedback vom Team',      desc: 'Mario Schulter und sein Team helfen dir weiter – direkt, schnell und ehrlich.' },
  { icon: Target,    title: 'Strukturierter Aufbau für alle Levels', desc: 'Von Null bis Bronze: Ein durchdachter Lehrplan, der nachweislich funktioniert.' },
  { icon: Smartphone,title: 'iOS, Android & Browser',              desc: 'Auf allen Geräten verfügbar. App Store & Google Play – oder direkt im Browser.' },
];

/* ─── Pricing ─── */
const FREE_FEATURES = [
  'Ausgewählte Lernvideos (kostenlos)',
  'PDF-Noten – Basisauswahl',
  'Stimmgerät & Metronom',
  'Staff Wars Lernspiel',
  'Basis-Fortschrittsanzeige',
];

const PRO_FEATURES = [
  '300+ Lern- & Mitspielvideos',
  'Komplette Anfängerschule (Band 1)',
  '55 Kinderlieder + Playbacks',
  'KI-Coach Tim (DE/EN/ES)',
  'Persönliches Feedback vom Lehrer',
  'Fortschritt, Kalender & Erfolge',
  'Alle Levels & Übungen freigeschaltet',
  '30 Tage Geld-zurück-Garantie',
];

/* ─── Testimonials ─── */
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

/* ─── FAQs ─── */
const FAQS = [
  {
    q: 'Brauche ich Vorkenntnisse?',
    a: 'Nein. Trumpetstar wurde speziell für absolute Anfänger entwickelt – Kinder ab 5–6 Jahren und Erwachsene ohne jede Vorerfahrung. Der Kurs beginnt beim allerersten Ton.',
  },
  {
    q: 'Für welches Alter ist Trumpetstar geeignet?',
    a: 'Für Kinder ab ca. 5–6 Jahren (empfohlen: Kornett) und für Erwachsene jeden Alters. Es gibt keinen Alterslimit nach oben – viele unserer Schüler starten mit 40, 50 oder 60 Jahren.',
  },
  {
    q: 'Gibt es eine Geld-zurück-Garantie?',
    a: 'Ja, 30 Tage Geld-zurück-Garantie. Wenn du nicht überzeugt bist, erhältst du dein Geld zurück – ohne Wenn und Aber, ohne Fragen.',
  },
  {
    q: 'Kann ich jederzeit kündigen?',
    a: 'Ja. Das Abo ist monatlich kündbar – per E-Mail bis 48h vor dem Folgemonat. Kein Vertrag, keine versteckten Kosten, kein Mindestabo.',
  },
  {
    q: 'Welche Trompete brauche ich?',
    a: 'Jede Standardtrompete in Bb reicht aus. Für Kinder bis ca. 9 Jahre empfehlen wir ein Kornett – leichter zu halten, gleiche Technik. Eine teure Profitrompete ist zum Starten nicht nötig.',
  },
  {
    q: 'Kann ich Trumpetstar auf meinem Handy nutzen?',
    a: 'Ja. Trumpetstar ist als iOS App (App Store), Android App (Google Play) und im Browser verfügbar – auf allen Geräten ohne Einschränkung.',
  },
];

/* ─── Steps ─── */
const STEPS = [
  {
    icon: Play,
    title: 'Video anschauen',
    desc: 'Professionelle Lehrvideos von Mario Schulter – klar, kurz und sofort umsetzbar. Direkt erklärt, ohne Fachjargon.',
  },
  {
    icon: Music2,
    title: 'Mitspielen & üben',
    desc: 'Echte Playbacks für jede Übung. Du spielst – die Band spielt mit. Sofort motivierend, von der ersten Note an.',
  },
  {
    icon: Trophy,
    title: 'Fortschritt feiern',
    desc: 'Sterne sammeln, Levels aufsteigen, Badges freischalten. Dein Fortschritt wird sichtbar gemacht – das motiviert.',
  },
];

/* ─── Komponente ─── */
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
      <div style={{ background: 'linear-gradient(180deg, hsl(212,100%,56%) 0%, hsl(218,88%,46%) 40%, hsl(222,86%,29%) 100%)' }} className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  const handleCta = (href?: string | null) => {
    if (href) {
      window.location.href = href;
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const utmString = params.toString();
    navigate(`/signup${utmString ? `?${utmString}` : ''}`);
  };

  const ac = audience === 'child'
    ? AUDIENCE_CONTENT.child
    : audience === 'adult'
    ? AUDIENCE_CONTENT.adult
    : AUDIENCE_CONTENT.default;

  const features = audience === 'child'
    ? FEATURES_CHILD
    : audience === 'adult'
    ? FEATURES_ADULT
    : FEATURES_DEFAULT;

  const landingFaqs = FAQS.map(f => ({ question: f.q, answer: f.a }));

  return (
    <SEOPageLayout
      title="Trompete lernen | Trumpetstar – Online Trompetenunterricht"
      description="Trompete lernen für Anfänger, Kinder & Erwachsene. 300+ Videos, Playbacks, KI-Coach & persönliches Feedback. Bekannt aus 2 Minuten 2 Millionen. Jetzt kostenlos starten."
    >
      <FAQSchema faqs={landingFaqs} />

      <div style={{ background: 'linear-gradient(180deg, hsl(212,100%,56%) 0%, hsl(218,88%,46%) 40%, hsl(222,86%,29%) 100%)' }} className="min-h-screen">

        {/* ══════════════════════════════════════
            SECTION 1 — HERO
        ══════════════════════════════════════ */}
        <section className="relative max-w-6xl mx-auto px-5 pt-10 pb-16">

          {/* Logo */}
          <div className="flex justify-center mb-7">
            <img src={trumpetstarLogo} alt="Trumpetstar" className="h-14 w-auto drop-shadow-lg" />
          </div>

          {/* Audience toggle */}
          <div className="flex justify-center gap-2 mb-8">
            <button
              onClick={() => setAudience(audience === 'child' ? null : 'child')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                audience === 'child'
                  ? 'bg-[hsl(var(--reward-gold))] text-slate-900 border-transparent shadow-md'
                  : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
              }`}
            >
              👨‍👧 Für mein Kind
            </button>
            <button
              onClick={() => setAudience(audience === 'adult' ? null : 'adult')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                audience === 'adult'
                  ? 'bg-[hsl(var(--reward-gold))] text-slate-900 border-transparent shadow-md'
                  : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
              }`}
            >
              🎺 Für mich selbst
            </button>
          </div>

          {/* Two-column hero */}
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

            {/* LEFT */}
            <div className="flex-1 text-center lg:text-left max-w-xl mx-auto lg:mx-0">

              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {ac.badge}
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-5">
                {ac.headline}
              </h1>

              <p className="text-lg text-white/75 leading-relaxed mb-7">
                {ac.sub}
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
                {ac.stats.map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <div className="text-2xl font-extrabold text-[hsl(var(--reward-gold))]">{value}</div>
                    <div className="text-white/55 text-xs">{label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button
                  size="lg"
                  onClick={() => handleCta(null)}
                  className="h-14 px-9 text-lg font-bold bg-[hsl(var(--reward-gold))] hover:bg-[hsl(48,100%,43%)] text-slate-900 rounded-xl shadow-2xl shadow-yellow-500/40 gap-2"
                >
                  Jetzt kostenlos starten <ArrowRight className="w-5 h-5" />
                </Button>
                {audience && ac.ctaHref && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleCta(ac.ctaHref)}
                    className="h-14 px-7 text-base font-semibold bg-white/10 hover:bg-white/20 text-white border-white/25 rounded-xl gap-2"
                  >
                    {ac.cta} <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Trust bar */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-5">
                {[
                  { icon: Trophy,      label: 'Bekannt aus „2 Minuten 2 Millionen"', color: 'text-[hsl(var(--reward-gold))]' },
                  { icon: Star,        label: '4,9 / 5 Bewertung',                   color: 'text-[hsl(var(--reward-gold))]' },
                  { icon: Shield,      label: '30 Tage Geld-zurück',                 color: 'text-emerald-400' },
                  { icon: CheckCircle, label: '500+ Schüler:innen',                  color: 'text-emerald-400' },
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
                onClick={() => handleCta(null)}
                className="relative cursor-pointer group"
                aria-label="App starten"
              >
                <img
                  src={appPreview}
                  alt="Trumpetstar App – Vorschau"
                  className="w-full rounded-2xl transition-transform duration-300 group-hover:scale-[1.02] drop-shadow-2xl"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 backdrop-blur-sm gap-3">
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base font-bold bg-[hsl(var(--reward-gold))] hover:bg-[hsl(48,100%,43%)] text-slate-900 rounded-xl shadow-2xl gap-2 pointer-events-none"
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
          <h2 className="text-3xl font-bold text-white text-center mb-2">So lernst du mit Trumpetstar</h2>
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
            SECTION 3 — WAS DU BEKOMMST (dynamisch)
        ══════════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-5 py-16 border-t border-white/10">
          <h2 className="text-3xl font-bold text-white text-center mb-3">
            {audience === 'child' ? 'Was Kinder bekommen' : audience === 'adult' ? 'Was du bekommst' : 'Was in Trumpetstar steckt'}
          </h2>
          <p className="text-center text-white/55 text-sm mb-12">
            {audience === 'child'
              ? 'Alles was ein Kind braucht, um von Null an echte Fortschritte zu machen'
              : audience === 'adult'
              ? 'Alles für einen strukturierten Start – ohne Vorkenntnisse, ohne Extrakosten'
              : 'Ein vollständiges Lernsystem für Kinder und Erwachsene'}
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/[0.08] border border-white/[0.12] rounded-2xl p-6 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--reward-gold))]/15 border border-[hsl(var(--reward-gold))]/25 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-5 h-5 text-[hsl(var(--reward-gold))]" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm mb-1.5">{title}</h3>
                  <p className="text-white/55 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mid-page CTA */}
          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={() => handleCta(null)}
              className="h-13 px-8 text-base font-bold bg-[hsl(var(--reward-gold))] hover:bg-[hsl(48,100%,43%)] text-slate-900 rounded-xl shadow-xl shadow-yellow-500/30 gap-2"
            >
              Kostenlos registrieren & direkt starten <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-white/40 text-xs mt-3">Keine Kreditkarte nötig · Sofortiger Zugang</p>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 4 — PRICING
        ══════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-5 py-16 border-t border-white/10">
          <h2 className="text-3xl font-bold text-white text-center mb-3">Kostenlos starten – wann du willst upgraden</h2>
          <p className="text-center text-white/55 text-sm mb-12">Kein Risiko. Kein Vertrag. 30 Tage Geld-zurück-Garantie.</p>

          <div className="grid md:grid-cols-2 gap-6 items-stretch">

            {/* FREE */}
            <div className="bg-white/[0.07] border border-white/[0.12] rounded-2xl p-7 flex flex-col">
              <div className="mb-5">
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Kostenlos</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-white">€0</span>
                  <span className="text-white/40 text-sm mb-1.5">/Monat</span>
                </div>
                <p className="text-white/55 text-sm">Jetzt sofort loslegen – ohne Kreditkarte.</p>
              </div>
              <ul className="space-y-3 mb-7 flex-1">
                {FREE_FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-white/70 text-sm">
                    <CheckCircle className="w-4 h-4 text-white/40 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleCta(null)}
                className="w-full h-12 font-semibold bg-white/10 hover:bg-white/20 text-white border-white/25 rounded-xl"
              >
                Kostenlos starten
              </Button>
            </div>

            {/* PRO */}
            <div className="bg-white/[0.10] border-2 border-[hsl(var(--reward-gold))]/50 rounded-2xl p-7 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[hsl(var(--reward-gold))] text-slate-900 text-xs font-bold px-3 py-1.5 rounded-bl-xl uppercase tracking-wide">
                Beliebt
              </div>
              <div className="mb-5">
                <p className="text-[hsl(var(--reward-gold))] text-xs font-bold uppercase tracking-widest mb-1">PRO Zugang</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-white">Alles inklusive</span>
                </div>
                <p className="text-white/55 text-sm">30 Tage Geld-zurück · Jederzeit kündbar</p>
              </div>
              <ul className="space-y-3 mb-7 flex-1">
                {PRO_FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-white text-sm">
                    <CheckCircle className="w-4 h-4 text-[hsl(var(--reward-gold))] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                onClick={() => handleCta(PRO_CHECKOUT_URL)}
                className="w-full h-12 font-bold bg-[hsl(var(--reward-gold))] hover:bg-[hsl(48,100%,43%)] text-slate-900 rounded-xl shadow-xl shadow-yellow-500/30 gap-2"
              >
                PRO jetzt freischalten <ArrowRight className="w-4 h-4" />
              </Button>
              <p className="text-white/35 text-xs text-center mt-3">30 Tage Geld-zurück-Garantie · Keine versteckten Kosten</p>
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 5 — TESTIMONIALS
        ══════════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-5 py-16 border-t border-white/10">
          <h2 className="text-3xl font-bold text-white text-center mb-3">Was unsere Schüler:innen sagen</h2>
          <div className="flex items-center justify-center gap-1 mb-10">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="w-4 h-4 text-[hsl(var(--reward-gold))] fill-[hsl(var(--reward-gold))]" />
            ))}
            <span className="text-white/50 text-sm ml-2">4,9 von 5 · 500+ Schüler:innen</span>
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
            SECTION 6 — TV BADGE + TEAM
        ══════════════════════════════════════ */}
        <section className="max-w-3xl mx-auto px-5 py-10">
          <div className="bg-white/[0.07] border border-white/[0.12] rounded-2xl p-7 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="text-5xl shrink-0">📺</div>
            <div>
              <p className="text-[hsl(var(--reward-gold))] font-bold text-xs uppercase tracking-widest mb-1">Bekannt aus dem TV</p>
              <p className="text-white text-lg font-bold mb-1">„2 Minuten 2 Millionen" – die österreichische Startup-Show</p>
              <p className="text-white/55 text-sm">
                Trumpetstar wurde vor der Jury vorgestellt und überzeugte mit seinem innovativen Ansatz: Strukturierter Trompetenunterricht, der wirklich für zuhause funktioniert.
              </p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 7 — FAQ
        ══════════════════════════════════════ */}
        <section className="max-w-2xl mx-auto px-5 py-16 border-t border-white/10">
          <h2 className="text-3xl font-bold text-white text-center mb-3">Häufige Fragen</h2>
          <p className="text-center text-white/55 text-sm mb-10">Alles Wichtige auf einen Blick</p>
          <div className="space-y-3">
            {FAQS.map(({ q, a }, i) => (
              <div
                key={q}
                className="bg-white/[0.08] border border-white/[0.12] rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-white font-semibold text-sm pr-4">{q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-white/50 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  style={{
                    maxHeight: openFaq === i ? '300px' : '0px',
                    overflow: 'hidden',
                    transition: 'max-height 0.25s ease',
                  }}
                >
                  <div className="px-6 pb-5 text-white/65 text-sm leading-relaxed">
                    {a}
                  </div>
                </div>
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
              Registriere dich kostenlos und leg sofort los – oder steig direkt mit dem vollen PRO-Zugang ein. 30 Tage Geld-zurück, jederzeit kündbar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => handleCta(null)}
                className="h-14 px-10 text-lg font-bold bg-[hsl(var(--reward-gold))] hover:bg-[hsl(48,100%,43%)] text-slate-900 rounded-xl shadow-2xl shadow-yellow-500/30 gap-2"
              >
                Jetzt kostenlos starten <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleCta(PRO_CHECKOUT_URL)}
                className="h-14 px-8 text-base font-semibold bg-white/10 hover:bg-white/20 text-white border-white/25 rounded-xl gap-2"
              >
                Direkt PRO freischalten
              </Button>
            </div>
            <p className="text-white/35 text-xs mt-4">
              Keine Kreditkarte für Free · 30 Tage Geld-zurück auf PRO · Jederzeit kündbar
            </p>

            {/* Final App Badges */}
            <div className="flex items-center justify-center gap-3 mt-7 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-lg px-3 py-2">
                <Smartphone className="w-4 h-4 text-white/60" />
                <span className="text-white/60 text-xs">iOS App</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-lg px-3 py-2">
                <Smartphone className="w-4 h-4 text-white/60" />
                <span className="text-white/60 text-xs">Android App</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-lg px-3 py-2">
                <Heart className="w-4 h-4 text-white/60" />
                <span className="text-white/60 text-xs">Bekannt aus 2 Min 2 Mio</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </SEOPageLayout>
  );
}
