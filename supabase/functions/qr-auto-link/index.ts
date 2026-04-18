import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Inline legacy mapping (mirror of src/lib/legacy-qr-redirects.ts)
const LEGACY_QR_REDIRECTS: Record<string, string> = {
  // Core mapping helper — derive level/song from label
};

function parseLevelSong(label: string | null): { level: number; song: number } | null {
  if (!label) return null;
  const m = label.match(/Level\s+(\d+)\s+Lied\s+(\d+)/i);
  if (!m) return null;
  return { level: parseInt(m[1]), song: parseInt(m[2]) };
}

interface QRCode {
  id: string;
  code: string;
  content_type: string;
  video_id: string | null;
  audio_id: string | null;
  label: string | null;
}

interface VideoOption { id: string; title: string; }
interface AudioOption { id: string; display_name: string; level_name: string | null; }

interface Suggestion {
  qr_id: string;
  qr_code: string;
  qr_label: string | null;
  content_type: string;
  current_id: string | null;
  current_title: string | null;
  suggested_id: string | null;
  suggested_title: string | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  source: 'legacy' | 'ai' | 'exact-title' | 'none';
  reason: string;
}

// Try to find audio/video by Level X Lied Y label using existing titles
function findByLevelSong(
  qr: QRCode,
  videos: VideoOption[],
  audios: AudioOption[]
): { id: string | null; title: string | null; confidence: 'high' | 'medium' } | null {
  const ls = parseLevelSong(qr.label);
  if (!ls) return null;

  if (qr.content_type === 'audio') {
    // match by level_name containing "Level X" and display_name starting with song number
    const songStr = String(ls.song).padStart(2, '0');
    const candidates = audios.filter(a => {
      const lvlMatch = a.level_name?.match(/Level\s+(\d+)/i);
      return lvlMatch && parseInt(lvlMatch[1]) === ls.level;
    });
    // prefer those whose display_name starts with "01 ", "02 " etc.
    const exact = candidates.find(a => a.display_name.match(new RegExp(`^0?${ls.song}\\s|^${songStr}\\s`)));
    if (exact) return { id: exact.id, title: `${exact.display_name} (${exact.level_name})`, confidence: 'high' };
    if (candidates.length === 1) return { id: candidates[0].id, title: `${candidates[0].display_name} (${candidates[0].level_name})`, confidence: 'medium' };
    return null;
  }

  if (qr.content_type === 'video') {
    // videos don't have explicit level/song mapping in label — fall back to title match
    return null;
  }
  return null;
}

