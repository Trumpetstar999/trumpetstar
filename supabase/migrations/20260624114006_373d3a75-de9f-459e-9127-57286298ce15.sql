
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS dealer_price_gross numeric NOT NULL DEFAULT 0;

-- Ensure SKU is unique for upserts
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique ON public.products (sku);

INSERT INTO public.products (sku, name, description, dealer_price_gross, price_gross, vat_rate_at, vat_rate_de, is_active)
VALUES
  ('TS-BAND1', 'Trumpetstar Band 1', '90 Seiten Ringbuch – Komplette Anfängerschule für Trompete. 55 Kinderlieder, 11 Levels, Playbacks via QR & App.', 25.00, 35.00, 10.00, 7.00, true),
  ('TS-BAND2', 'Trumpetstar Band 2', '155 Seiten Ringbuch für leicht Fortgeschrittene (Juniorlevel – Bronze). 14 Levels, Playbacks, Volksmusikduette.', 29.00, 39.00, 10.00, 7.00, true),
  ('TS-XMAS', 'Trumpetstar X-Mas Special', 'Musikalischer Adventskalender: 24 Weihnachtslieder, 24 Quartette für Blechbläser, 24 Mitspielvideos, Playbacks.', 16.00, 24.00, 10.00, 7.00, true),
  ('TS-BAND1-KLAV', 'Trumpetstar Band 1 – Klavierbegleitungen', '55 Kinderlieder für Trompete und Klavier. Einfache Solostimme, kreative Klavierbegleitung, langsame Playbacks.', 20.00, 29.00, 10.00, 7.00, true)
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  dealer_price_gross = EXCLUDED.dealer_price_gross,
  price_gross = EXCLUDED.price_gross,
  is_active = true,
  updated_at = now();
