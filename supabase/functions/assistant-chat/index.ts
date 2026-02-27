import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// System prompts for different modes - multilingual
const MODE_PROMPTS: Record<string, Record<string, string>> = {
  platform: {
    de: `Du bist der Trumpetstar Plattform-Assistent. Du hilfst bei Fragen zur App-Nutzung:
- Login, Account, Passwort
- Premium-Features und Upgrades
- Klassenzimmer und Live-Sessions
- Feedback-System und Lehrer-Chat
- Offline-Nutzung und Synchronisation
- Aufnahmen und Sharing

Antworte präzise und freundlich. Wenn du keine Information hast, sage ehrlich: "Dazu habe ich in Trumpetstar noch keine Info."`,
    en: `You are the Trumpetstar Platform Assistant. You help with app usage questions:
- Login, account, password
- Premium features and upgrades
- Classroom and live sessions
- Feedback system and teacher chat
- Offline use and sync
- Recordings and sharing

Answer precisely and friendly. If you don't have the info, say honestly: "I don't have that information in Trumpetstar yet."`,
    es: `Eres el Asistente de la Plataforma Trumpetstar. Ayudas con preguntas sobre el uso de la app:
- Login, cuenta, contraseña
- Funciones Premium y upgrades
- Aula virtual y sesiones en vivo
- Sistema de feedback y chat con profesor
- Uso offline y sincronización
- Grabaciones y compartir

Responde de forma precisa y amable. Si no tienes la información, di honestamente: "No tengo esa información en Trumpetstar todavía."`
  },
  technique: {
    de: `Du bist der Trumpetstar Übe-Coach. Du hilfst bei Trompeten-Technik:
- Ansatz und Atmung
- Tonbildung und Intonation
- Artikulation und Zungenstoß
- Fingertechnik und Koordination
- Ausdauer und Höhe
- Tägliche Routine

Gib konkrete, umsetzbare Tipps. Vermeide Floskeln.`,
    en: `You are the Trumpetstar Practice Coach. You help with trumpet technique:
- Embouchure and breathing
- Tone production and intonation
- Articulation and tonguing
- Finger technique and coordination
- Endurance and range
- Daily routine

Give concrete, actionable tips. Avoid clichés.`,
    es: `Eres el Coach de Práctica de Trumpetstar. Ayudas con técnica de trompeta:
- Embocadura y respiración
- Producción de sonido e entonación
- Articulación y picado
- Técnica de dedos y coordinación
- Resistencia y registro
- Rutina diaria

Da consejos concretos y aplicables. Evita frases hechas.`
  },
  mental: {
    de: `Du bist der Trumpetstar Mental-Coach. Du hilfst bei mentalen Aspekten des Musizierens:
- Lampenfieber und Auftrittssicherheit
- Motivation und Durchhaltevermögen
- Fokus und Konzentration
- Umgang mit Fehlern und Rückschlägen
- Zielsetzung und Fortschritt
- Balance zwischen Üben und Erholung

Sei unterstützend aber sachlich. Keine Therapie, sondern praktische Musik-Psychologie.`,
    en: `You are the Trumpetstar Mental Coach. You help with mental aspects of music-making:
- Stage fright and performance confidence
- Motivation and persistence
- Focus and concentration
- Dealing with mistakes and setbacks
- Goal setting and progress
- Balance between practice and rest

Be supportive but factual. No therapy, just practical music psychology.`,
    es: `Eres el Coach Mental de Trumpetstar. Ayudas con aspectos mentales de hacer música:
- Miedo escénico y confianza en actuaciones
- Motivación y perseverancia
- Enfoque y concentración
- Manejo de errores y contratiempos
- Establecimiento de metas y progreso
- Balance entre práctica y descanso

Sé comprensivo pero objetivo. No terapia, sino psicología musical práctica.`
  },
  repertoire: {
    de: `Du bist der Trumpetstar Repertoire-Berater. Du hilfst bei Stückauswahl und Interpretation:
- Passende Stücke für das Niveau
- Technische Herausforderungen eines Stücks
- Übestrategien für spezifische Passagen
- Stilistische Hinweise
- Typische Fehler und wie man sie vermeidet

Nutze die Repertoire-Datenbank für spezifische Empfehlungen.`,
    en: `You are the Trumpetstar Repertoire Advisor. You help with piece selection and interpretation:
- Suitable pieces for the level
- Technical challenges of a piece
- Practice strategies for specific passages
- Stylistic hints
- Common mistakes and how to avoid them

Use the repertoire database for specific recommendations.`,
    es: `Eres el Asesor de Repertorio de Trumpetstar. Ayudas con selección de piezas e interpretación:
- Piezas adecuadas para el nivel
- Desafíos técnicos de una pieza
- Estrategias de práctica para pasajes específicos
- Consejos estilísticos
- Errores comunes y cómo evitarlos

Usa la base de datos de repertorio para recomendaciones específicas.`
  },
  mixed: {
    de: `Du bist der Trumpetstar Assistent - ein Experte für Trompete und die Trumpetstar-Plattform. Du hilfst bei:
- Plattform-Fragen (Login, Premium, Features)
- Übe-Tipps und Technik
- Mentale Aspekte des Musizierens
- Repertoire und Stückauswahl

Erkenne das Thema der Frage und antworte entsprechend. Sei präzise und hilfreich.`,
    en: `You are the Trumpetstar Assistant - an expert for trumpet and the Trumpetstar platform. You help with:
- Platform questions (login, premium, features)
- Practice tips and technique
- Mental aspects of music-making
- Repertoire and piece selection

Recognize the topic of the question and answer accordingly. Be precise and helpful.`,
    es: `Eres el Asistente de Trumpetstar - un experto en trompeta y la plataforma Trumpetstar. Ayudas con:
- Preguntas de la plataforma (login, premium, funciones)
- Consejos de práctica y técnica
- Aspectos mentales de hacer música
- Repertorio y selección de piezas

Reconoce el tema de la pregunta y responde de acuerdo. Sé preciso y útil.`
  },
};

