-- Wissensdatenbank: Ein JSON-Blob für die gesamte KB (key-value Settings-Muster)
CREATE TABLE IF NOT EXISTS knowledge_base_settings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text NOT NULL UNIQUE,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed: Initiale Wissensdatenbank
INSERT INTO knowledge_base_settings (key, value) VALUES (
  'main',
  '{
    "zuletzt_aktualisiert": "2026-03-06",
    "unternehmen": {
      "name": "Trumpetstar",
      "gruender": "Mario Schulter",
      "beschreibung": "Multimediale Lernwelt für Trompete – Videos, Bücher, App, Playbacks.",
      "telefon": "+43 664/45 30 873",
      "email": "valentin@trumpetstar.com"
    },
    "produkte": [
      {
        "name": "Trumpetstar Testzugang – 1 Monat",
        "typ": "Abo",
        "preis": "€19,00/Monat",
        "kauflink": "https://www.digistore24.com/product/345378",
        "beschreibung": "101 Lernvideos, Playbacks, komplette Anfängerschule, 55 Kinderlieder"
      },
      {
        "name": "Trumpetstar PRO – All in One",
        "typ": "Abo / Videokurs",
        "preis": "auf Anfrage",
        "kauflink": "https://www.trumpetstar.com/pro-alle-videos/",
        "beschreibung": "300+ Lern- und Mitspielvideos, Anfänger bis Bronze"
      },
      {
        "name": "Buch Band 1",
        "typ": "Lehrbuch",
        "preis": "im Shop",
        "kauflink": "https://www.trumpetstar.com/shop/",
        "beschreibung": "Anfängerschule, QR-Codes Beginnerlevel, Starmethode"
      },
      {
        "name": "Buch Band 2",
        "typ": "Lehrbuch",
        "preis": "im Shop",
        "kauflink": "https://www.trumpetstar.com/shop/",
        "beschreibung": "Aufbaukurs, QR-Codes 1. Level, für weitere Level PRO nötig"
      }
    ],
    "faq": [
      { "frage": "Wie kann ich ein Buch kaufen?", "antwort": "Im Shop: https://www.trumpetstar.com/shop/ – Abo-Kunden erhalten Rabatt." },
      { "frage": "Ich habe einen Gutscheincode. Was nun?", "antwort": "Testzugang aktivieren: https://www.digistore24.com/product/345378 – Feld ''Sie haben einen Gutschein?'' beim Checkout." },
      { "frage": "Ist Vorbildung nötig?", "antwort": "Nein – weder Noten noch Vorkenntnisse nötig." },
      { "frage": "Welche Trompete kaufen?", "antwort": "Kinder 5-7 Jahre: Kornett (Schagerl K 451L oder T 200L). Sonst: Musikhaus." },
      { "frage": "Ab welchem Alter?", "antwort": "Ab 5-6 Jahren (wenn Schneidezähne vorhanden). Erwachsene jederzeit." },
      { "frage": "Wie kündigen?", "antwort": "E-Mail genügt, keine Frist. Bitte 48h vor Folgemonat. An: valentin@trumpetstar.com" },
      { "frage": "Garantie?", "antwort": "30 Tage Geld-zurück-Garantie." },
      { "frage": "Kosten?", "antwort": "€19/Monat, kein Vertrag, jederzeit kündbar. 30 Tage Geld-zurück." },
      { "frage": "App – wie?", "antwort": "Kostenlos unter https://www.trumpetstar.app – Playbacks inklusive, Abo-Kunden alle Videos." },
      { "frage": "Pädagog:innen – Buch oder Abo?", "antwort": "1) Buch + kostenlose App (Playbacks + Beginnerlevel). 2) Abo/Videokurs als Upgrade." }
    ],
    "links": {
      "shop": "https://www.trumpetstar.com/shop/",
      "abo_starten": "https://www.digistore24.com/product/345378",
      "pro_videos": "https://www.trumpetstar.com/pro-alle-videos/",
      "app": "https://www.trumpetstar.app",
      "login": "https://www.trumpetstar.com/login-app/",
      "blaeserklasse": "https://www.trumpetstar.com/blaeserklasse/",
      "ueber_uns": "https://www.trumpetstar.com/ueber-uns/"
    }
  }'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE knowledge_base_settings ENABLE ROW LEVEL SECURITY;

-- Watcher darf lesen (für AI-Draft-Generierung)
CREATE POLICY "all_select" ON knowledge_base_settings FOR SELECT USING (true);

-- Nur Admins dürfen schreiben
CREATE POLICY "admin_update" ON knowledge_base_settings
  FOR UPDATE USING (auth.role() = 'authenticated');
