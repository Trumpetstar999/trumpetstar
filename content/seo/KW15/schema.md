# FAQ SCHEMA JSON-LD – KW15 / 2026

**Cluster:** Notenlesen & Musiktheorie für Trompete  
**Erstellt:** April 2026 | SEO-Karl  
**Einbau:** Als `<script type="application/ld+json">` im `<head>` jedes Artikels oder via WordPress Custom Code Block / Yoast SEO / RankMath

---

## Schema 1: Pillar – "Noten lesen für Trompete"
**Ziel-URL:** `/blog/noten-lesen-trompete`

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Wie lange dauert es, Noten lesen zu lernen?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Die Grundlagen des Noten-Lesens (Töne, Rhythmus, einfache Vorzeichen) sind mit 10–15 Minuten täglicher Übung in 3–4 Wochen solide verinnerlicht. Flüssiges Blatt-Spielen entwickelt sich über mehrere Monate kontinuierlicher Praxis."
      }
    },
    {
      "@type": "Question",
      "name": "Kann ich Trompete auch ohne Noten lernen?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ja, einfache Melodien lassen sich nach Gehör lernen. Für Ensemblespiel, Schulorchester und strukturierten Lernfortschritt sind Notenkenntnisse jedoch unerlässlich."
      }
    },
    {
      "@type": "Question",
      "name": "Muss ich Klavier lernen, um Noten zu verstehen?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Nein. Alle Grundlagen des Notenlesens lassen sich direkt am Trompetenbeispiel erlernen. Klavier unterstützt das Gehörtraining, ist aber keine Voraussetzung."
      }
    },
    {
      "@type": "Question",
      "name": "Warum klingt die Trompete anders als notiert?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Die Trompete ist ein B-Instrument (Bb). Sie klingt einen Ganzton tiefer als notiert. Alle Trompetenhefte sind bereits für diesen Versatz geschrieben – als Anfänger muss man nichts manuell umrechnen."
      }
    },
    {
      "@type": "Question",
      "name": "Wie übe ich Noten lesen ohne Instrument?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Effektive Methoden sind: Flashcards mit Notenpositionen, Notenlese-Apps (z. B. NoteWorks), Noten aufschreiben und Töne laut benennen sowie Solfège-Übungen."
      }
    },
    {
      "@type": "Question",
      "name": "Welche Stücke eignen sich für Noten-Anfänger auf der Trompete?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Empfehlenswert sind einfache Kinderlieder in C-Dur (z. B. Hänschen klein, Alle meine Entchen) und anschließend Stücke in G-Dur und F-Dur. Strukturierte Anfänger-Schulen wie Trumpetstar Level 1 bieten Stücke mit schrittweisem Aufbau."
      }
    }
  ]
}
```

---

## Schema 2: Support 1 – "Violinschlüssel Trompete"
**Ziel-URL:** `/blog/violinschluessel-trompete`

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Warum heißt der Violinschlüssel so, wenn ich Trompete spiele?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Der Violinschlüssel wurde ursprünglich für die Violine entwickelt. Da Trompete und Violine ähnliche Tonlagen haben, nutzt die Trompete denselben Schlüssel. Er wird heute von vielen Instrumenten verwendet, darunter Flöte, Oboe und Klarinette."
      }
    },
    {
      "@type": "Question",
      "name": "Gibt es andere Schlüssel, die ich als Trompetenspieler lernen muss?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Nein. Die Trompete wird ausschließlich im Violinschlüssel notiert. Andere Schlüssel wie Bass- oder Altschlüssel sind für Trompetenmusik nicht relevant."
      }
    },
    {
      "@type": "Question",
      "name": "Wie lange dauert es, bis ich Töne im Violinschlüssel automatisch erkenne?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Mit 10 Minuten täglichem Lesen und gleichzeitigem Spielen erkennen die meisten Anfänger die häufigsten Töne nach etwa 2–3 Wochen automatisch, ohne aktiv zu zählen."
      }
    },
    {
      "@type": "Question",
      "name": "Was ist, wenn ich eine Note sehe, die ich nicht erkenne?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Die zuverlässigste Methode: Das G auf der zweiten Linie als Anker nutzen und von dort auf- oder abwärtszählen (C-D-E-F-G-A-H-C). Alternativ helfen Eselsbrücken-Karteikarten als schnelle Referenz."
      }
    }
  ]
}
```

