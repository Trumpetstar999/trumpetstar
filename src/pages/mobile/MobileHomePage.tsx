import { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Copy, Send, Info, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PLAN_DISPLAY_NAMES } from '@/types/plans';

const TEXTS = {
  de: {
    greeting: 'Hallo',
    cardTitle: 'Optimiert für iPad & große Displays',
    cardText: 'Für Noten, Videos und Übe-Tools empfehlen wir iPad/Tablet im Querformat oder einen Laptop.',
    copyLink: 'Link kopieren',
    sendLink: 'Link an mich senden',
    howTo: 'So geht\'s',
    yourPlan: 'Dein Plan',
    emailPlaceholder: 'E-Mail-Adresse',
    sendButton: 'Senden',
    linkCopied: 'Link kopiert!',
    emailSent: 'E-Mail gesendet!',
    emailError: 'Fehler beim Senden',
    howToTitle: 'So nutzt du TrumpetStar optimal',
    howToSteps: [
      'Öffne Safari auf deinem iPad',
      'Gehe zu trumpetstar.lovable.app',
      'Drehe das iPad ins Querformat',
      'Logge dich mit deinem Account ein',
      'Lerne mit Videos, Noten & Übe-Tools!',
    ],
    close: 'Verstanden',
  },
  en: {
    greeting: 'Hello',
    cardTitle: 'Optimized for iPad & large screens',
    cardText: 'For sheet music, videos, and practice tools, we recommend iPad/tablet in landscape or a laptop.',
    copyLink: 'Copy link',
    sendLink: 'Send link to me',
    howTo: 'How it works',
    yourPlan: 'Your plan',
    emailPlaceholder: 'Email address',
    sendButton: 'Send',
    linkCopied: 'Link copied!',
    emailSent: 'Email sent!',
    emailError: 'Error sending email',
    howToTitle: 'How to use TrumpetStar optimally',
    howToSteps: [
      'Open Safari on your iPad',
      'Go to trumpetstar.lovable.app',
      'Rotate your iPad to landscape',
      'Log in with your account',
      'Learn with videos, sheet music & tools!',
    ],
    close: 'Got it',
  },
  es: {
    greeting: 'Hola',
    cardTitle: 'Optimizado para iPad y pantallas grandes',
    cardText: 'Para partituras, videos y herramientas de práctica, recomendamos iPad/tablet en horizontal o un portátil.',
    copyLink: 'Copiar enlace',
    sendLink: 'Enviar enlace',
    howTo: 'Cómo funciona',
    yourPlan: 'Tu plan',
    emailPlaceholder: 'Correo electrónico',
    sendButton: 'Enviar',
    linkCopied: '¡Enlace copiado!',
    emailSent: '¡Email enviado!',
    emailError: 'Error al enviar',
    howToTitle: 'Cómo usar TrumpetStar',
    howToSteps: [
      'Abre Safari en tu iPad',
      'Ve a trumpetstar.lovable.app',
      'Gira tu iPad en horizontal',
      'Inicia sesión con tu cuenta',
      '¡Aprende con videos, partituras y herramientas!',
    ],
    close: 'Entendido',
  },
};

export default function MobileHomePage() {
  const { user } = useAuth();
  const { planKey } = useMembership();
  const { language } = useLanguage();
  const [profile, setProfile] = useState<{ display_name: string | null } | null>(null);
  const [sendEmail, setSendEmail] = useState('');
  const [showSendField, setShowSendField] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const t = TEXTS[language] || TEXTS.de;
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
    <MobileLayout>
      <div className="px-5 py-6 space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-white">
            {t.greeting}, {displayName} 👋
          </h1>
        </div>

        {/* Plan Badge */}
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-sm">{t.yourPlan}:</span>
          <Badge className="bg-white/15 text-white border-white/20 font-semibold">
            {PLAN_DISPLAY_NAMES[planKey]}
          </Badge>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Monitor className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">{t.cardTitle}</h2>
                <p className="text-slate-600 text-sm mt-1 leading-relaxed">{t.cardText}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {/* Copy Link */}
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 border-slate-200 text-slate-700"
                onClick={handleCopyLink}
              >
                {linkCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {linkCopied ? t.linkCopied : t.copyLink}
              </Button>

              {/* Send Link */}
              {!showSendField ? (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 border-slate-200 text-slate-700"
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
                    className="h-12 border-slate-200 text-slate-900"
                  />
                  <Button
                    onClick={handleSendLink}
                    disabled={isSending}
                    className="h-12 px-4"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.sendButton}
                  </Button>
                </div>
              )}

              {/* How To */}
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 border-slate-200 text-slate-700"
                onClick={() => setShowHowTo(!showHowTo)}
              >
                <Info className="w-4 h-4" />
                {t.howTo}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* How-To Overlay */}
        {showHowTo && (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-lg">{t.howToTitle}</h3>
              <ol className="space-y-3">
                {t.howToSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-slate-700 text-sm leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
              <Button
                variant="outline"
                className="w-full h-11 border-slate-200 text-slate-700"
                onClick={() => setShowHowTo(false)}
              >
                {t.close}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}
