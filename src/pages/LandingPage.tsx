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
import bekanntAus from '@/assets/bekannt-aus.png';
import appPreview from '@/assets/app-preview.jpg';
import shotLevels from '@/assets/screenshots/levels.webp';
import shotNoten from '@/assets/screenshots/noten.webp';
import shotNotenhefte from '@/assets/screenshots/notenhefte.webp';
import shotGame from '@/assets/screenshots/game.webp';
import shotCoach from '@/assets/screenshots/coach.webp';
import shotAudios from '@/assets/screenshots/audios.webp';
import shotProfil from '@/assets/screenshots/profil.webp';
import testimonialsImg from '@/assets/testimonials-real.png';
import { useLanguage } from '@/hooks/useLanguage';
import { CinematicHero } from '@/components/landing/CinematicHero';

/* ─── Screenshots: was dich in der App erwartet ─── */
const SCREENSHOTS = [
  { src: shotLevels,     title: '440+ Mitspielvideos in 24+ Levels',          desc: 'Vom ersten Ton bis zum Konzertstück – strukturiert aufgebaut und jederzeit durchsuchbar.' },
  { src: shotNoten,      title: 'Noten mitlesen & üben',                desc: 'Synchrone Noten zum Mitspielen – mit Tempo-Regler, A–B-Loop und Grifftabelle direkt im Bild.' },
  { src: shotCoach,      title: 'Toni, dein KI-Trompeten-Coach',        desc: 'Fragen zu Griffen, Ansatz oder Technik? Toni antwortet in Echtzeit – mit Verlinkung zur passenden Übung.' },
  { src: shotGame,       title: 'NoteRunner – Notenlesen als Spiel',    desc: 'Spiele die richtige Note auf deiner Trompete – das Mikrofon erkennt jeden Ton in Echtzeit.' },
  { src: shotAudios,     title: 'Playbacks für jede Transposition',     desc: 'Bb, C, Horn F, Horn Es, Tenorhorn – alle Mitspiel-Aufnahmen für jedes Instrument verfügbar.' },
  { src: shotNotenhefte, title: '8 Notenhefte – digital im Zugang',     desc: 'Anfängerschule, Buzzing Special, Techno Tunes, Klavierbegleitungen – sofort verfügbar und druckbar.' },
  { src: shotProfil,     title: 'Dein Fortschritt auf einen Blick',     desc: 'Wochen-Sterne, Aufnahmen, Freunde & Ranking – sieh, wie du Tag für Tag besser wirst.' },
];

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
      { value: '440+', label: 'Mitspielvideos' },
      { value: '55', label: 'Kinderlieder' },
      { value: '24+', label: 'Levels' },
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
      { value: '440+', label: 'Mitspielvideos' },
      { value: '0', label: 'Vorkenntnisse nötig' },
      { value: '100%', label: 'Online & flexibel' },
      { value: '30 Tage', label: 'Geld-zurück-Garantie' },
    ],
  },
  default: {
    badge: '🎺 Für Anfänger, Kinder & Erwachsene',
    headline: 'Trompete lernen? Kinderleicht – auch für Erwachsene!',
    sub: '440+ Mitspielvideos mit optionalem Feedback von ausgebildeten Trompetenlehrern.',
    cta: 'Jetzt starten',
    ctaHref: null,
    stats: [
      { value: '440+', label: 'Mitspielvideos' },
      { value: '500+', label: 'Schüler:innen' },
      { value: '4,9★', label: 'Bewertung' },
      { value: '30 Tage', label: 'Geld-zurück-Garantie' },
    ],
  },
};

/* ─── Features nach Zielgruppe ─── */
const FEATURES_CHILD = [
  { icon: Video,     title: '440+ Mitspielvideos vom ersten Ton an',   desc: 'Professionell produziert, klar erklärt – damit Kinder ab der ersten Stunde mitspielen können.' },
  { icon: Music2,    title: '55 bekannte Kinderlieder',            desc: 'Von Alle meine Entchen bis Bruder Jakob – Lieder, die Kinder kennen und lieben.' },
  { icon: Trophy,    title: 'Starmethode & Gamification',          desc: 'Sterne sammeln, Sticker kleben, Level aufsteigen – Kinder üben freiwillig und mit Begeisterung.' },
  { icon: Users,     title: '10 echte Trompeter:innen aufgenommen', desc: 'Virtuelle Ensemble-Erfahrung: Dein Kind spielt mit echten Profi-Mitspielern zusammen.' },
  { icon: Target,    title: '24+ Levels & 11 Musikstile',           desc: 'Von Pop bis Klassik – strukturierter Aufbau mit klar sichtbarem Fortschritt.' },
  { icon: Smartphone,title: 'iOS & Android App inkl.',             desc: 'Auf Handy, Tablet und Browser – überall dabei, auch offline.' },
];

