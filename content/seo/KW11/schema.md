# Schema.org Structured Data – KW11 / 2026
## Thema-Cluster: "Trompete für Kinder & Eltern"

---

## 1. Pillar-Artikel: /blog/trompete-lernen-kinder

### Article Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Trompete lernen für Kinder – der vollständige Elternguide 2026",
  "description": "Kann mein Kind Trompete lernen? Alter, Instrumente, Kosten, Übungsplan – alles was Eltern wissen müssen.",
  "author": {
    "@type": "Organization",
    "name": "Trumpetstar",
    "url": "https://www.trumpetstar.app"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Trumpetstar",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.trumpetstar.app/logo.png"
    }
  },
  "datePublished": "2026-03-09",
  "dateModified": "2026-03-09",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://trumpetstar.com/blog/trompete-lernen-kinder"
  },
  "keywords": "trompete lernen kinder, trompete kinder anfänger, kindertrompete, trompete ab welchem alter"
}
```

### FAQPage Schema (für FAQ-Block im Pillar)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Kann mein Kind ohne Vorkenntnisse mit der Trompete starten?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ja. Noten lesen ist nicht zwingend notwendig für den Anfang – viele Lehrer und Plattformen führen Kinder Schritt für Schritt ein."
      }
    },
    {
      "@type": "Question",
      "name": "Wie lange dauert es, bis mein Kind ein Lied spielen kann?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Mit regelmäßigem Üben (10–15 Min/Tag) spielen die meisten Kinder nach 4–8 Wochen ein einfaches Lied."
      }
    },
    {
      "@type": "Question",
      "name": "Ab welchem Alter kann ein Kind Trompete lernen?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ab etwa 7–8 Jahren sind die meisten Kinder körperlich und kognitiv bereit. Früher ist selten sinnvoll."
      }
    },
    {
      "@type": "Question",
      "name": "Braucht mein Kind unbedingt einen Lehrer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Nein – strukturierte Lernplattformen wie Trumpetstar ermöglichen selbstständiges Lernen. Ein Lehrer ist vor allem am Anfang hilfreich, um die Grundtechnik korrekt zu erlernen."
      }
    },
    {
      "@type": "Question",
      "name": "Was kostet Trompetenunterricht für Kinder monatlich?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Instrumentenmiete 10–25 €, Musikschule 60–120 €, digitale Plattform 9–19 € – Gesamtkosten typischerweise 75–160 € pro Monat."
      }
    }
  ]
}
```

---

## 2. Support-Artikel 2: /blog/trompete-kinder-kaufen

### HowTo Schema

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Erste Trompete für Kinder kaufen – Schritt-für-Schritt",
  "description": "So kaufen Sie die richtige Einsteiger-Trompete für Ihr Kind – Budget, Modelle, Zubehör.",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Lehrer oder Bläserklasse fragen",
      "text": "Viele Lehrer haben Erfahrungswerte und empfehlen bestimmte Modelle."
    },
    {
      "@type": "HowToStep",
      "name": "Budget festlegen",
      "text": "Nicht unter 150 €. Wenn möglich, 300–450 € einplanen."
    },
    {
      "@type": "HowToStep",
      "name": "Neu oder gebraucht entscheiden",
      "text": "Gebraucht kann sehr gut sein – wenn das Instrument vorher gecheckt wird."
    },
    {
      "@type": "HowToStep",
      "name": "Mundstück mitdenken",
      "text": "Für Kinder empfehlen sich Mundstücke der Größe 7C (Bach-Größe) oder ähnlich."
    },
    {
      "@type": "HowToStep",
      "name": "Zubehör kaufen",
      "text": "Ventilöl, Polierttuch, Reinigungsset – Grundausstattung für ca. 20–30 €."
    }
  ]
}
```

---

## 3. Support-Artikel 3: /blog/blaeserklasse-trompete

### FAQPage Schema

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Muss mein Kind Noten lesen können vor der Bläserklasse?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Nein. Bläserklassen starten in der Regel bei null. Noten lesen wird im Unterricht erlernt."
      }
    },
    {
      "@type": "Question",
      "name": "Wie viel muss mein Kind täglich üben?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "10–15 Minuten täglich sind ideal für den Anfang. Nach 6 Monaten können es 20–30 Minuten werden."
      }
    },
    {
      "@type": "Question",
      "name": "Ab welchem Alter gibt es Bläserklassen?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Meistens ab Klasse 3 (ca. 8–9 Jahre), manchmal ab Klasse 4."
      }
    }
  ]
}
```

---

## 4. Breadcrumb Schema (alle Blog-Artikel)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://trumpetstar.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://trumpetstar.com/blog"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "[Artikel-Titel]",
      "item": "https://trumpetstar.com/blog/[slug]"
    }
  ]
}
```

---

## Implementierungshinweise

- Schema-Tags als `<script type="application/ld+json">` im `<head>` oder direkt vor `</body>` einfügen
- FAQPage-Schema aktiviert Rich Results in Google (FAQ-Snippets) → höhere CTR
- HowTo-Schema kann Step-Snippets in SERPs triggern
- Breadcrumb-Schema verbessert SERP-Darstellung für alle Seiten
- Schema validieren: https://validator.schema.org / Google Rich Results Test
