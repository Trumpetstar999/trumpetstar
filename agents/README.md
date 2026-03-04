# Trumpetstar AI Business Assistant – Agent System

6 spezialisierte Sub-Agents, aufrufbar via `sessions_spawn`.
Jeder Agent hat eine eigene Rolle, Custom Instructions und Wissensbasis.

## Agents

| # | Label | Rolle | Einsatz |
|---|-------|-------|---------|
| 1 | `ts-cto` | CTO & Technology | App, APIs, Hosting, Bugfixing, Tech-Entscheidungen |
| 2 | `ts-marketing` | Marketing & Sales | Ads, Content, SEO, Funnels, Email |
| 3 | `ts-product` | Product & Education | Curriculum, UX, Gamification, neue Inhalte |
| 4 | `ts-strategy` | Business & Strategy | Finanzen, Skalierung, Pricing, Partnerschaften |
| 5 | `ts-content` | Content Creator | Copywriting, Social Media, Ad Copy, Newsletter |
| 6 | `ts-support` | Customer Support | FAQ, Onboarding, Feedback, Templates |

## Nutzung

ClawBot (Main Agent) delegiert Aufgaben an den passenden Sub-Agent.
Ergebnisse werden automatisch zurück in die Main Session gemeldet.
