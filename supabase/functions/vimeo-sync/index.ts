import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VimeoVideo {
  uri: string;
  name: string;
  description: string | null;
  duration: number;
  pictures: {
    sizes: Array<{ link: string; width: number }>;
  };
  player_embed_url: string;
}

interface VimeoShowcase {
  uri: string;
  name: string;
  description: string | null;
  pictures: {
    sizes: Array<{ link: string; width: number }>;
  } | null;
}

interface DbVideo {
  id: string;
  vimeo_video_id: string;
  sort_order: number;
  section_id: string | null;
}

interface DbSection {
  id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VIMEO_TOKEN = Deno.env.get('VIMEO_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!VIMEO_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body
    const { action, showcaseUrl, levelId } = await req.json();
    console.log(`Vimeo sync action: ${action}`, { showcaseUrl, levelId });

    if (action === 'import') {
      // Import a new showcase
      if (!showcaseUrl) {
        return new Response(
          JSON.stringify({ error: 'showcaseUrl is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract showcase ID from URL
      const showcaseMatch = showcaseUrl.match(/showcase\/(\d+)/);
      if (!showcaseMatch) {
        return new Response(
          JSON.stringify({ error: 'Invalid showcase URL format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const showcaseId = showcaseMatch[1];
      console.log(`Importing showcase: ${showcaseId}`);

      // Fetch showcase details from Vimeo
      const showcaseResponse = await fetch(
        `https://api.vimeo.com/me/albums/${showcaseId}`,
        {
          headers: {
            'Authorization': `Bearer ${VIMEO_TOKEN}`,
            'Accept': 'application/vnd.vimeo.*+json;version=3.4',
          },
        }
      );

      if (!showcaseResponse.ok) {
        const errorText = await showcaseResponse.text();
        console.error('Vimeo API error:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch showcase from Vimeo', details: errorText }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const showcaseData: VimeoShowcase = await showcaseResponse.json();
      console.log(`Showcase found: ${showcaseData.name}`);

      // Get thumbnail URL (prefer larger size)
      const thumbnailUrl = showcaseData.pictures?.sizes
        ?.sort((a, b) => b.width - a.width)[0]?.link || null;

      // Check if level already exists
      const { data: existingLevel } = await supabase
        .from('levels')
        .select('id')
        .eq('vimeo_showcase_id', showcaseId)
        .single();

      let level;
      if (existingLevel) {
        // Update existing level
        const { data, error } = await supabase
          .from('levels')
          .update({
            title: showcaseData.name,
            description: showcaseData.description,
            thumbnail_url: thumbnailUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingLevel.id)
          .select()
          .single();

        if (error) throw error;
        level = data;
        console.log(`Updated existing level: ${level.id}`);
      } else {
        // Get max sort_order
        const { data: maxOrderData } = await supabase
          .from('levels')
          .select('sort_order')
          .order('sort_order', { ascending: false })
          .limit(1)
          .single();

        const nextOrder = (maxOrderData?.sort_order || 0) + 1;

        // Create new level
        const { data, error } = await supabase
          .from('levels')
          .insert({
            vimeo_showcase_id: showcaseId,
            title: showcaseData.name,
            description: showcaseData.description,
            thumbnail_url: thumbnailUrl,
            sort_order: nextOrder,
          })
          .select()
          .single();

        if (error) throw error;
        level = data;
        console.log(`Created new level: ${level.id}`);

        // Create default "Alle Videos" section
        const { error: sectionError } = await supabase
          .from('sections')
          .insert({
            level_id: level.id,
            title: 'Alle Videos',
            sort_order: 0,
          });

        if (sectionError) {
          console.error('Error creating default section:', sectionError);
        }
      }

      // Fetch videos from showcase
      const result = await syncVideosForLevel(supabase, VIMEO_TOKEN, level.id, showcaseId);

      return new Response(
        JSON.stringify({
          success: true,
          level,
          ...result,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'sync') {
      // Sync videos for existing level(s)
      let levelsToSync: Array<{ id: string; vimeo_showcase_id: string }>;

      if (levelId) {
        // Sync specific level
        const { data, error } = await supabase
          .from('levels')
          .select('id, vimeo_showcase_id')
          .eq('id', levelId)
          .single();

        if (error || !data) {
          return new Response(
            JSON.stringify({ error: 'Level not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        levelsToSync = [data];
      } else {
        // Sync all active levels
        const { data, error } = await supabase
          .from('levels')
          .select('id, vimeo_showcase_id')
          .eq('is_active', true);

        if (error) throw error;
        levelsToSync = data || [];
      }

      console.log(`Syncing ${levelsToSync.length} levels`);

      const results = [];
      for (const level of levelsToSync) {
        try {
          const result = await syncVideosForLevel(
            supabase,
            VIMEO_TOKEN,
            level.id,
            level.vimeo_showcase_id
          );
          results.push({ levelId: level.id, ...result });
        } catch (error) {
          console.error(`Error syncing level ${level.id}:`, error);
          results.push({
            levelId: level.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "import" or "sync"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Vimeo sync error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// deno-lint-ignore no-explicit-any
async function syncVideosForLevel(
  supabase: any,
  vimeoToken: string,
  levelId: string,
  showcaseId: string
) {
  console.log(`Syncing videos for level ${levelId}, showcase ${showcaseId}`);

  // Fetch all videos from Vimeo showcase
  let allVideos: VimeoVideo[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await fetch(
      `https://api.vimeo.com/me/albums/${showcaseId}/videos?page=${page}&per_page=${perPage}`,
      {
        headers: {
          'Authorization': `Bearer ${vimeoToken}`,
          'Accept': 'application/vnd.vimeo.*+json;version=3.4',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Vimeo API error: ${response.status}`);
    }

    const data = await response.json();
    allVideos = allVideos.concat(data.data || []);

    if (!data.paging?.next) break;
    page++;
  }

  console.log(`Found ${allVideos.length} videos in Vimeo showcase`);

  // Get existing videos for this level
  const { data: existingVideosData } = await supabase
    .from('videos')
    .select('id, vimeo_video_id, sort_order, section_id')
    .eq('level_id', levelId);

  const existingVideos = (existingVideosData || []) as DbVideo[];
  const existingVideoMap = new Map<string, DbVideo>(
    existingVideos.map((v) => [v.vimeo_video_id, v])
  );

  // Get default section
  const { data: defaultSectionData } = await supabase
    .from('sections')
    .select('id')
    .eq('level_id', levelId)
    .eq('title', 'Alle Videos')
    .single();

  const defaultSection = defaultSectionData as DbSection | null;

  const vimeoVideoIds = new Set<string>();
  let videosAdded = 0;
  let videosUpdated = 0;

  // Get max sort_order for new videos
  const maxSortOrder = existingVideos.reduce(
    (max, v) => Math.max(max, v.sort_order || 0),
    0
  );
  let nextSortOrder = maxSortOrder + 1;

  for (const video of allVideos) {
    // Extract video ID from URI (e.g., "/videos/123456")
    const videoIdMatch = video.uri.match(/\/videos\/(\d+)/);
    if (!videoIdMatch) continue;
    const vimeoVideoId = videoIdMatch[1];
    vimeoVideoIds.add(vimeoVideoId);

    // Get best thumbnail
    const thumbnailUrl = video.pictures?.sizes
      ?.sort((a, b) => b.width - a.width)[0]?.link || null;

    const existing = existingVideoMap.get(vimeoVideoId);

    if (existing) {
      // Update existing video (preserve sort_order and section_id)
      const { error } = await supabase
        .from('videos')
        .update({
          title: video.name,
          description: video.description,
          thumbnail_url: thumbnailUrl,
          duration_seconds: video.duration,
          vimeo_player_url: video.player_embed_url,
          is_active: true,
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error(`Error updating video ${existing.id}:`, error);
      } else {
        videosUpdated++;
      }
    } else {
      // Insert new video
      const { error } = await supabase.from('videos').insert({
        level_id: levelId,
        section_id: defaultSection?.id || null,
        vimeo_video_id: vimeoVideoId,
        title: video.name,
        description: video.description,
        thumbnail_url: thumbnailUrl,
        duration_seconds: video.duration,
        vimeo_player_url: video.player_embed_url,
        sort_order: nextSortOrder++,
      });

      if (error) {
        console.error(`Error inserting video:`, error);
      } else {
        videosAdded++;
      }
    }
  }

  // Soft-delete videos removed from Vimeo (set is_active = false)
  let videosDeactivated = 0;
  for (const [vimeoVideoId, existing] of existingVideoMap) {
    if (!vimeoVideoIds.has(vimeoVideoId)) {
      const { error } = await supabase
        .from('videos')
        .update({ is_active: false })
        .eq('id', existing.id);

      if (!error) videosDeactivated++;
    }
  }

  // Log sync result
  const status = videosDeactivated > 0 ? 'partial' : 'success';
  await supabase.from('vimeo_sync_log').insert({
    level_id: levelId,
    status,
    videos_added: videosAdded,
    videos_updated: videosUpdated,
    videos_deactivated: videosDeactivated,
  });

  console.log(`Sync complete: +${videosAdded}, ~${videosUpdated}, -${videosDeactivated}`);

  return {
    videosAdded,
    videosUpdated,
    videosDeactivated,
  };
}
