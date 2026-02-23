import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Monitor, Copy, Send, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const TEXTS = {
  de: {
    title: 'Für bestes Lernen: iPad/Tablet empfohlen',
    text: 'Notenansicht, Videos und Übe-Tools sind für größere Displays optimiert.',
    copyLink: 'Link kopieren',
    sendLink: 'Link an mich senden',
    backToMenu: 'Zurück zum Mobile Menü',
    linkCopied: 'Link kopiert!',
    emailSent: 'E-Mail gesendet!',
    emailError: 'Fehler beim Senden',
    emailPlaceholder: 'E-Mail-Adresse',
    send: 'Senden',
  },
  en: {
    title: 'Best on iPad/Tablet',
    text: 'Sheet music, videos, and practice tools are optimized for larger displays.',
    copyLink: 'Copy link',
    sendLink: 'Send link to me',
    backToMenu: 'Back to mobile menu',
    linkCopied: 'Link copied!',
    emailSent: 'Email sent!',
    emailError: 'Error sending',
    emailPlaceholder: 'Email address',
    send: 'Send',
  },
  es: {
    title: 'Mejor en iPad/Tablet',
    text: 'Partituras, videos y herramientas de práctica están optimizados para pantallas grandes.',
    copyLink: 'Copiar enlace',
    sendLink: 'Enviar enlace',
    backToMenu: 'Volver al menú',
    linkCopied: '¡Enlace copiado!',
    emailSent: '¡Email enviado!',
    emailError: 'Error al enviar',
    emailPlaceholder: 'Correo electrónico',
    send: 'Enviar',
  },
};

export default function MobileLockedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [showSendField, setShowSendField] = useState(false);
  const [sendEmail, setSendEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const t = TEXTS[language] || TEXTS.de;
  const appUrl = window.location.origin;

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
    } catch {
      toast.error(t.emailError);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <MobileLayout>
      <div className="px-5 py-10 flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="border-0 shadow-xl w-full max-w-sm">
          <CardContent className="p-6 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Monitor className="w-8 h-8 text-primary" />
            </div>

            <h2 className="text-xl font-bold text-slate-900">{t.title}</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{t.text}</p>

            <div className="space-y-2 pt-2">
              <Button
                variant="outline"
                className="w-full h-11 border-slate-200 text-slate-700 gap-2"
                onClick={handleCopyLink}
              >
                {linkCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {linkCopied ? t.linkCopied : t.copyLink}
              </Button>

              {!showSendField ? (
                <Button
                  variant="outline"
                  className="w-full h-11 border-slate-200 text-slate-700 gap-2"
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
                    className="h-11 border-slate-200 text-slate-900"
                  />
                  <Button onClick={handleSendLink} disabled={isSending} className="h-11 px-4">
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.send}
                  </Button>
                </div>
              )}

              <Button
                className="w-full h-11 gap-2"
                onClick={() => navigate('/mobile/home')}
              >
                <ArrowLeft className="w-4 h-4" />
                {t.backToMenu}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
}
