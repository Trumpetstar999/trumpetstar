-- Phase 2: E-Mail-Sequenzen und Templates einfügen
-- Ausführen NACHDEM Tabellen erstellt wurden

-- =====================================================
-- SEQUENZEN ERSTELLEN
-- =====================================================

-- Sequenz für Erwachsene (7-Tage)
INSERT INTO email_sequences (name, segment_id, description) VALUES
('7-Tage Willkommen - Erwachsene', 
 (SELECT id FROM lead_segments WHERE code = 'adult'),
 'Willkommenssequenz für erwachsene Anfänger und Wiedereinsteiger');

-- Sequenz für Eltern (7-Tage)
INSERT INTO email_sequences (name, segment_id, description) VALUES
('7-Tage Willkommen - Eltern', 
 (SELECT id FROM lead_segments WHERE code = 'parent'),
 'Willkommenssequenz für Eltern mit Kindern');

-- Sequenz für Lehrer (5-Tage)
INSERT INTO email_sequences (name, segment_id, description) VALUES
('5-Tage B2B - Lehrer', 
 (SELECT id FROM lead_segments WHERE code = 'teacher'),
 'B2B-Sequenz für Musiklehrer und Dirigenten');

-- =====================================================
-- E-MAIL-TEMPLATES: ERWACHSENE
-- =====================================================

-- Tag 0: Willkommen
INSERT INTO email_templates (
  sequence_id, day_number, subject_line, subject_line_b,
  body_html, body_text, cta_link, cta_text, personalization_tags
) VALUES (
  (SELECT id FROM email_sequences WHERE name = '7-Tage Willkommen - Erwachsene'),
  0,
  'Willkommen {{first_name}} – hier ist dein erster Schritt',
  'Deine Trompeten-Reise beginnt jetzt',
  '<h1>Hallo {{first_name}},</h1><p>schön, dass du da bist!</p><p>Du hast dich für {{instrument}} entschieden – das ist eine großartige Wahl.</p><p>Ich weiß: Als Erwachsener hast du wenig Zeit. Deshalb ist unsere Methode auf <strong>5-Minuten-Einheiten</strong> ausgelegt.</p><a href="{{cta_link}}" style="display:inline-block;padding:16px 32px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;">👉 Ersten Schritt ansehen</a><p>PS: Die häufigste Frage: „Bin ich zu alt?“<br>Antwort: Absolut nicht.</p>',
  'Hallo {{first_name}}, schön dass du da bist! Du hast dich für {{instrument}} entschieden. Ich weiß: Als Erwachsener hast du wenig Zeit. Deshalb ist unsere Methode auf 5-Minuten-Einheiten ausgelegt. Hier ist dein erster Schritt: {{cta_link}} PS: Die häufigste Frage: Bin ich zu alt? Antwort: Absolut nicht.',
  '/erste-schritte',
  'Ersten Schritt ansehen',
  ARRAY['first_name', 'instrument']
);

-- Tag 1: Mini-Erfolg
INSERT INTO email_templates (
  sequence_id, day_number, subject_line,
  body_html, body_text, cta_link, cta_text, personalization_tags
) VALUES (
  (SELECT id FROM email_sequences WHERE name = '7-Tage Willkommen - Erwachsene'),
  1,
  '2 Minuten Übung – mach das jetzt',
  '<h2>Übung: Das erste Buzzing</h2><p>Ohne Instrument. Nur die Lippen. 2 Minuten.</p><a href="{{cta_link}}">Video-Anleitung ansehen</a><p>Und dann antworte mir einfach: „Fertig."</p>',
  'Übung: Das erste Buzzing. Ohne Instrument. Nur die Lippen. 2 Minuten. Video: {{cta_link}} Und dann antworte mir einfach: Fertig.',
  '/videos/buzzing',
  'Video ansehen',
  ARRAY['first_name']
);

-- Tag 3: Social Proof
INSERT INTO email_templates (
  sequence_id, day_number, subject_line,
  body_html, body_text, cta_link, cta_text, personalization_tags
) VALUES (
  (SELECT id FROM email_sequences WHERE name = '7-Tage Willkommen - Erwachsene'),
  3,
  '„Ich dachte, mit 45 ist es zu spät" – Peter',
  '<p>Ich möchte dir Peter vorstellen. Mit 45 hat er begonnen. Nach 3 Monaten spielte er seine ersten Songs.</p><p><em>„Ich dachte, ich bin zu alt. Aber die 5-Minuten-Methode passt perfekt in meinen Arbeitstag."</em></p><p>Die häufigste Hürde: „Meine Lippen werden so schnell müde."<br>Das ist normal! Übe 5 Minuten, dann pausiere.</p>',
  'Ich möchte dir Peter vorstellen. Mit 45 hat er begonnen. Nach 3 Monaten spielte er seine ersten Songs. Ich dachte, ich bin zu alt. Aber die 5-Minuten-Methode passt perfekt in meinen Arbeitstag. Die häufigste Hürde: Meine Lippen werden so schnell müde. Das ist normal!',
  '/erfahrungen/peter',
  'Peters Geschichte lesen',
  ARRAY['first_name']
);

