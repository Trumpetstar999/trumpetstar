import { SEOPageLayout } from '@/components/seo/SEOPageLayout';

export default function ImpressumPage() {
  return (
    <SEOPageLayout
      title="Impressum – Trumpetstar"
      description="Impressum und rechtliche Informationen der Trumpetstar GmbH."
    >
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-white mb-8">Impressum</h1>

        <div className="space-y-8 text-white/80 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Angaben gemäß § 5 ECG / § 25 MedienG</h2>
            <p>Trumpetstar GmbH</p>
            <p>Inhaber: Mario Schulter</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Kontakt</h2>
            <p>E-Mail: <a href="mailto:info@trumpetstar.com" className="underline hover:text-white transition-colors">info@trumpetstar.com</a></p>
            <p>Telefon: <a href="tel:+4366445308073" className="underline hover:text-white transition-colors">+43 6644 5308 73</a></p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">EU-Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white transition-colors"
              >
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
            <p className="mt-2">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Haftungsausschluss</h2>
            <p>
              Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt. Für die Richtigkeit,
              Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
            </p>
          </div>
        </div>
      </section>
    </SEOPageLayout>
  );
}
