import { useEffect, useState, useRef } from 'react';
import { Loader2, Search, ChevronDown, ChevronUp, Check, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { useDailyUsage } from '@/hooks/useDailyUsage';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { DailyLimitOverlay } from '@/components/premium/DailyLimitOverlay';
import { formatTime } from '@/lib/formatTime';
import type { Video } from '@/types';

interface LevelRow {
  id: string;
  title: string;
  title_en?: string | null;
  title_es?: string | null;
  sort_order: number;
}

interface VideoRow {
  id: string;
  title: string;
  title_en?: string | null;
  title_es?: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  vimeo_video_id: string;
  vimeo_player_url?: string | null;
  level_id: string;
  sort_order: number;
}

const PREVIEW = 5;

const TEXTS = {
  de: { selectLevel: 'Level wählen', search: 'Titel suchen...', noResults: 'Keine Ergebnisse', noVideos: 'Keine Videos', loading: 'Suche...', moreTracks: (n: number) => `${n} weitere Videos`, less: 'Weniger anzeigen' },
  en: { selectLevel: 'Choose level', search: 'Search title...', noResults: 'No results', noVideos: 'No videos', loading: 'Searching...', moreTracks: (n: number) => `${n} more videos`, less: 'Show less' },
  es: { selectLevel: 'Elegir nivel', search: 'Buscar título...', noResults: 'Sin resultados', noVideos: 'Sin videos', loading: 'Buscando...', moreTracks: (n: number) => `${n} videos más`, less: 'Mostrar menos' },
  sl: { selectLevel: 'Level wählen', search: 'Titel suchen...', noResults: 'Keine Ergebnisse', noVideos: 'Keine Videos', loading: 'Suche...', moreTracks: (n: number) => `${n} weitere Videos`, less: 'Weniger anzeigen' },
};

export function MobileVideoPlayer() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { canStartVideo, recordVideoStart } = useDailyUsage();
  const t = TEXTS[language as keyof typeof TEXTS] || TEXTS.de;

  const [levels, setLevels] = useState<LevelRow[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [searchResults, setSearchResults] = useState<VideoRow[]>([]);
  const [isLoadingLevels, setIsLoadingLevels] = useState(true);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoRow | null>(null);
  const [limitOpen, setLimitOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const langFilter = language === 'en' ? 'en' : language === 'es' ? 'es' : 'de';

  const getTitle = (item: { title: string; title_en?: string | null; title_es?: string | null }) => {
    if (language === 'en' && item.title_en) return item.title_en;
    if (language === 'es' && item.title_es) return item.title_es;
    return item.title;
  };

  // Load levels
  useEffect(() => {
    const fetchLevels = async () => {
      setIsLoadingLevels(true);
      const { data } = await supabase
        .from('levels')
        .select('id, title, title_en, title_es, sort_order')
        .eq('is_active', true)
        .or(`language.eq.${langFilter},language.eq.all,language.is.null`)
        .order('sort_order', { ascending: true });
      const list = (data || []) as LevelRow[];
      setLevels(list);
      if (list.length > 0) setSelectedLevelId(list[0].id);
      setIsLoadingLevels(false);
    };
    fetchLevels();
  }, [langFilter]);

  // Load videos for selected level
  useEffect(() => {
    if (!selectedLevelId) { setVideos([]); return; }
    const fetchVideos = async () => {
      setIsLoadingVideos(true);
      const { data } = await supabase
        .from('videos')
        .select('id, title, title_en, title_es, thumbnail_url, duration_seconds, vimeo_video_id, vimeo_player_url, level_id, sort_order')
        .eq('is_active', true)
        .eq('level_id', selectedLevelId)
        .order('sort_order', { ascending: true });
      setVideos((data || []) as VideoRow[]);
      setShowAll(false);
      setIsLoadingVideos(false);
    };
    fetchVideos();
  }, [selectedLevelId]);

  // Search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const run = async () => {
      setIsSearching(true);
      const q = `%${searchQuery}%`;
      const { data } = await supabase
        .from('videos')
        .select('id, title, title_en, title_es, thumbnail_url, duration_seconds, vimeo_video_id, vimeo_player_url, level_id, sort_order')
        .eq('is_active', true)
        .or(`title.ilike.${q},title_en.ilike.${q},title_es.ilike.${q}`)
        .order('title', { ascending: true })
        .limit(50);
      setSearchResults((data || []) as VideoRow[]);
      setIsSearching(false);
    };
    const id = setTimeout(run, 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowLevelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isSearchMode = searchQuery.trim().length > 0;
  const display = isSearchMode ? searchResults : videos;
  const selectedLevel = levels.find(l => l.id === selectedLevelId);

  const handleVideoClick = async (v: VideoRow) => {
    if (!canStartVideo()) {
      setLimitOpen(true);
      return;
    }
    const allowed = await recordVideoStart();
    if (allowed) {
      setSelectedVideo(v);
    } else {
      setLimitOpen(true);
    }
  };

  const toVideoType = (v: VideoRow): Video => ({
    id: v.id,
    title: getTitle(v),
    thumbnail: v.thumbnail_url || '',
    duration: v.duration_seconds || 0,
    vimeoId: v.vimeo_video_id,
    completions: 0,
  });

  return (
    <div className="flex flex-col h-full" style={{ background: 'rgba(10,20,50,0.92)', borderRadius: '1rem' }}>

      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 flex-shrink-0">
        <div className="relative flex-1" ref={dropdownRef}>
          <button
            onClick={() => { setShowLevelDropdown(v => !v); setShowSearch(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: showLevelDropdown ? 'rgba(30,134,255,0.3)' : 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            {isLoadingLevels
              ? <div className="h-4 w-20 rounded bg-white/20 animate-pulse" />
              : <span className="flex-1 text-left truncate">{selectedLevel ? getTitle(selectedLevel) : t.selectLevel}</span>
            }
            <ChevronDown className="w-4 h-4 flex-shrink-0 opacity-60" style={{ transform: showLevelDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {showLevelDropdown && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
              style={{ background: 'rgba(15,25,60,0.98)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 16px 40px rgba(0,0,0,0.6)', maxHeight: 240, overflowY: 'auto' }}
            >
              {levels.map(l => (
                <button
                  key={l.id}
                  onClick={() => { setSelectedLevelId(l.id); setShowLevelDropdown(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-all"
                  style={selectedLevelId === l.id
                    ? { background: 'rgba(30,134,255,0.25)', color: 'white', fontWeight: 600 }
                    : { background: 'transparent', color: 'rgba(255,255,255,0.65)' }}
                >
                  {selectedLevelId === l.id && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'hsl(212 100% 70%)' }} />}
                  <span className={selectedLevelId === l.id ? '' : 'ml-5'}>{getTitle(l)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => { setShowSearch(s => !s); setShowLevelDropdown(false); }}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
          style={{ background: showSearch ? 'rgba(30,134,255,0.4)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <Search className="w-4 h-4 text-white" />
        </button>
      </div>

      {showSearch && (
        <div className="px-3 pb-2 flex-shrink-0">
          <input
            autoFocus
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.search}
            className="w-full bg-white/10 text-white placeholder-white/40 text-sm rounded-xl px-3 py-2 outline-none border border-white/20 focus:border-white/40"
          />
        </div>
      )}

      {isSearchMode && (
        <div className="px-4 pb-2 flex-shrink-0">
          <p className="text-white/40 text-xs">
            {isSearching ? t.loading : `${searchResults.length}`}
          </p>
        </div>
      )}

      {/* Video list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0 scrollbar-thin">
        {(isSearchMode ? isSearching : isLoadingVideos) ? (
          <div className="flex items-center justify-center h-20">
            <Loader2 className="w-5 h-5 animate-spin text-white/40" />
          </div>
        ) : display.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-20 gap-2">
            <p className="text-white/30 text-sm">{isSearchMode ? t.noResults : t.noVideos}</p>
          </div>
        ) : (() => {
          const visible = isSearchMode || showAll ? display : display.slice(0, PREVIEW);
          const hasMore = !isSearchMode && display.length > PREVIEW;
          return (
            <>
              {visible.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => handleVideoClick(v)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-xl mb-1 text-left transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid transparent' }}
                >
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0 w-16 h-10 rounded-md overflow-hidden bg-black/40">
                    {v.thumbnail_url ? (
                      <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-4 h-4 text-white/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-4 h-4 text-white drop-shadow" fill="currentColor" />
                    </div>
                  </div>

                  <span className="flex-1 text-sm font-medium truncate text-white/85">
                    {getTitle(v)}
                  </span>
                  {v.duration_seconds ? (
                    <span className="text-xs flex-shrink-0 text-white/35">
                      {formatTime(v.duration_seconds)}
                    </span>
                  ) : null}
                </button>
              ))}
              {hasMore && (
                <button
                  onClick={() => setShowAll(s => !s)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl mb-1 text-sm font-semibold transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}
                >
                  {showAll
                    ? <><ChevronUp className="w-4 h-4" /> {t.less}</>
                    : <><ChevronDown className="w-4 h-4" /> {t.moreTracks(display.length - PREVIEW)}</>}
                </button>
              )}
            </>
          );
        })()}
      </div>

      {/* Fullscreen player */}
      {selectedVideo && (
        <VideoPlayer
          video={toVideoType(selectedVideo)}
          levelId={selectedVideo.level_id}
          levelTitle={selectedLevel ? getTitle(selectedLevel) : undefined}
          onClose={() => setSelectedVideo(null)}
          onComplete={() => { /* star handled inside VideoPlayer */ }}
        />
      )}

      <DailyLimitOverlay
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        type="video"
      />
    </div>
  );
}
