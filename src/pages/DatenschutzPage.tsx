import { SEOPageLayout } from '@/components/seo/SEOPageLayout';

export default function DatenschutzPage() {
  return (
    <SEOPageLayout
      title="Datenschutzerklärung – Trumpetstar"
      description="Datenschutzerklärung der Trumpetstar GmbH gemäß DSGVO."
    >
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-white mb-8">Datenschutzerklärung</h1>

        <div className="space-y-8 text-white/80 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">1. Verantwortlicher</h2>
            <p>Trumpetstar GmbH</p>
            <p>Inhaber: Mario Schulter</p>
            <p>E-Mail: <a href="mailto:info@trumpetstar.com" className="underline hover:text-white transition-colors">info@trumpetstar.com</a></p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">2. Erhobene Daten</h2>
            <p>
              Bei der Nutzung unserer App werden folgende personenbezogene Daten erhoben und verarbeitet:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Name und E-Mail-Adresse (bei Registrierung)</li>
              <li>Nutzungsdaten (besuchte Seiten, Übungsfortschritt, Spielstände)</li>
              <li>Technische Daten (IP-Adresse, Browser-Typ, Geräteinformationen)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">3. Rechtsgrundlage</h2>
            <p>
              Die Verarbeitung erfolgt auf Basis von Art. 6 Abs. 1 lit. a (Einwilligung),
              lit. b (Vertragserfüllung) und lit. f (berechtigtes Interesse) der DSGVO.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">4. Drittanbieter und Auftragsverarbeiter</h2>
            <p>Wir nutzen folgende Dienste zur Bereitstellung unserer App:</p>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li>
                <strong className="text-white">Supabase (USA/EU)</strong> – Datenspeicherung, Authentifizierung und Backend-Funktionen.
                Supabase verarbeitet Ihre Daten gemäß deren{' '}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">Datenschutzerklärung</a>.
              </li>
              <li>
                <strong className="text-white">Vimeo (USA)</strong> – Video-Streaming für Lernvideos.
                Beim Abspielen von Videos werden Daten an Vimeo übermittelt. Details in der{' '}
                <a href="https://vimeo.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">Vimeo-Datenschutzerklärung</a>.
              </li>
              <li>
                <strong className="text-white">Google Sign-In</strong> – Optional für die Anmeldung. Bei Nutzung werden Daten gemäß der{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">Google-Datenschutzerklärung</a> verarbeitet.
              </li>
              <li>
                <strong className="text-white">Apple Sign-In</strong> – Optional für die Anmeldung. Bei Nutzung gelten die{' '}
                <a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">Apple-Datenschutzrichtlinien</a>.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">5. Cookies</h2>
            <p>
              Wir verwenden technisch notwendige Cookies für die Authentifizierung und Sitzungsverwaltung.
              Diese sind für den Betrieb der App erforderlich und können nicht deaktiviert werden.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">6. Ihre Rechte</h2>
            <p>Sie haben gemäß DSGVO folgende Rechte:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
              <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
              <li>Recht auf Löschung (Art. 17 DSGVO)</li>
              <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">7. Kontakt für Datenschutzanfragen</h2>
            <p>
              Für Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte wenden Sie sich bitte an:{' '}
              <a href="mailto:info@trumpetstar.com" className="underline hover:text-white transition-colors">info@trumpetstar.com</a>
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">8. Beschwerderecht</h2>
            <p>
              Sie haben das Recht, sich bei der zuständigen Aufsichtsbehörde zu beschweren.
              In Österreich ist dies die{' '}
              <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">
                Österreichische Datenschutzbehörde
              </a>.
            </p>
          </div>
        </div>
      </section>
    </SEOPageLayout>
  );
}
