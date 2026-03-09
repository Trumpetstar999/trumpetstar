# Schema.org JSON-LD – KW10 / 2026

**Zweck:** Strukturierte Daten für alle KW10-Artikel  
**Implementierung:** In den `<head>` oder vor `</body>` des jeweiligen Artikels einbetten  

---

## 1. Pillar-Artikel – HowTo + FAQ Schema

**Artikel:** Trompete lernen als Erwachsener  
**URL:** /blog/trompete-lernen-erwachsene  

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://trumpetstar.com/blog/trompete-lernen-erwachsene#article",
      "headline": "Trompete lernen als Erwachsener – So geht's wirklich",
      "description": "Schritt-für-Schritt-Guide für Erwachsene und Wiedereinsteiger: Ansatz, Übungsplan, häufige Fehler und strukturiertes Lernen mit Trumpetstar.",
      "url": "https://trumpetstar.com/blog/trompete-lernen-erwachsene",
      "datePublished": "2026-03-09",
      "dateModified": "2026-03-09",
      "author": {
        "@type": "Organization",
        "name": "Trumpetstar",
        "url": "https://trumpetstar.com"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Trumpetstar",
        "url": "https://trumpetstar.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://trumpetstar.com/logo.png"
        }
      },
      "inLanguage": "de"
    },
    {
      "@type": "HowTo",
      "name": "Trompete lernen als Erwachsener – Schritt für Schritt",
      "description": "Wie Erwachsene und Wiedereinsteiger strukturiert Trompete lernen.",
      "totalTime": "PT8W",
      "estimatedCost": {
        "@type": "MonetaryAmount",
        "currency": "EUR",
        "value": "0"
      },
      "step": [
        {
          "@type": "HowToStep",
          "position": 1,
          "name": "Instrument vorbereiten",
          "text": "Ventile ölen, Mundstück einsetzen, Instrument auf Raumtemperatur bringen."
        },
        {
          "@type": "HowToStep",
          "position": 2,
          "name": "Körperhaltung einnehmen",
          "text": "Aufrecht stehen oder sitzen, Schultern locker, Brust offen."
        },
        {
          "@type": "HowToStep",
          "position": 3,
          "name": "Buzzing üben",
          "text": "2 Minuten nur mit dem Mundstück buzzen, um den Ansatz zu aktivieren."
        },
        {
          "@type": "HowToStep",
          "position": 4,
          "name": "Erste Töne spielen",
          "text": "C4 anstreben – ruhig, mit Zwerchfell, ohne Mundstückdruck."
        },
        {
          "@type": "HowToStep",
          "position": 5,
          "name": "Pause einlegen",
          "text": "Nach 10–15 Minuten Lippen entspannen. Nicht überüben."
        }
      ]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Mit welchem Alter ist es zu spät, Trompete zu lernen?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Es gibt kein 'zu spät' für das Trompetespielen als Hobby. Selbst mit 50 oder 60 Jahren können Erwachsene das Instrument erlernen."
          }
        },
        {
          "@type": "Question",
          "name": "Wie lange dauert es, bis man Trompete spielen kann?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Erste erkennbare Melodien: 4–8 Wochen. Erste komplette Stücke: 3–6 Monate. Komfortables Spielen im Ensemble: 1–2 Jahre."
          }
        },
        {
          "@type": "Question",
          "name": "Wie viel Zeit muss ich täglich investieren?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "10–20 Minuten täglich sind ideal für Einsteiger. Kontinuität schlägt Dauer – 7× 10 Minuten sind besser als 1× 70 Minuten."
          }
        },
        {
          "@type": "Question",
          "name": "Muss ich ein teures Instrument kaufen?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Nein. Eine gute Einsteiger-Trompete (200–500 €) reicht für die ersten 2–3 Jahre problemlos."
          }
        },
        {
          "@type": "Question",
          "name": "Kann ich Trompete lernen, wenn ich kein Notenlesen kann?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Ja. Trumpetstar startet mit einfachen Systemen und führt Notenlesen schrittweise ein. Du brauchst kein Vorwissen."
          }
        }
      ]
    }
  ]
}
```

---

## 2. Support-1 Schema – FAQ

**Artikel:** Trompete täglich üben  
**URL:** /blog/trompete-taeglich-ueben  

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Wie oft sollte ein Anfänger Trompete üben?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Täglich, auch wenn es nur 10 Minuten sind. Frequenz ist entscheidender als Dauer beim Aufbau des Ansatzes."
      }
    },
    {
      "@type": "Question",
      "name": "Wann sehe ich erste Fortschritte beim Trompete lernen?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Nach 7–14 Tagen täglichem Üben wird der Ton stabiler. Nach 4 Wochen spielst du erste erkennbare Melodien."
      }
    },
    {
      "@type": "Question",
      "name": "Was mache ich, wenn meine Lippen nach 5 Minuten erschöpft sind?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Das ist normal in den ersten 1–2 Wochen. Höre auf, warte 1–2 Stunden und versuche es kurz nochmal. Der Aufbau dauert – nicht drängen."
      }
    }
  ]
}
```