-- Tag 5: Soft-Offer
INSERT INTO email_templates (
  sequence_id, day_number, subject_line,
  body_html, body_text, cta_link, cta_text, personalization_tags
) VALUES (
  (SELECT id FROM email_sequences WHERE name = '7-Tage Willkommen - Erwachsene'),
  5,
  'Das hat mir am Anfang gefehlt',
  '<p>Als ich angefangen habe, gab es keine strukturierte Methode.</p><p>Heute gibt es Trumpetstar – die Methode, die ich mir damals gewünscht hätte.</p><ul><li>Schritt-für-Schritt Anleitungen</li><li>Video-Tutorials</li><li>App mit Tracking</li></ul><p>Falls du bereit bist:</p><a href="{{cta_link}}">Mehr über den Pro-Kurs</a><p>PS: 30-Tage-Geld-zurück-Garantie. Ohne Fragen.</p>',
  'Als ich angefangen habe, gab es keine strukturierte Methode. Heute gibt es Trumpetstar. Falls du bereit bist: {{cta_link}} PS: 30-Tage-Geld-zurück-Garantie.',
  '/kurse/pro',
  'Pro-Kurs entdecken',
  ARRAY['first_name']
);

-- Tag 7: Deadline
INSERT INTO email_templates (
  sequence_id, day_number, subject_line,
  body_html, body_text, cta_link, cta_text, personalization_tags
) VALUES (
  (SELECT id FROM email_sequences WHERE name = '7-Tage Willkommen - Erwachsene'),
  7,
  'Letzte Chance: Bonus-Lektionen (heute Abend)',
  '<p>In den letzten 7 Tagen hast du dich mit der Materie beschäftigt.</p><p>Heute ist der letzte Tag für den Bonus:</p><ul><li>„Erste 30 Tage" detaillierter Plan</li><li>Exklusive Live-Q&A</li><li>Übeplan-Template</li></ul><a href="{{cta_link}}">Nur heute: Pro-Kurs mit Bonus</a><p>Nach heute sind die Bonus-Lektionen nicht mehr verfügbar.</p>',
  'Heute ist der letzte Tag für den Bonus: Erste 30 Tage Plan, Live-Q&A, Übeplan-Template. {{cta_link}} Nach heute nicht mehr verfügbar.',
  '/kurse/pro?bonus=true',
  'Bonus sichern',
  ARRAY['first_name']
);

-- =====================================================
-- E-MAIL-TEMPLATES: ELTERN
-- =====================================================

-- Tag 0: Willkommen Eltern
INSERT INTO email_templates (
  sequence_id, day_number, subject_line,
  body_html, body_text, cta_link, cta_text, personalization_tags
) VALUES (
  (SELECT id FROM email_sequences WHERE name = '7-Tage Willkommen - Eltern'),
  0,
  '{{first_name}} – so macht das Kind Freude am Üben',
  '<p>Du willst deinem Kind {{instrument}} beibringen – das ist wunderbar!</p><p>Unsere Methode nutzt <strong>Gamification</strong> (Sterne, Abzeichen, kleine Erfolge). Kinder üben freiwillig, weil es Spaß macht.</p><a href="{{cta_link}}">So startest du richtig</a><p>Tipp: Beginne mit 5 Minuten täglich. Lieber kurz und freiwillig als lang und gezwungen.</p>',
  'Du willst deinem Kind beibringen – das ist wunderbar! Unsere Methode nutzt Gamification. Kinder üben freiwillig. Tipp: Beginne mit 5 Minuten täglich. {{cta_link}}',
  '/eltern-guide',
  'Eltern-Guide ansehen',
  ARRAY['first_name', 'instrument']
);

-- =====================================================
-- E-MAIL-TEMPLATES: LEHRER
-- =====================================================

-- Tag 0: Willkommen Lehrer
INSERT INTO email_templates (
  sequence_id, day_number, subject_line,
  body_html, body_text, cta_link, cta_text, personalization_tags
) VALUES (
  (SELECT id FROM email_sequences WHERE name = '5-Tage B2B - Lehrer'),
  0,
  'Materialien für Ihre Bläserklasse – {{first_name}}',
  '<p>Guten Tag {{first_name}},</p><p>vielen Dank für Ihr Interesse an Trumpetstar für Schulen.</p><p>Unsere Lösung:</p><ul><li>Individuelle Lernpfade pro Schüler</li><li>Fortschritts-Tracking</li><li>Unterrichtsmaterialien</li></ul><a href="{{cta_link}}">Beispiel-Materialien</a><p>Gerne vereinbare ich ein kurzes Gespräch (15 Min).</p>',
  'Guten Tag, vielen Dank für Ihr Interesse. Unsere Lösung: Individuelle Lernpfade, Fortschritts-Tracking, Materialien. {{cta_link}} Gerne vereinbare ich ein Gespräch.',
  '/schulmaterialien',
  'Materialien ansehen',
  ARRAY['first_name']
);

-- =====================================================
-- VERIFIZIERUNG
-- =====================================================

SELECT 'Sequences created:' as info, COUNT(*) FROM email_sequences;
SELECT 'Templates created:' as info, COUNT(*) FROM email_templates;