---

## Schema 3: Support 2 – "Trompete Transposition"
**Ziel-URL:** `/blog/trompete-transposition-erklaert`

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Was bedeutet es, dass die Trompete ein B-Instrument ist?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Die Trompete ist ein B-Instrument: Ihr klingender Ton liegt einen Ganzton (zwei Halbtöne) tiefer als der notierte Ton. Wenn ein Trompeter ein notiertes C spielt, erklingt ein B (Bb). Alle Trompetenparts sind bereits für diesen Versatz geschrieben."
      }
    },
    {
      "@type": "Question",
      "name": "Muss ich als Anfänger Transposition beherrschen?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Nein. Alle Trompetenhefte und Schulen sind bereits transponiert. Transposition wird erst relevant, wenn du mit Pianisten oder Gitarristen ohne transponierte Trompetenparts zusammen spielst."
      }
    },
    {
      "@type": "Question",
      "name": "Gibt es auch C-Trompeten, die nicht transponieren?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ja. Die C-Trompete klingt so wie notiert und wird oft im Orchester eingesetzt. Als Anfänger lernt man in der Regel auf einer Bb-Trompete (B-Trompete)."
      }
    },
    {
      "@type": "Question",
      "name": "Welche anderen Instrumente sind B-Instrumente wie die Trompete?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Zu den B-Instrumenten gehören neben der Trompete: Klarinette, Tenorsaxofon, Sopransaxofon und Flügelhorn. Alle haben denselben Transpositionsversatz von einem Ganzton."
      }
    }
  ]
}
```

---

## Schema 4: Support 3 – "Rhythmus lesen Trompete"
**Ziel-URL:** `/blog/rhythmus-lesen-trompete`

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Muss ich Rhythmus verstehen, um Trompete zu lernen?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ja, Rhythmus ist ein grundlegender Bestandteil des Musizierens. Ohne Rhythmusgefühl klingt Musik nicht wie Musik. Die Grundkenntnisse – Notenwerte und Taktarten – baut man in 1–2 Wochen auf."
      }
    },
    {
      "@type": "Question",
      "name": "Was ist ein Metronom und brauche ich wirklich eines?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ein Metronom gibt einen gleichmäßigen Taktschlag vor und ist das wichtigste Hilfsmittel für saubere Rhythmik. Kostenlose Metronom-Apps reichen für den Einstieg vollständig aus."
      }
    },
    {
      "@type": "Question",
      "name": "Wie erkenne ich einen Takt im Notensystem?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Takte werden durch senkrechte Striche (Taktstriche) getrennt. Jeder Bereich zwischen zwei Taktstrichen bildet einen Takt. Die Taktart am Beginn jeder Zeile zeigt, wie viele Schläge ein Takt enthält."
      }
    },
    {
      "@type": "Question",
      "name": "Was sind Triolen und wann brauche ich sie?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Triolen sind drei Noten, die in der Zeit von zwei gespielt werden. Sie klingen schwingend und warm. Als Anfänger sind Triolen noch nicht notwendig – zunächst die Grundnotenwerte (Ganze, Halbe, Viertel, Achtel) sicher beherrschen."
      }
    },
    {
      "@type": "Question",
      "name": "Wie übe ich Rhythmus am effektivsten?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Die effektivste Methode: Rhythmus vor dem Spielen auf den Oberschenkel klopfen und laut zählen. Erst wenn der Rhythmus sitzt, Töne hinzufügen. Mit Metronom üben und Playalongs nutzen, um das Timing zu festigen."
      }
    }
  ]
}
```

---

## Schema-Einbau-Checkliste

| Artikel | Schema vorhanden | Typ | CMS-Einbau |
|---|---|---|---|
| pillar.md | ✅ | FAQPage | Ausstehend |
| support-1.md | ✅ | FAQPage | Ausstehend |
| support-2.md | ✅ | FAQPage | Ausstehend |
| support-3.md | ✅ | FAQPage | Ausstehend |

**Test nach Einbau:** [Google Rich Results Test](https://search.google.com/test/rich-results) für jede URL ausführen.

---

*Schema erstellt von SEO-Karl | KW15/2026*
