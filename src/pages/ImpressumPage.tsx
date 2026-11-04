import { useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { LEGAL_COPY } from '@/i18n/legal';
import { LegalPage } from '@/components/legal/LegalPage';

export default function ImpressumPage() {
  const { language } = useLanguage();
  const copy = LEGAL_COPY[language];
  useEffect(() => { document.title = `${copy.notice} – Trumpetstar`; }, [copy.notice]);
  return <LegalPage title={copy.notice}>
    <section className="space-y-2">
      <h2 className="text-xl font-bold">{copy.disclosure}</h2>
      <p className="font-semibold">Trumpetstar GmbH</p>
      <p>{copy.company}</p>
      <p>Mogersdorf 253<br />8382 Mogersdorf, Österreich / Austria</p>
      <p>Firmenbuch / Company register: FN 633951g</p>
      <p>UID (AT): ATU81038878 · UID (DE): DE442429470</p>
    </section>
    <section className="space-y-2">
      <h2 className="text-xl font-bold">{copy.contact}</h2>
      <p><a className="underline" href="mailto:info@trumpetstar.com">info@trumpetstar.com</a></p>
      <p><a className="underline" href="tel:+4367762805357">+43 677 / 628 053 57</a></p>
    </section>
    <p>{copy.purpose}</p>
  </LegalPage>;
}
