import { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Monitor, Copy, Send, Info, Check, Loader2, Headphones, ChevronDown, ChevronUp, Star, Timer, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { PLAN_DISPLAY_NAMES } from '@/types/plans';
import { LanguageSelectionDialog } from '@/components/onboarding/LanguageSelectionDialog';
import { WelcomeSlideshow } from '@/components/onboarding/WelcomeSlideshow';
import { MobileAudioPlayer } from '@/components/audio/MobileAudioPlayer';
import { TunerPopup } from '@/components/tuner/TunerPopup';
import { MetronomeSheet } from '@/components/mobile/MetronomeSheet';

const TEXTS = {
  de: {
    greeting: 'Hallo',
    yourPlan: 'Dein Plan',
    ipadsection: 'Optimiert für iPad & Desktop',
    ipadtext: 'Videos, Noten & Übe-Tools sind auf iPad oder Laptop verfügbar.',
    copyLink: 'Link kopieren',
    sendLink: 'Link senden',
    howTo: 'So geht\'s',
    emailPlaceholder: 'E-Mail-Adresse',
    sendButton: 'Senden',
    linkCopied: 'Link kopiert!',
    emailSent: 'E-Mail gesendet!',
    emailError: 'Fehler beim Senden',
    howToTitle: 'TrumpetStar auf dem iPad',
    howToSteps: [
      'Öffne Safari auf deinem iPad',
      'Gehe zu trumpetstar.lovable.app',
      'Drehe das iPad ins Querformat',
      'Logge dich ein & lerne mit Videos!',
    ],
    close: 'Verstanden',
    audioTitle: 'Begleit-Audios',
    audioSubtitle: 'Spiele mit professionellen Begleittracks',
  },
  en: {
    greeting: 'Hello',
    yourPlan: 'Your plan',
    ipadsection: 'Optimized for iPad & Desktop',
    ipadtext: 'Videos, sheet music & practice tools are available on iPad or laptop.',
    copyLink: 'Copy link',
    sendLink: 'Send link',
    howTo: 'How it works',
    emailPlaceholder: 'Email address',
    sendButton: 'Send',
    linkCopied: 'Link copied!',
    emailSent: 'Email sent!',
    emailError: 'Error sending',
    howToTitle: 'TrumpetStar on iPad',
    howToSteps: [
      'Open Safari on your iPad',
      'Go to trumpetstar.lovable.app',
      'Rotate your iPad to landscape',
      'Log in & learn with videos!',
    ],
    close: 'Got it',
    audioTitle: 'Backing Tracks',
    audioSubtitle: 'Play along with professional backing tracks',
  },
  es: {
    greeting: 'Hola',
    yourPlan: 'Tu plan',
    ipadsection: 'Optimizado para iPad y escritorio',
    ipadtext: 'Videos, partituras y herramientas de práctica disponibles en iPad o portátil.',
    copyLink: 'Copiar enlace',
    sendLink: 'Enviar enlace',
    howTo: 'Cómo funciona',
    emailPlaceholder: 'Correo electrónico',
    sendButton: 'Enviar',
    linkCopied: '¡Enlace copiado!',
    emailSent: '¡Email enviado!',
    emailError: 'Error al enviar',
    howToTitle: 'TrumpetStar en iPad',
    howToSteps: [
      'Abre Safari en tu iPad',
      'Ve a trumpetstar.lovable.app',
      'Gira tu iPad en horizontal',
      '¡Inicia sesión y aprende con videos!',
    ],
    close: 'Entendido',
    audioTitle: 'Pistas de acompañamiento',
    audioSubtitle: 'Toca con pistas profesionales de acompañamiento',
  },
};

export default function MobileHomePage() {
  const { user } = useAuth();
  const { planKey } = useMembership();
  const { language, isLoading: languageLoading, hasCompletedLanguageSetup, hasSeenWelcome, completeWelcome } = useLanguage();
  const [profile, setProfile] = useState<{ display_name: string | null } | null>(null);
  const [sendEmail, setSendEmail] = useState('');
  const [showSendField, setShowSendField] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showIpadCard, setShowIpadCard] = useState(false);

  const t = TEXTS[language as keyof typeof TEXTS] || TEXTS.de;
  const appUrl = window.location.origin;

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle()
        .then(({ data }) => setProfile(data));
    }
  }, [user]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setLinkCopied(true);
      toast.success(t.linkCopied);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error('Clipboard not available');
    }
  };

  const handleSendLink = async () => {
    const emailToSend = sendEmail.trim() || user?.email;
    if (!emailToSend) return;
    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-app-link', {
        body: { email: emailToSend, locale: language },
      });
      if (error) throw error;
      toast.success(t.emailSent);
      setShowSendField(false);
      setSendEmail('');
    } catch {
      toast.error(t.emailError);
    } finally {
      setIsSending(false);
    }
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || '';

  return (
    <>
      <MobileLayout>
        <div className="flex flex-col min-h-full">

          {/* ── Hero greeting bar ── */}
          <div className="px-5 pt-5 pb-4 flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm font-medium">{t.greeting} 👋</p>
              <h1 className="text-xl font-bold text-white leading-tight">{displayName}</h1>
            </div>
            <Badge className="bg-white/15 text-white border-white/20 font-semibold text-xs px-3 py-1">
              {PLAN_DISPLAY_NAMES[planKey]}
            </Badge>
          </div>

          {/* ── iPad / Desktop nudge card (collapsible) ── */}
          <div className="mx-4 mb-4">
            <button
              onClick={() => setShowIpadCard(!showIpadCard)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
              style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Monitor className="w-4 h-4 text-white/80" />
              </div>
              <span className="flex-1 text-left text-white/80 text-sm font-medium">{t.ipadsection}</span>
              {showIpadCard
                ? <ChevronUp className="w-4 h-4 text-white/50" />
                : <ChevronDown className="w-4 h-4 text-white/50" />}
            </button>

            {showIpadCard && (
              <div
                className="mt-1 px-4 pt-3 pb-4 rounded-b-2xl space-y-3"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', borderTop: 0 }}
              >
                <p className="text-white/70 text-sm leading-relaxed">{t.ipadtext}</p>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                    onClick={handleCopyLink}
                  >
                    {linkCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {linkCopied ? t.linkCopied : t.copyLink}
                  </Button>

                  {!showSendField ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                      onClick={() => { setShowSendField(true); setSendEmail(user?.email || ''); }}
                    >
                      <Send className="w-4 h-4" />
                      {t.sendLink}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        value={sendEmail}
                        onChange={(e) => setSendEmail(e.target.value)}
                        placeholder={t.emailPlaceholder}
                        className="h-9 bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm"
                      />
                      <Button onClick={handleSendLink} disabled={isSending} size="sm" className="h-9 px-3">
                        {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : t.sendButton}
                      </Button>
                    </div>
                  )}

                  <button
                    className="flex items-center gap-2 text-white/50 text-xs hover:text-white/70 transition-colors"
                    onClick={() => setShowHowTo(!showHowTo)}
                  >
                    <Info className="w-3 h-3" />
                    {t.howTo}
                  </button>

                  {showHowTo && (
                    <ol className="space-y-2 pt-1">
                      {t.howToSteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-white/70 text-xs">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/80 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Audio Player Section ── */}
          <div className="mx-4 mb-4 flex-1 flex flex-col min-h-0">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, hsl(212 100% 56%), hsl(218 88% 46%))' }}>
                <Headphones className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base leading-tight">{t.audioTitle}</h2>
                <p className="text-white/50 text-xs">{t.audioSubtitle}</p>
              </div>
              {/* live EQ bars */}
              <div className="ml-auto flex items-end gap-0.5 h-4">
                {[60, 100, 40, 80, 55].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 80}ms`,
                      background: 'hsl(212 100% 70%)',
                      opacity: 0.7,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Player card — dark glassmorphism */}
            <div
              className="flex-1 overflow-hidden flex flex-col rounded-2xl"
              style={{
                background: 'rgba(8,18,45,0.88)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
                minHeight: 440,
              }}
            >
              <MobileAudioPlayer />
            </div>
          </div>

          {/* ── Star row ── */}
          <div className="px-5 pb-6 pt-2 flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-gold text-gold opacity-70" />
            ))}
            <span className="text-white/40 text-xs ml-2">TrumpetStar</span>
          </div>

        </div>
      </MobileLayout>

      <LanguageSelectionDialog open={!languageLoading && !hasCompletedLanguageSetup} />
      <WelcomeSlideshow
        open={!languageLoading && hasCompletedLanguageSetup && !hasSeenWelcome}
        onComplete={completeWelcome}
      />
    </>
  );
}