---

## 3. Support-2 Schema – FAQ + HowTo (Hohe Töne)

**Artikel:** Hohe Töne Trompete  
**URL:** /blog/trompete-hohe-toene  

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "HowTo",
      "name": "Hohe Töne auf der Trompete lernen",
      "description": "Systematischer Aufbau des Hochregisters auf der Trompete.",
      "step": [
        {
          "@type": "HowToStep",
          "position": 1,
          "name": "Fundament prüfen",
          "text": "G4 und A4 sauber spielen können, bevor das Hochregister angegangen wird."
        },
        {
          "@type": "HowToStep",
          "position": 2,
          "name": "Lippenübungen ohne Instrument",
          "text": "10 Minuten täglich Buzzing mit dem Mundstück, Tonhöhe nur durch Lippenspannung verändern."
        },
        {
          "@type": "HowToStep",
          "position": 3,
          "name": "Slurs einführen",
          "text": "C4–G4–C5 als gebundene Figuren spielen, ohne Druck, mit vollem Ton."
        },
        {
          "@type": "HowToStep",
          "position": 4,
          "name": "Skalenarbeit in höherer Lage",
          "text": "Tonleitern schrittweise nach oben transponieren, jede Woche um einen Ton erweitern."
        }
      ]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Warum klingen meine hohen Töne so eng und gepresst?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Zu viel Mundstückdruck und zu wenig Luftgeschwindigkeit. Slur-Übungen ohne Druck helfen."
          }
        },
        {
          "@type": "Question",
          "name": "Kann jeder das hohe C lernen?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Anatomisch ja – mit ausreichend Zeit und Methode. C5 ist für die meisten Trompeter erreichbar."
          }
        },
        {
          "@type": "Question",
          "name": "Wie lange dauert es, bis das hohe C sitzt?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Hohes G (G5): 3–6 Monate. Hohes C (C5): 6–12 Monate bei gutem Fundament."
          }
        }
      ]
    }
  ]
}
```

---

## 4. Support-3 Schema – FAQ (Online lernen)

**Artikel:** Trompete online lernen  
**URL:** /blog/trompete-online-lernen  

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Kann ich Trompete wirklich ohne Präsenzlehrer lernen?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ja, mit dem richtigen System. Video-Feedback und strukturierte Level können einen Großteil dessen ersetzen, was ein Präsenzlehrer leistet."
      }
    },
    {
      "@type": "Question",
      "name": "Wie lange dauert es, mit einem Online-Kurs erste Töne zu spielen?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Am ersten Tag. Mit einer guten Anleitung spielst du erste Melodien innerhalb der ersten 2 Wochen."
      }
    },
    {
      "@type": "Question",
      "name": "Sind kostenlose Kurse ausreichend?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Für erste Orientierung ja. Für ernsthaftes Lernen fehlt meist die Struktur und das Notenmaterial."
      }
    },
    {
      "@type": "Question",
      "name": "Funktioniert Online-Lernen auch für Kinder?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ab ca. 8–9 Jahren, wenn ein Elternteil dabei ist und hilft. Jüngere Kinder profitieren mehr von Präsenzunterricht."
      }
    }
  ]
}
```

---

## 5. Organization Schema (einmalig im Site-Header)

```json
{
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "Trumpetstar",
  "url": "https://trumpetstar.com",
  "sameAs": [
    "https://trumpetstar.app",
    "https://www.facebook.com/trumpetstar",
    "https://www.instagram.com/trumpetstar"
  ],
  "description": "Digitale Trompetenschule mit strukturierten Levels, Noten, Videos und Playalongs. Für Anfänger, Wiedereinsteiger und Fortgeschrittene.",
  "areaServed": ["DE", "AT", "CH"],
  "inLanguage": "de"
}
```

---

*KW10/2026 | Trumpetstar Schema Pack*
