import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { BEGINNER_SHOWCASES } from '../_shared/beginner-showcases.ts';

/** Explicit admin sync; touches only the requested beginner showcases. */
export async function syncBeginnerShowcases(db: SupabaseClient, token: string) {
  const results: { showcaseId: string; videos: number }[] = [];
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.vimeo.*+json;version=3.4' };
  for (const language of ['de', 'en', 'es'] as const) {
    for (const showcaseId of BEGINNER_SHOWCASES[language]) {
      const base = `https://api.vimeo.com/me/albums/${showcaseId}`;
      const infoResponse = await fetch(base, { headers });
      if (!infoResponse.ok) throw new Error(`Showcase ${showcaseId}: Vimeo ${infoResponse.status}`);
      const info = await infoResponse.json();
      const ordered: { uri: string; name: string; duration: number; player_embed_url: string; pictures?: { sizes: { width: number; link: string }[] } }[] = [];
      for (let page = 1; ; page++) {
        const response = await fetch(`${base}/videos?sort=manual&direction=asc&per_page=100&page=${page}`, { headers });
        if (!response.ok) throw new Error(`Showcase ${showcaseId}: Vimeo ${response.status}`);
        const payload = await response.json();
        ordered.push(...(payload.data ?? []));
        if (!payload.paging?.next) break;
        if (page >= 50) throw new Error('Showcase pagination limit exceeded');
      }
      // Do not hide a working catalog on an empty/unexpected provider response.
      if (!ordered.length) throw new Error(`Showcase ${showcaseId} is empty`);
      const { data: existing, error: lookupError } = await db.from('levels').select('id').eq('vimeo_showcase_id', showcaseId).maybeSingle();
      if (lookupError) throw lookupError;
      let levelId = existing?.id;
      if (!levelId) {
        const { data, error } = await db.from('levels').insert({ vimeo_showcase_id: showcaseId, title: info.name, language, sort_order: 1000, is_active: true }).select('id').single();
        if (error) throw error;
        levelId = data.id;
      }
      const { data: saved, error: readError } = await db.from('videos').select('id,vimeo_video_id').eq('level_id', levelId);
      if (readError) throw readError;
      const map = new Map((saved ?? []).map(v => [v.vimeo_video_id, v.id]));
      const ids: string[] = [];
      for (const [index, video] of ordered.entries()) {
        const vimeoId = video.uri.match(/^\/videos\/(\d+)/)?.[1];
        if (!vimeoId) throw new Error('Invalid Vimeo video identity');
        ids.push(vimeoId);
        const thumbnail = [...(video.pictures?.sizes ?? [])].sort((a, b) => b.width - a.width)[0]?.link ?? null;
        const row = { level_id: levelId, vimeo_video_id: vimeoId, title: video.name, language, sort_order: index, duration_seconds: video.duration, thumbnail_url: thumbnail, vimeo_player_url: video.player_embed_url, is_active: true, last_synced_at: new Date().toISOString() };
        const id = map.get(vimeoId);
        const { error } = id ? await db.from('videos').update(row).eq('id', id) : await db.from('videos').insert(row);
        if (error) throw error;
      }
      for (const row of saved ?? []) {
        if (!ids.includes(row.vimeo_video_id)) {
          const { error } = await db.from('videos').update({ is_active: false }).eq('id', row.id);
          if (error) throw error;
        }
      }
      results.push({ showcaseId, videos: ordered.length });
    }
  }
  return results;
}