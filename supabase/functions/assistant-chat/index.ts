import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// System prompts for different modes
const MODE_PROMPTS: Record<string, string> = {
  platform: `Du bist der Trumpetstar Plattform-Assistent. Du hilfst bei Fragen zur App-Nutzung:
- Login, Account, Passwort
- Premium-Features und Upgrades
- Klassenzimmer und Live-Sessions
- Feedback-System und Lehrer-Chat
- Offline-Nutzung und Synchronisation
- Aufnahmen und Sharing

Antworte präzise und freundlich. Wenn du keine Information hast, sage ehrlich: "Dazu habe ich in Trumpetstar noch keine Info."`,

  technique: `Du bist der Trumpetstar Übe-Coach. Du hilfst bei Trompeten-Technik:
- Ansatz und Atmung
- Tonbildung und Intonation
- Artikulation und Zungenstoß
- Fingertechnik und Koordination
- Ausdauer und Höhe
- Tägliche Routine

Gib konkrete, umsetzbare Tipps. Vermeide Floskeln. Wenn du keine spezifische Info hast, sage: "Dazu habe ich in der Trumpetstar-Wissensbasis noch keine Details."`,

  mental: `Du bist der Trumpetstar Mental-Coach. Du hilfst bei mentalen Aspekten des Musizierens:
- Lampenfieber und Auftrittssicherheit
- Motivation und Durchhaltevermögen
- Fokus und Konzentration
- Umgang mit Fehlern und Rückschlägen
- Zielsetzung und Fortschritt
- Balance zwischen Üben und Erholung

Sei unterstützend aber sachlich. Keine Therapie, sondern praktische Musik-Psychologie.`,

  repertoire: `Du bist der Trumpetstar Repertoire-Berater. Du hilfst bei Stückauswahl und Interpretation:
- Passende Stücke für das Niveau
- Technische Herausforderungen eines Stücks
- Übestrategien für spezifische Passagen
- Stilistische Hinweise
- Typische Fehler und wie man sie vermeidet

Nutze die Repertoire-Datenbank für spezifische Empfehlungen.`,

  mixed: `Du bist der Trumpetstar Assistent - ein Experte für Trompete und die Trumpetstar-Plattform. Du hilfst bei:
- Plattform-Fragen (Login, Premium, Features)
- Übe-Tipps und Technik
- Mentale Aspekte des Musizierens
- Repertoire und Stückauswahl

Erkenne das Thema der Frage und antworte entsprechend. Sei präzise und hilfreich.`,
};

// Base instructions for all modes
const BASE_INSTRUCTIONS = `
WICHTIGE REGELN:
1. Antworte NUR auf Basis der bereitgestellten Wissensbasis-Inhalte.
2. Wenn keine passenden Inhalte gefunden wurden, sage ehrlich: "Dazu habe ich in der Trumpetstar-Wissensbasis noch keine Information. Soll ich diese Frage für das Team speichern?"
3. Keine Quellenangaben im Text - antworte clean und direkt.
4. Halte Antworten kurz und strukturiert (max. 3-4 kurze Absätze).
5. Kein Marketing-Sprech, keine Emojis, erwachsener Ton.
6. Wenn eine Frage PREMIUM-Features betrifft und der User kein PREMIUM hat, erkläre freundlich, dass dieses Feature Premium-Mitgliedern vorbehalten ist.

SPRACHE: Antworte in der Sprache der Frage (Deutsch oder Englisch).
`;

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
    
    const { mode = "mixed", language = "de", userPlanKey = "FREE", includeRecording = false, recordingContext = null } = body;

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
    const stopWords = ['ist', 'der', 'die', 'das', 'ein', 'eine', 'und', 'oder', 'was', 'wie', 'kann', 'ich', 'mir', 'mich', 'bei', 'mit', 'für', 'auf', 'the', 'and', 'for', 'with'];
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

    // Search in knowledge_sources directly (since chunks may be empty)
    const { data: sources } = await supabase
      .from("knowledge_sources")
      .select("id, title, content, type, tags")
      .in("visibility", allowedPlans)
      .limit(50);

    console.log("[assistant-chat] Knowledge sources found:", sources?.length || 0);

    if (sources && sources.length > 0 && keywords.length > 0) {
      const scoredSources = sources.map((source: any) => {
        const searchText = `${source.title} ${source.content || ''} ${source.tags?.join(' ') || ''}`.toLowerCase();
        // Score based on keyword matches (weighted: title matches are worth more)
        let score = 0;
        for (const kw of keywords) {
          if (source.title.toLowerCase().includes(kw)) score += 3;
          if (searchText.includes(kw)) score += 1;
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
    const contextString = contextChunks.length > 0
      ? `\n\nRELEVANTE WISSENSBASIS-INHALTE:\n${contextChunks.join("\n\n---\n\n")}\n\n`
      : "\n\n(Keine relevanten Inhalte in der Wissensbasis gefunden.)\n\n";

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

    // Build system prompt
    const systemPrompt = `${MODE_PROMPTS[mode] || MODE_PROMPTS.mixed}${BASE_INSTRUCTIONS}${contextString}${recordingInfo}`;

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