// Base instructions for all modes - multilingual
const BASE_INSTRUCTIONS: Record<string, string> = {
  de: `
WICHTIGE REGELN:
1. Beginne JEDE Antwort mit einer persönlichen Begrüßung: "Hallo [Name]!" wenn ein Name bekannt ist, sonst nur "Hallo!".
2. Antworte NUR auf Basis der bereitgestellten Wissensbasis-Inhalte.
3. Wenn keine passenden Inhalte gefunden wurden, sage ehrlich: "Dazu habe ich in der Trumpetstar-Wissensbasis noch keine Information."
4. Keine Quellenangaben im Text - antworte clean und direkt.
5. Halte Antworten kurz und strukturiert (max. 3-4 kurze Absätze).
6. Kein Marketing-Sprech, keine Emojis, erwachsener Ton.
7. Wenn eine Frage PREMIUM-Features betrifft und der User kein PREMIUM hat, erkläre freundlich, dass dieses Feature Premium-Mitgliedern vorbehalten ist.

SPRACHE: Antworte immer auf Deutsch.
`,
  en: `
IMPORTANT RULES:
1. Start EVERY answer with a personal greeting: "Hello [Name]!" if a name is known, otherwise just "Hello!".
2. Answer ONLY based on the provided knowledge base content.
3. If no relevant content was found, say honestly: "I don't have that information in the Trumpetstar knowledge base yet."
4. No source references in the text - answer cleanly and directly.
5. Keep answers short and structured (max 3-4 short paragraphs).
6. No marketing speak, no emojis, adult tone.
7. If a question concerns PREMIUM features and the user doesn't have PREMIUM, explain kindly that this feature is reserved for Premium members.

LANGUAGE: Always answer in English.
`,
  es: `
REGLAS IMPORTANTES:
1. Comienza CADA respuesta con un saludo personal: "¡Hola [Nombre]!" si se conoce un nombre, sino solo "¡Hola!".
2. Responde SOLO basándote en el contenido de la base de conocimientos proporcionada.
3. Si no se encontró contenido relevante, di honestamente: "No tengo esa información en la base de conocimientos de Trumpetstar todavía."
4. Sin referencias a fuentes en el texto - responde de forma limpia y directa.
5. Mantén las respuestas cortas y estructuradas (máx. 3-4 párrafos cortos).
6. Sin lenguaje de marketing, sin emojis, tono adulto.
7. Si una pregunta se refiere a funciones PREMIUM y el usuario no tiene PREMIUM, explica amablemente que esta función está reservada para miembros Premium.

IDIOMA: Responde siempre en español.
`,
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Support both single message (for testing) and messages array
    let messages: Message[] = body.messages || [];
    if (body.message && typeof body.message === 'string') {
      messages = [{ role: 'user', content: body.message }];
    }
    
    const { mode = "mixed", language = "de", userPlanKey = "FREE", userName = "", includeRecording = false, recordingContext = null } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get Supabase client for RAG retrieval
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the last user message for context retrieval
    const lastUserMessage = messages.filter((m: Message) => m.role === "user").pop()?.content || "";
    // Extract keywords (min 2 chars to catch more, remove common stop words)
    const stopWords = ['ist', 'der', 'die', 'das', 'ein', 'eine', 'und', 'oder', 'was', 'wie', 'kann', 'ich', 'mir', 'mich', 'bei', 'mit', 'für', 'auf', 'the', 'and', 'for', 'with', 'man', 'den'];
    const keywords = lastUserMessage.toLowerCase()
      .split(/\s+/)
      .map(w => w.replace(/[?!.,;:]/g, ''))
      .filter((w: string) => w.length >= 2 && !stopWords.includes(w));

    console.log("[assistant-chat] Search keywords:", keywords);

    // RAG: Retrieve relevant knowledge chunks
    let contextChunks: string[] = [];
    let usedSourceIds: string[] = [];

    // Map plan to allowed levels
    const planHierarchy: Record<string, string[]> = {
      FREE: ["FREE"],
      BASIC: ["FREE", "BASIC"],
      PREMIUM: ["FREE", "BASIC", "PREMIUM"],
    };
    const allowedPlans = planHierarchy[userPlanKey] || ["FREE"];

    // Detect special query types
    // Note names pattern: c1, cis1, d1, dis1, e1, f1, fis1, g1, gis1, a1, b1, h1, c2, cis2, d2, dis2, e2, f2, fis2, g2, gis2, a2, b2, h2, c3
    const notePattern = /\b([a-h](?:is|es)?[1-3])\b/i;
    const noteMatch = lastUserMessage.match(notePattern);
    const isNoteQuery = noteMatch !== null;
    const queriedNote = noteMatch ? noteMatch[1].toLowerCase() : null;

    // Check if asking about fingering/grip
    const isFingeringQuery = /griff|greif|ventil|finger|spielen|tone?(?:\s|$)/i.test(lastUserMessage);
    
    // Check if asking about musical terms
    const isMusicalTermQuery = /was\s+(?:ist|heißt|bedeutet|sind?)|definition|begriff/i.test(lastUserMessage);
    
    // Check if asking about composers
    const isComposerQuery = /wer\s+war|komponist|biograph|leben|geboren|gestorben/i.test(lastUserMessage);

    console.log("[assistant-chat] Query type detection:", { isNoteQuery, queriedNote, isFingeringQuery, isMusicalTermQuery, isComposerQuery });

    // Search in knowledge_sources directly (since chunks may be empty)
    const { data: sources } = await supabase
      .from("knowledge_sources")
      .select("id, title, content, type, tags")
      .in("visibility", allowedPlans)
      .limit(1000);

    console.log("[assistant-chat] Knowledge sources found:", sources?.length || 0);

    if (sources && sources.length > 0) {
      const scoredSources = sources.map((source: any) => {
        const titleLower = source.title.toLowerCase();
        const contentLower = (source.content || '').toLowerCase();
        const tagsLower = (source.tags || []).join(' ').toLowerCase();
        const searchText = `${titleLower} ${contentLower} ${tagsLower}`;
        
        let score = 0;
        
        // Special handling for note queries - prioritize Grifftabelle
        if (isNoteQuery && queriedNote) {
          // Check if this is a Grifftabelle source
          if (titleLower.includes('grifftabelle') || tagsLower.includes('grifftabelle') || tagsLower.includes('griffe')) {
            // Check if the specific note is mentioned in content
            if (contentLower.includes(queriedNote)) {
              score += 20; // High priority for exact note match in Grifftabelle
            } else {
              score += 10; // Still relevant as a fingering chart
            }
          }
          // Also check Hilfsgriffe
          if (titleLower.includes('hilfsgriff') || tagsLower.includes('hilfsgriffe')) {
            if (contentLower.includes(queriedNote)) {
              score += 15;
            }
          }
        }
        
        // Special handling for fingering queries
        if (isFingeringQuery && !isNoteQuery) {
          if (titleLower.includes('grifftabelle') || tagsLower.includes('grifftabelle')) {
            score += 10;
          }
          if (titleLower.includes('hilfsgriff') || tagsLower.includes('hilfsgriffe')) {
            score += 8;
          }
        }
        
        // Special handling for musical terms
        if (isMusicalTermQuery) {
          if (titleLower.includes('musikal') || titleLower.includes('begriffe') || tagsLower.includes('musikbegriffe')) {
            score += 10;
          }
        }
        
        // Special handling for composer queries
        if (isComposerQuery) {
          if (titleLower.includes('komponist') || tagsLower.includes('komponist') || tagsLower.includes('musikgeschichte')) {
            score += 10;
          }
          // Check if specific composer name is in query and content
          const composerNames = ['bach', 'mozart', 'beethoven', 'haydn', 'vivaldi', 'händel', 'brahms', 'schumann'];
          for (const composer of composerNames) {
            if (lastUserMessage.toLowerCase().includes(composer) && contentLower.includes(composer)) {
              score += 15;
            }
          }
        }
        
        // Standard keyword matching (lower weight)
        for (const kw of keywords) {
          if (titleLower.includes(kw)) score += 2;
          if (contentLower.includes(kw)) score += 1;
          if (tagsLower.includes(kw)) score += 2;
        }
        
        return { ...source, score };
      }).filter((s: any) => s.score > 0).sort((a: any, b: any) => b.score - a.score).slice(0, 5);

      console.log("[assistant-chat] Matched sources:", scoredSources.map((s: any) => ({ title: s.title, score: s.score })));

      contextChunks = scoredSources.map((s: any) => s.content || s.title);
      usedSourceIds = scoredSources.map((s: any) => s.id);
    }

    // Also search in knowledge_chunks if available
    const { data: chunks } = await supabase
      .from("knowledge_chunks")
      .select("id, chunk_text, source_id, tags")
      .in("plan_required", allowedPlans)
      .limit(10);

    if (chunks && chunks.length > 0) {
      const scoredChunks = chunks.map((chunk: any) => {
        const text = chunk.chunk_text.toLowerCase();
        const score = keywords.reduce((acc: number, kw: string) => acc + (text.includes(kw) ? 1 : 0), 0);
        return { ...chunk, score };
      }).filter((c: any) => c.score > 0).sort((a: any, b: any) => b.score - a.score).slice(0, 5);

      contextChunks.push(...scoredChunks.map((c: any) => c.chunk_text));
      usedSourceIds.push(...scoredChunks.map((c: any) => c.source_id).filter(Boolean));
    }

    // Search in repertoire_items if mode is repertoire or mixed
    if (mode === "repertoire" || mode === "mixed") {
      const { data: repertoire } = await supabase
        .from("repertoire_items")
        .select("*")
        .in("plan_required", allowedPlans)
        .limit(5);

      if (repertoire && repertoire.length > 0) {
        const keywords = lastUserMessage.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
        const matchedRepertoire = repertoire.filter((item: any) => {
          const searchText = `${item.title} ${item.composer} ${item.type} ${item.techniques_tags?.join(" ") || ""}`.toLowerCase();
          return keywords.some((kw: string) => searchText.includes(kw));
        }).slice(0, 3);

        matchedRepertoire.forEach((item: any) => {
          contextChunks.push(`REPERTOIRE: ${item.title} von ${item.composer || "Unbekannt"}
- Schwierigkeit: ${item.difficulty || "k.A."}
- Techniken: ${item.techniques_tags?.join(", ") || "k.A."}
- Ziel: ${item.goal || "k.A."}
- Typische Fehler: ${item.common_pitfalls || "k.A."}
- Übungsschritte: ${item.practice_steps || "k.A."}
- Zielzeit: ${item.target_minutes || "k.A."} Minuten`);
        });
      }
    }

    // Build context string
    const noContextFound = contextChunks.length === 0;
    const contextString = !noContextFound
      ? `\n\nRELEVANTE WISSENSBASIS-INHALTE:\n${contextChunks.join("\n\n---\n\n")}\n\n`
      : "\n\n(Keine relevanten Inhalte in der Wissensbasis gefunden.)\n\n";

    // Add fingering link hint if fingering/note query detected
    const fingeringLinkHint = (isFingeringQuery || isNoteQuery)
      ? `\n\nFINGERING_LINK_HINT: Bei dieser Frage zu Griffen oder Noten, füge am Ende deiner Antwort folgenden Satz hinzu (exakt so, mit dem Markdown-Link): "📖 Die vollständige Grifftabelle findest du hier: [Grifftabelle öffnen](/app/levels?highlight=grifftabelle)"\n\n`
      : "";

    // Save unanswered question if no knowledge base match was found
    if (noContextFound && lastUserMessage.trim().length > 0) {
      try {
        // Extract user_id from auth header
        const authHeader = req.headers.get("authorization");
        let userId: string | null = null;
        if (authHeader) {
          const token = authHeader.replace("Bearer ", "");
          const { data: { user } } = await supabase.auth.getUser(token);
          userId = user?.id || null;
        }
        if (userId) {
          await supabase.from("assistant_unanswered_questions").insert({
            user_id: userId,
            question: lastUserMessage,
            detected_intent: mode !== "mixed" ? mode : null,
            language: language,
            status: "pending",
          });
          console.log("[assistant-chat] Saved unanswered question to DB");
        }
      } catch (e) {
        console.error("[assistant-chat] Failed to save unanswered question:", e);
      }
    }

    // Build recording context if requested
    let recordingInfo = "";
    if (includeRecording && recordingContext) {
      recordingInfo = `\n\nLETZTE AUFNAHME DES USERS:
- Titel: ${recordingContext.title || "Unbenannt"}
- Datum: ${recordingContext.date || "Unbekannt"}
- Dauer: ${recordingContext.duration || "Unbekannt"} Sekunden
- User-Selbsteinschätzung: ${recordingContext.selfAssessment || "Keine Angabe"}

Basierend auf diesen Metadaten, gib:
1. 3 konkrete Übungen
2. 1 mentalen Tipp
3. 1 Mini-Ziel (10 Minuten)
`;
    }

    // Build user context - multilingual
    const userContextTemplates: Record<string, { known: string; unknown: string }> = {
      de: { known: `\n\nDer Benutzer heißt: ${userName}\n`, unknown: "\n\nDer Benutzername ist nicht bekannt.\n" },
      en: { known: `\n\nThe user's name is: ${userName}\n`, unknown: "\n\nThe user's name is not known.\n" },
      es: { known: `\n\nEl nombre del usuario es: ${userName}\n`, unknown: "\n\nEl nombre del usuario no se conoce.\n" },
    };
    const userContextTpl = userContextTemplates[language] || userContextTemplates.de;
    const userContext = userName ? userContextTpl.known : userContextTpl.unknown;

    // Build system prompt with language-specific content
    const modePrompt = MODE_PROMPTS[mode]?.[language] || MODE_PROMPTS.mixed[language] || MODE_PROMPTS.mixed.de;
    const baseInstr = BASE_INSTRUCTIONS[language] || BASE_INSTRUCTIONS.de;
    const systemPrompt = `${modePrompt}${baseInstr}${userContext}${contextString}${fingeringLinkHint}${recordingInfo}`;

    // Prepare messages for API
    const apiMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    console.log("[assistant-chat] Calling Lovable AI with mode:", mode, "language:", language);
    console.log("[assistant-chat] Context chunks found:", contextChunks.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Bitte versuche es später erneut." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Quota erschöpft. Bitte später erneut versuchen." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("[assistant-chat] AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Add used source IDs to response headers
    const responseHeaders = {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "X-Used-Source-Ids": JSON.stringify(usedSourceIds),
    };

    return new Response(response.body, { headers: responseHeaders });
  } catch (error) {
    console.error("[assistant-chat] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