const FEATURES_ADULT = [
  { icon: Video,     title: '440+ Mitspielvideos',         desc: 'Schritt-für-Schritt erklärt von Mario Schulter & Klemens Kollmann – klar, praxisnah, motivierend.' },
  { icon: Sparkles,  title: 'KI-Coach Tim',                        desc: 'Dein persönlicher KI-Assistent beantwortet Fragen, gibt Tipps und begleitet deinen Fortschritt.' },
  { icon: Mic2,      title: 'Persönliches Feedback',               desc: 'Kein anonymes System – echte Rückmeldung vom Lehrer-Team, direkt und menschlich.' },
  { icon: Clock,     title: '100% flexibel – kein fixer Termin',   desc: 'Lerne wann und wo du willst. Pause einlegen? Kein Problem. Dein Tempo, deine Regeln.' },
  { icon: Target,    title: 'Strukturierter Aufbau ab Null',        desc: 'Vom ersten Ton bis zu vollständigen Stücken – mit klarem Lehrplan, der wirklich funktioniert.' },
  { icon: Smartphone,title: 'iOS, Android & Browser',              desc: 'Alle Inhalte auf allen Geräten. Kein Download zwingend nötig – alles läuft im Browser.' },
];

const FEATURES_DEFAULT = [
  { icon: Video,     title: '440+ professionelle Mitspielvideos',      desc: 'Klar erklärt, praxisnah aufgebaut. Kinder- und Erwachsenenpfad vollständig enthalten.' },
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
  '440+ Mitspielvideos',
  'KI-Coach Tim (DE/EN/ES)',
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
  const [slideIdx, setSlideIdx] = useState(0);
  const { t } = useLanguage();

  // Auto-rotate hero slideshow
  useEffect(() => {
    const id = setInterval(() => {
      setSlideIdx(i => (i + 1) % SCREENSHOTS.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  // Scroll-reveal: fade-up on enter viewport
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [checking]);


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
    navigate(`/auth${utmString ? `?${utmString}` : ''}`);
  };

  const ac = audience === 'child'
    ? AUDIENCE_CONTENT.child
    : audience === 'adult'
    ? AUDIENCE_CONTENT.adult
    : AUDIENCE_CONTENT.default;


  const landingFaqs = FAQS.map(f => ({ question: f.q, answer: f.a }));

  return (
    <SEOPageLayout
      title="Trompete lernen | Trumpetstar – Online Trompetenunterricht"
      description="Trompete lernen für Kinder & Erwachsene: 440+ Mitspielvideos, Playbacks, KI-Coach & echtes Feedback. Jetzt kostenlos starten."
      canonicalPath="/"
    >
      <FAQSchema faqs={landingFaqs} />

      {/* ══════════════════════════════════════
          CINEMATIC HERO (GSAP scroll-pinned)
      ══════════════════════════════════════ */}
      <CinematicHero
        logoSrc={trumpetstarLogo}
        screenshotSrc={shotLevels}
        onPrimaryCta={() => handleCta(null)}
        onSecondaryCta={() => navigate('/pricing')}
      />

      <div style={{ background: 'linear-gradient(180deg, hsl(212,100%,56%) 0%, hsl(218,88%,46%) 40%, hsl(222,86%,29%) 100%)' }} className="min-h-screen">


        {/* ══════════════════════════════════════
            SECTION 1 — HERO
        ══════════════════════════════════════ */}
        <section className="relative max-w-6xl mx-auto px-5 pt-10 pb-16">

          {/* Logo */}
          <div className="flex justify-center mb-7">
            <img src={trumpetstarLogo} alt="Trumpetstar" className="h-14 w-auto drop-shadow-lg" />
          </div>


          {/* Two-column hero */}
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

            {/* LEFT */}
            <div className="flex-1 text-center lg:text-left max-w-xl mx-auto lg:mx-0">

              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {ac.badge}
              </div>

              <h1 data-reveal className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-5">
                {ac.headline}
              </h1>

              <p data-reveal data-reveal-delay="1" className="text-lg text-white/75 leading-relaxed mb-7">
                {ac.sub}
              </p>

              {/* CTAs */}
              <div data-reveal data-reveal-delay="2" className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-6">
                <Button
                  size="lg"
                  onClick={() => handleCta(null)}
                  className="lp-btn-shine h-14 px-9 text-lg font-bold bg-[hsl(var(--reward-gold))] hover:bg-[hsl(48,100%,43%)] text-slate-900 rounded-xl shadow-2xl shadow-yellow-500/40 gap-2"
                >
                  Jetzt anmelden <ArrowRight className="w-5 h-5 lp-icon-pop" />
                </Button>
                {audience && ac.ctaHref && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleCta(ac.ctaHref)}
                    className="lp-btn-shine h-14 px-7 text-base font-semibold bg-white/10 hover:bg-white/20 text-white border-white/25 rounded-xl gap-2"
                  >
                    {ac.cta} <ArrowRight className="w-4 h-4 lp-icon-pop" />
                  </Button>
                )}
              </div>


              {/* Slim trust line */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-2 text-white/70 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-[hsl(var(--reward-gold))] fill-[hsl(var(--reward-gold))]" />
                  4,9 / 5 · 500+ Schüler:innen
                </span>
                <span className="hidden sm:inline text-white/25">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  30 Tage Geld-zurück
                </span>
                <span className="hidden sm:inline text-white/25">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-[hsl(var(--reward-gold))]" />
                  Bekannt aus „2 Min 2 Mio"
                </span>
              </div>

            </div>

            {/* RIGHT – Slideshow of real app screens */}
            <div data-reveal data-reveal-delay="2" className="w-full max-w-md mx-auto lg:flex-1 lg:max-w-none">
              <div
                onClick={() => handleCta(null)}
                className="group lp-img-zoom lp-premium-frame relative cursor-pointer bg-[hsl(218,88%,46%)] transition-transform duration-500 hover:-translate-y-1"
                aria-label="App starten"
                role="button"
              >
                <div className="relative aspect-[16/9] w-full">
                  {SCREENSHOTS.map((s, i) => (
                    <img
                      key={s.title}
                      src={s.src}
                      alt={s.title}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      width={1280}
                      className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-700 ${
                        i === slideIdx ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  ))}

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent p-4 sm:p-5">
                    <p className="text-white font-semibold text-sm sm:text-base drop-shadow">
                      {SCREENSHOTS[slideIdx].title}
                    </p>
                  </div>
                </div>
              </div>


              {/* Dots BELOW the image */}
              <div className="flex justify-center gap-2 mt-4">
                {SCREENSHOTS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Screen ${i + 1}`}
                    onClick={() => setSlideIdx(i)}
                    className={`h-2 w-2 rounded-full transition-all ${
                      i === slideIdx ? 'bg-[hsl(var(--reward-gold))] scale-125' : 'bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </div>

          </div>
        </section>


        {/* ══════════════════════════════════════
            SECTION 1.5 — EIN BLICK IN DIE APP (Zigzag, WHITE)
        ══════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white text-slate-900">
          {/* Subtiler Gold-Glow zur Abgrenzung */}
          <div className="absolute inset-0 pointer-events-none opacity-60"
               style={{ background: 'radial-gradient(900px 400px at 85% 5%, hsl(45,100%,55%,0.10), transparent 60%), radial-gradient(700px 350px at 5% 95%, hsl(218,88%,46%,0.08), transparent 60%)' }} />

          <div className="relative max-w-6xl mx-auto px-5 py-20">
            <div className="text-center mb-16">
              <p className="text-[hsl(45,90%,45%)] font-bold text-xs uppercase tracking-widest mb-3">Was dich erwartet</p>
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Ein Blick in die App</h2>
              <p className="text-slate-600 text-base max-w-2xl mx-auto">
                Keine Mockups – echte Screenshots aus Trumpetstar, so wie du sie nach dem Login siehst.
              </p>
            </div>

            {/* Zigzag-Rows */}
            <div className="space-y-20 md:space-y-28">
              {SCREENSHOTS.map((s, i) => {
                const reverse = i % 2 === 1;
                return (
                  <div
                    key={s.title}
                    data-reveal
                    className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 md:gap-14`}
                  >
                    {/* Screenshot */}
                    <div className="w-full md:w-1/2">
                      <div className="relative group lp-hover-lift">
                        <div className="absolute -inset-3 bg-gradient-to-br from-[hsl(var(--reward-gold))]/30 to-transparent rounded-3xl blur-xl opacity-50 group-hover:opacity-90 transition-opacity duration-500" />
                        <div
                          onClick={() => handleCta(null)}
                          role="button"
                          aria-label="Jetzt anmelden"
                          className="lp-img-zoom lp-premium-frame relative bg-[hsl(218,88%,46%)] cursor-pointer"
                        >
                          <img
                            src={s.src}
                            alt={s.title}
                            loading="lazy"
                            decoding="async"
                            width={1280}
                            className="w-full h-auto object-cover object-top aspect-[16/10]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Text */}
                    <div className="w-full md:w-1/2">
                      <div className="w-12 h-1 rounded-full bg-[hsl(var(--reward-gold))] mb-5" />

                      <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 leading-tight">{s.title}</h3>
                      <p className="text-slate-600 text-base leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                );

              })}
            </div>

            {/* CTA */}
            <div data-reveal className="text-center mt-20">
              <Button
                size="lg"
                onClick={() => handleCta(null)}
                className="lp-btn-shine h-14 px-9 text-base font-bold bg-[hsl(var(--reward-gold))] hover:bg-[hsl(48,100%,43%)] text-slate-900 rounded-xl shadow-xl shadow-yellow-500/30 gap-2"
              >
                Jetzt in der App anmelden <ArrowRight className="w-5 h-5 lp-icon-pop" />
              </Button>
              <p className="text-slate-500 text-xs mt-3">Kostenlos starten · Keine Kreditkarte nötig</p>
            </div>

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
            <div data-reveal className="lp-hover-lift bg-white/[0.07] border border-white/[0.12] hover:border-white/30 rounded-2xl p-7 flex flex-col">
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
                className="lp-btn-shine w-full h-12 font-semibold bg-white/10 hover:bg-white/20 text-white border-white/25 rounded-xl"
              >
                Kostenlos starten
              </Button>
            </div>

            {/* PRO */}
            <div data-reveal data-reveal-delay="1" className="lp-hover-lift bg-white/[0.10] border-2 border-[hsl(var(--reward-gold))]/50 hover:border-[hsl(var(--reward-gold))] rounded-2xl p-7 flex flex-col relative overflow-hidden hover:shadow-2xl hover:shadow-yellow-500/20">
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
                className="lp-btn-shine w-full h-12 font-bold bg-[hsl(var(--reward-gold))] hover:bg-[hsl(48,100%,43%)] text-slate-900 rounded-xl shadow-xl shadow-yellow-500/30 gap-2"
              >
                PRO jetzt freischalten <ArrowRight className="w-4 h-4 lp-icon-pop" />
              </Button>
              <p className="text-white/35 text-xs text-center mt-3">30 Tage Geld-zurück-Garantie · Keine versteckten Kosten</p>
            </div>

          </div>
        </section>


        {/* ══════════════════════════════════════
            SECTION 5 — TESTIMONIALS (echte Amazon-Rezensionen & Junior-Stars)
        ══════════════════════════════════════ */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-5 py-20">
            <div className="text-center mb-10">
              <p className="text-[hsl(var(--reward-gold))] font-bold text-xs uppercase tracking-widest mb-3">Echte Stimmen</p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Was Schüler:innen & Eltern sagen</h2>
              <div className="flex items-center justify-center gap-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-4 h-4 text-[hsl(var(--reward-gold))] fill-[hsl(var(--reward-gold))]" />
                ))}
                <span className="text-slate-500 text-sm ml-2">4,9 von 5 · 500+ Schüler:innen</span>
              </div>
            </div>
            <div
              data-reveal
              onClick={() => handleCta(null)}
              role="button"
              aria-label="Jetzt anmelden"
              className="lp-img-zoom rounded-2xl overflow-hidden shadow-xl shadow-slate-900/10 border border-slate-200 transition-shadow hover:shadow-2xl cursor-pointer"
            >
              <img
                src={testimonialsImg}
                alt="Echte Amazon-Rezensionen und Junior-Stars aus der Trumpetstar-Community"
                loading="lazy"
                decoding="async"
                className="w-full h-auto block"
              />
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 6 — TV BADGE + TEAM
        ══════════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-5 py-10">
          <div data-reveal className="lp-hover-lift bg-white/[0.07] border border-white/[0.12] hover:border-[hsl(var(--reward-gold))]/40 rounded-2xl p-7 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div className="text-5xl shrink-0 lp-icon-pop">📺</div>
              <div>
                <p className="text-[hsl(var(--reward-gold))] font-bold text-xs uppercase tracking-widest mb-1">Bekannt aus dem TV</p>
                <p className="text-white text-lg font-bold mb-1">„2 Minuten 2 Millionen" – die österreichische Startup-Show</p>
                <p className="text-white/55 text-sm">
                  Trumpetstar wurde vor der Jury vorgestellt und überzeugte mit seinem innovativen Ansatz: Strukturierter Trompetenunterricht, der wirklich für zuhause funktioniert.
                </p>
              </div>
            </div>
            <div className="relative w-full rounded-xl overflow-hidden border border-white/10 shadow-xl" style={{ aspectRatio: '16 / 9' }}>
              <iframe
                src="https://player.vimeo.com/video/737651716?title=0&byline=0&portrait=0"
                title="Trumpetstar bei 2 Minuten 2 Millionen"
                className="absolute inset-0 w-full h-full"
                frameBorder={0}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </section>


        {/* ══════════════════════════════════════
            SECTION 7 — FAQ
        ══════════════════════════════════════ */}
        <section className="bg-gradient-to-b from-white to-slate-50">
          <div className="max-w-2xl mx-auto px-5 py-20">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-3">Häufige Fragen</h2>
            <p className="text-center text-slate-500 text-sm mb-10">Alles Wichtige auf einen Blick</p>
            <div className="space-y-3">
              {FAQS.map(({ q, a }, i) => (
                <div
                  key={q}
                  data-reveal
                  className="bg-white border border-slate-200 hover:border-[hsl(45,90%,50%)]/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                >

                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="text-slate-900 font-semibold text-sm pr-4">{q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div
                    style={{
                      maxHeight: openFaq === i ? '300px' : '0px',
                      overflow: 'hidden',
                      transition: 'max-height 0.25s ease',
                    }}
                  >
                    <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed">
                      {a}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ══════════════════════════════════════
            SECTION 8 — FINAL CTA
        ══════════════════════════════════════ */}
        <section className="max-w-2xl mx-auto px-5 pt-20 pb-24">
          <div data-reveal className="lp-hover-lift bg-white/[0.07] border border-white/[0.12] hover:border-[hsl(var(--reward-gold))]/40 rounded-3xl p-10 md:p-14 text-center">
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
                className="lp-btn-shine h-14 px-10 text-lg font-bold bg-[hsl(var(--reward-gold))] hover:bg-[hsl(48,100%,43%)] text-slate-900 rounded-xl shadow-2xl shadow-yellow-500/30 gap-2"
              >
                Jetzt kostenlos starten <ArrowRight className="w-5 h-5 lp-icon-pop" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleCta(PRO_CHECKOUT_URL)}
                className="lp-btn-shine h-14 px-8 text-base font-semibold bg-white/10 hover:bg-white/20 text-white border-white/25 rounded-xl gap-2"
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

        {/* Bekannt aus – Press Logos */}
        <section className="py-12 px-6" data-reveal>
          <div
            onClick={() => handleCta(null)}
            role="button"
            aria-label="Jetzt anmelden"
            className="max-w-5xl mx-auto bg-white rounded-2xl p-6 md:p-8 shadow-xl cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-2xl"
          >
            <img
              src={bekanntAus}
              alt="Bekannt aus: ServusTV, 2 Minuten 2 Millionen (PULS 4), PULS 4, Austrian Startups, Kronen Zeitung"
              className="w-full h-auto object-contain"
              loading="lazy"
            />
          </div>
        </section>

      </div>
    </SEOPageLayout>
  );
}