async function aiSuggest(
  qr: QRCode,
  videos: VideoOption[],
  audios: AudioOption[],
  apiKey: string
): Promise<{ id: string | null; title: string | null; reason: string } | null> {
  const list = qr.content_type === 'video'
    ? videos.map(v => ({ id: v.id, title: v.title }))
    : audios.map(a => ({ id: a.id, title: a.level_name ? `${a.display_name} (${a.level_name})` : a.display_name }));

  if (list.length === 0) return null;

  const sys = `Du bist ein Matching-Assistent. Du erhältst ein QR-Code-Label und eine Liste von ${qr.content_type === 'video' ? 'Videos' : 'Audios'}. Wähle den besten Treffer, der semantisch zum Label passt (z.B. gleicher Liedtitel, gleiches Level). Wenn kein guter Treffer existiert, gib id=null zurück.`;

  const user = `QR-Label: "${qr.label || qr.code}"\nQR-Code: ${qr.code}\nContent-Type: ${qr.content_type}\n\nVerfügbare ${qr.content_type === 'video' ? 'Videos' : 'Audios'}:\n${list.slice(0, 200).map((x, i) => `${i + 1}. [${x.id}] ${x.title}`).join('\n')}`;

  const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
      tools: [{
        type: 'function',
        function: {
          name: 'pick_match',
          description: 'Wähle den besten Treffer',
          parameters: {
            type: 'object',
            properties: {
              id: { type: ['string', 'null'], description: 'UUID des besten Treffers oder null' },
              reason: { type: 'string', description: 'Kurze Begründung (max 80 Zeichen)' },
            },
            required: ['id', 'reason'],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: 'function', function: { name: 'pick_match' } },
    }),
  });

  if (!resp.ok) {
    if (resp.status === 429 || resp.status === 402) {
      throw new Error(`AI-Limit erreicht (${resp.status})`);
    }
    return null;
  }

  const data = await resp.json();
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) return null;
  try {
    const parsed = JSON.parse(args);
    if (!parsed.id) return { id: null, title: null, reason: parsed.reason || 'Kein Treffer' };
    const match = list.find(x => x.id === parsed.id);
    return { id: parsed.id, title: match?.title || null, reason: parsed.reason || '' };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { mode = 'suggest', applyIds = [] } = await req.json().catch(() => ({}));
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('LOVABLE_API_KEY fehlt');

    // Fetch all QR codes + videos + audios
    const [qrRes, vidRes, audRes] = await Promise.all([
      supabase.from('qr_codes').select('*').order('code'),
      supabase.from('videos').select('id, title').eq('is_active', true),
      supabase.from('audio_files').select('id, display_name, audio_levels(name)'),
    ]);

    if (qrRes.error) throw qrRes.error;
    const qrCodes = (qrRes.data || []) as QRCode[];
    const videos = (vidRes.data || []) as VideoOption[];
    const audios = (audRes.data || []).map((a: any) => ({
      id: a.id, display_name: a.display_name, level_name: a.audio_levels?.name ?? null,
    })) as AudioOption[];

    const suggestions: Suggestion[] = [];

    for (const qr of qrCodes) {
      const currentId = qr.content_type === 'video' ? qr.video_id : qr.audio_id;
      const currentTitle = currentId
        ? (qr.content_type === 'video'
            ? videos.find(v => v.id === currentId)?.title || null
            : (() => { const a = audios.find(a => a.id === currentId); return a ? (a.level_name ? `${a.display_name} (${a.level_name})` : a.display_name) : null; })())
        : null;

      // 1) Try legacy/level-song mapping
      const legacy = findByLevelSong(qr, videos, audios);
      if (legacy?.id) {
        suggestions.push({
          qr_id: qr.id, qr_code: qr.code, qr_label: qr.label,
          content_type: qr.content_type,
          current_id: currentId, current_title: currentTitle,
          suggested_id: legacy.id, suggested_title: legacy.title,
          confidence: legacy.confidence, source: 'legacy',
          reason: `Match via Level/Lied-Nummer im Label`,
        });
        continue;
      }

      // 2) Exact title match (label contains a video/audio title)
      if (qr.label && qr.content_type === 'video') {
        const exact = videos.find(v => qr.label!.toLowerCase().includes(v.title.toLowerCase()) && v.title.length > 4);
        if (exact) {
          suggestions.push({
            qr_id: qr.id, qr_code: qr.code, qr_label: qr.label,
            content_type: qr.content_type,
            current_id: currentId, current_title: currentTitle,
            suggested_id: exact.id, suggested_title: exact.title,
            confidence: 'high', source: 'exact-title',
            reason: 'Video-Titel ist im Label enthalten',
          });
          continue;
        }
      }

      // 3) AI fallback (only if label exists)
      if (qr.label && qr.label.trim().length > 2) {
        try {
          const ai = await aiSuggest(qr, videos, audios, apiKey);
          if (ai?.id) {
            suggestions.push({
              qr_id: qr.id, qr_code: qr.code, qr_label: qr.label,
              content_type: qr.content_type,
              current_id: currentId, current_title: currentTitle,
              suggested_id: ai.id, suggested_title: ai.title,
              confidence: 'medium', source: 'ai',
              reason: ai.reason,
            });
            continue;
          }
        } catch (e) {
          // AI failed — keep going with no suggestion
          console.error('AI error for', qr.code, e);
        }
      }

      suggestions.push({
        qr_id: qr.id, qr_code: qr.code, qr_label: qr.label,
        content_type: qr.content_type,
        current_id: currentId, current_title: currentTitle,
        suggested_id: null, suggested_title: null,
        confidence: 'none', source: 'none',
        reason: qr.label ? 'Kein Treffer gefunden' : 'Kein Label vorhanden',
      });
    }

    // If apply mode: update the requested QR codes
    if (mode === 'apply' && Array.isArray(applyIds) && applyIds.length > 0) {
      const toApply = suggestions.filter(s => applyIds.includes(s.qr_id) && s.suggested_id);
      let applied = 0;
      for (const s of toApply) {
        const update = s.content_type === 'video'
          ? { video_id: s.suggested_id, audio_id: null }
          : { audio_id: s.suggested_id, video_id: null };
        const { error } = await supabase.from('qr_codes').update(update).eq('id', s.qr_id);
        if (!error) applied++;
      }
      return new Response(JSON.stringify({ suggestions, applied }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('qr-auto-link error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
