import { useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { LEGAL_COPY } from '@/i18n/legal';
import { LegalPage } from '@/components/legal/LegalPage';
import { setMediaPermission } from '@/components/legal/ExternalMediaGate';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Mail } from 'lucide-react';

export default function DatenschutzPage() {
  const { language } = useLanguage();
  const copy = LEGAL_COPY[language];
  useEffect(() => {
    document.title = `${copy.privacy} – Trumpetstar`;
    if (window.location.hash === '#settings') document.getElementById('settings')?.scrollIntoView();
  }, [copy.privacy]);
  return <LegalPage title={copy.privacy}>
    <p>{copy.intro}</p>
    <section id="settings" className="scroll-mt-4 space-y-3 border-b border-ts-ink/15 pb-6">
      <h2 className="text-xl font-bold">{copy.settings}</h2>
      <Button variant="outline" onClick={() => setMediaPermission(false)} className="h-auto min-h-11 whitespace-normal border-ts-ink/20 bg-ts-card text-ts-ink hover:bg-ts-surface"><ShieldCheck />{copy.reset}</Button>
      <p className="text-sm">{copy.blocked}</p>
    </section>
    {copy.sections.map(([heading, body]) => <section key={heading} className="space-y-2">
      <h2 className="text-xl font-bold">{heading}</h2><p>{body}</p>
    </section>)}
    <a className="inline-flex min-h-11 items-center gap-2 underline" href="mailto:info@trumpetstar.com"><Mail className="h-4 w-4" />{copy.rights}</a>
    <p className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
      <a className="underline" href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer">Datenschutzbehörde (AT)</a>
      <a className="underline" href="https://vimeo.com/privacy" target="_blank" rel="noopener noreferrer">Vimeo</a>
      <a className="underline" href="https://www.digistore24.com/page/privacy" target="_blank" rel="noopener noreferrer">Digistore24</a>
      <a className="underline" href="https://www.brevo.com/legal/privacypolicy/" target="_blank" rel="noopener noreferrer">Brevo</a>
    </p>
  </LegalPage>;
}
