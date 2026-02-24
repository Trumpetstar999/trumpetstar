import { useState } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useLanguage } from '@/hooks/useLanguage';
import { FAQSchema } from '@/components/SEO';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MessageCircle, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const FAQ = {
  de: [
    { q: 'Wie öffne ich die App am iPad?', a: 'Öffne Safari auf deinem iPad, gehe zu trumpetstar.lovable.app und drehe das iPad ins Querformat. Logge dich mit deinem Account ein und du hast Zugriff auf alle Features.' },
    { q: 'Warum funktioniert die Lernwelt nicht am Handy?', a: 'Noten, Videos und Übe-Tools sind für größere Displays optimiert. Auf kleinen Bildschirmen wäre die Bedienung eingeschränkt. Deshalb empfehlen wir iPad/Tablet im Querformat oder einen Laptop.' },
    { q: 'Kann ich jederzeit kündigen?', a: 'Ja, du kannst dein Abo jederzeit kündigen. Bei Jahresabos läuft dein Zugang bis zum Ende der bezahlten Periode weiter.' },
    { q: 'Kann ich zwischen Plänen wechseln?', a: 'Klar! Du kannst jederzeit upgraden. Beim Wechsel zu einem höheren Plan wird der restliche Zeitraum anteilig verrechnet.' },
    { q: 'Gibt es eine Geld-zurück-Garantie?', a: 'Ja, innerhalb der ersten 30 Tage kannst du dein Abo ohne Angabe von Gründen kündigen und erhältst dein Geld zurück.' },
    { q: 'Welches Gerät brauche ich?', a: 'iPad (ab 2018), Android-Tablet, oder einen Laptop/Desktop mit aktuellem Chrome, Safari oder Firefox. Ein stabiles Internet ist empfohlen.' },
  ],
  en: [
    { q: 'How do I open the app on iPad?', a: 'Open Safari on your iPad, go to trumpetstar.lovable.app and rotate to landscape. Log in with your account to access all features.' },
    { q: 'Why doesn\'t the learning world work on mobile?', a: 'Sheet music, videos, and practice tools are optimized for larger displays. On small screens, the experience would be limited. We recommend iPad/tablet in landscape or a laptop.' },
    { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your subscription at any time. Annual plans continue until the end of the paid period.' },
    { q: 'Can I switch between plans?', a: 'Of course! You can upgrade at any time. When switching to a higher plan, the remaining period is prorated.' },
    { q: 'Is there a money-back guarantee?', a: 'Yes, within the first 30 days you can cancel without reason and receive a full refund.' },
    { q: 'What device do I need?', a: 'iPad (2018+), Android tablet, or a laptop/desktop with current Chrome, Safari or Firefox. A stable internet connection is recommended.' },
  ],
  es: [
    { q: '¿Cómo abro la app en iPad?', a: 'Abre Safari en tu iPad, ve a trumpetstar.lovable.app y gíralo en horizontal. Inicia sesión con tu cuenta para acceder a todas las funciones.' },
    { q: '¿Por qué no funciona en el móvil?', a: 'Las partituras, videos y herramientas de práctica están optimizados para pantallas grandes. En pantallas pequeñas, la experiencia sería limitada.' },
    { q: '¿Puedo cancelar en cualquier momento?', a: 'Sí, puedes cancelar tu suscripción en cualquier momento. Los planes anuales continúan hasta el final del período pagado.' },
    { q: '¿Hay garantía de devolución?', a: 'Sí, dentro de los primeros 30 días puedes cancelar sin motivo y recibir un reembolso completo.' },
  ],
};

const TEXTS = {
  de: { title: 'Hilfe & FAQ', contact: 'Kontakt', reportProblem: 'Problem melden', send: 'Senden', sent: 'Gesendet!', placeholder: 'Beschreibe dein Problem...' },
  en: { title: 'Help & FAQ', contact: 'Contact', reportProblem: 'Report a problem', send: 'Send', sent: 'Sent!', placeholder: 'Describe your problem...' },
  es: { title: 'Ayuda y FAQ', contact: 'Contacto', reportProblem: 'Reportar problema', send: 'Enviar', sent: '¡Enviado!', placeholder: 'Describe tu problema...' },
};

export default function MobileHelpPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const faq = FAQ[language] || FAQ.de;
  const t = TEXTS[language] || TEXTS.de;

  const handleSendFeedback = async () => {
    if (!feedback.trim()) return;
    setIsSending(true);
    // Simulate sending - could connect to a support system later
    await new Promise(r => setTimeout(r, 1000));
    toast.success(t.sent);
    setFeedback('');
    setShowFeedback(false);
    setIsSending(false);
  };

  const faqSchemaItems = faq.map(item => ({ question: item.q, answer: item.a }));

  return (
    <MobileLayout>
      <FAQSchema faqs={faqSchemaItems} />
      <div className="px-5 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-white">{t.title}</h1>

        {/* FAQ Accordion */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <Accordion type="single" collapsible className="w-full">
              {faq.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-slate-100">
                  <AccordionTrigger className="text-left text-sm font-semibold text-slate-900 hover:no-underline py-3">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-slate-600 leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Link to full Help Center */}
        <Button
          variant="outline"
          className="w-full h-12 border-white/20 text-white bg-white/10 hover:bg-white/20 gap-2"
          onClick={() => navigate('/hilfe')}
        >
          <ExternalLink className="w-4 h-4" />
          {language === 'en' ? 'Full Help Center' : language === 'es' ? 'Centro de Ayuda completo' : 'Vollständiges Hilfe-Center'}
        </Button>

        {/* Contact */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-bold text-slate-900">{t.contact}</h3>
            <a
              href="mailto:info@trumpetstar.com"
              className="flex items-center gap-3 text-sm text-primary font-medium min-h-[44px]"
            >
              <Mail className="w-4 h-4" />
              info@trumpetstar.com
            </a>

            {!showFeedback ? (
              <Button
                variant="outline"
                className="w-full h-11 border-slate-200 text-slate-700 gap-2"
                onClick={() => setShowFeedback(true)}
              >
                <MessageCircle className="w-4 h-4" />
                {t.reportProblem}
              </Button>
            ) : (
              <div className="space-y-3">
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={t.placeholder}
                  className="border-slate-200 text-slate-900 min-h-[100px]"
                />
                <Button
                  className="w-full h-11"
                  onClick={handleSendFeedback}
                  disabled={isSending || !feedback.trim()}
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {t.send}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
}
