import { useEffect, useState, useMemo, useRef } from 'react';
import { Loader2, SkipBack, SkipForward, Play, Pause, Square, Search, Settings2, ChevronDown, ChevronUp, RotateCcw, Check, Music2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatTime } from '@/lib/formatTime';
import { TRANSPOSITION_OPTIONS } from './TranspositionSelector';

interface AudioLevel { id: string; name: string; }
interface Track {
  id: string;
  display_name: string;
  storage_url: string;
  duration_seconds?: number;
  position?: number;
}

export function AudioPlayer() {
  const [levels, setLevels] = useState<AudioLevel[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isLoadingLevels, setIsLoadingLevels] = useState(true);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLoop, setShowLoop] = useState(false);
  const [showAllTracks, setShowAllTracks] = useState(false);

  const TRACKS_PREVIEW = 5;

  const player = useAudioPlayer();
  const displayTracks = searchQuery.trim() ? searchResults : tracks;
  const isSearchMode = searchQuery.trim().length > 0;

  // Search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const searchSongs = async () => {
      setIsSearching(true);
      const { data } = await supabase
        .from('audio_files')
        .select('id, display_name, storage_url, duration_seconds')
        .ilike('display_name', `%${searchQuery}%`)
        .order('display_name', { ascending: true })
        .limit(50);
      setSearchResults(data || []);
      setIsSearching(false);
    };
    const id = setTimeout(searchSongs, 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // Load levels
  useEffect(() => {
    const fetchLevels = async () => {
      setIsLoadingLevels(true);
      const { data } = await supabase.from('audio_levels').select('id, name').order('created_at', { ascending: true });
      setLevels(data || []);
      if (data && data.length > 0) setSelectedLevelId(data[0].id);
      setIsLoadingLevels(false);
    };
    fetchLevels();
  }, []);

  // Load tracks
  useEffect(() => {
    if (!selectedLevelId) { setTracks([]); return; }
    const fetchTracks = async () => {
      setIsLoadingTracks(true);
      const { data } = await supabase
        .from('audio_level_items')
        .select(`position, audio_files(id, display_name, storage_url, duration_seconds)`)
        .eq('level_id', selectedLevelId)
        .order('position', { ascending: true });
      const mapped = (data || [])
        .filter((i: any) => i.audio_files)
        .map((i: any) => ({
          id: i.audio_files.id,
          display_name: i.audio_files.display_name,
          storage_url: i.audio_files.storage_url,
          duration_seconds: i.audio_files.duration_seconds,
          position: i.position,
        }));
      setTracks(mapped);
      setShowAllTracks(false);
      setIsLoadingTracks(false);
    };
    fetchTracks();
  }, [selectedLevelId]);

  const currentTrackIndex = useMemo(() => {
    if (!player.currentTrack) return -1;
    return tracks.findIndex((t) => t.id === player.currentTrack?.id);
  }, [tracks, player.currentTrack]);

  const progressPercent = player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0;
  const loopStartPercent = player.duration > 0 ? (player.loop.start / player.duration) * 100 : 0;
  const loopEndPercent = player.duration > 0 ? (player.loop.end / player.duration) * 100 : 100;

  const selectedLevel = levels.find(l => l.id === selectedLevelId);

  return (
    <div
      className="flex h-full"
      style={{ background: 'rgba(8,16,42,0.97)' }}
    >
      {/* ── LEFT COLUMN: Level list ── */}
      <div
        className="w-56 flex-shrink-0 flex flex-col border-r"
        style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(6,12,35,0.6)' }}
      >
        {/* Left header */}
        <div className="px-4 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <Music2 className="w-4 h-4" style={{ color: 'hsl(212 100% 65%)' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Levels</span>
          </div>
        </div>

        {/* Level list */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin">
          {isLoadingLevels ? (
            <div className="space-y-1 px-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-9 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.07)' }} />
              ))}
            </div>
          ) : (
            levels.map(l => {
              const isSelected = selectedLevelId === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => { setSelectedLevelId(l.id); player.stop(); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl mb-0.5 text-left text-sm transition-all hover:bg-white/5"
                  style={isSelected
                    ? { background: 'rgba(30,134,255,0.22)', color: 'white', fontWeight: 600, border: '1px solid rgba(30,134,255,0.35)' }
                    : { background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid transparent' }}
                >
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'hsl(212 100% 65%)' }} />
                  )}
                  <span className="truncate">{l.name}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT COLUMN: Tracks + Player ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Top bar ── */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-2 flex-shrink-0">
          {/* Current level name */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{selectedLevel?.name ?? 'Level wählen'}</p>
            {!isSearchMode && (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{tracks.length} Tracks</p>
            )}
          </div>

          {/* Search button */}
          <button
            onClick={() => { setShowSearch(!showSearch); setShowSettings(false); }}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
            style={{
              background: showSearch ? 'rgba(30,134,255,0.4)' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Search className="w-4 h-4 text-white" />
          </button>

          {/* Settings button */}
          <button
            onClick={() => { setShowSettings(!showSettings); setShowSearch(false); }}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
            style={{
              background: showSettings ? 'rgba(30,134,255,0.4)' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Settings2 className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* ── Search input ── */}
        {showSearch && (
          <div className="px-4 pb-2 flex-shrink-0">
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Titel suchen..."
              className="w-full text-white placeholder-white/40 text-sm rounded-xl px-4 py-2.5 outline-none"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)' }}
            />
          </div>
        )}

        {/* ── Settings panel ── */}
        {showSettings && (
          <div className="mx-4 mb-2 rounded-xl p-3 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Transposition</p>
            <div className="flex flex-wrap gap-1.5">
              {TRANSPOSITION_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { player.setTranspositionId(opt.id); setShowSettings(false); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={player.transpositionId === opt.id
                    ? { background: 'hsl(48 100% 50%)', color: '#000' }
                    : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                >
                  {player.transpositionId === opt.id && <Check className="w-3 h-3" />}
                  {opt.label.replace('Trompete in ', '').replace('Horn in ', 'Horn ').replace(' (STANDARD)', '')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Search info ── */}
        {isSearchMode && (
          <div className="px-4 pb-1 flex-shrink-0">
            <p className="text-white/40 text-xs">
              {isSearching ? 'Suche...' : `${searchResults.length} Ergebnis${searchResults.length !== 1 ? 'se' : ''}`}
            </p>
          </div>
        )}

        {/* ── Track list — scrollable ── */}
        <div className="flex-1 overflow-y-auto px-4 min-h-0 py-1 scrollbar-thin">
          {(isSearchMode ? isSearching : isLoadingTracks) ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="w-5 h-5 animate-spin text-white/40" />
            </div>
          ) : displayTracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 gap-2">
              <p className="text-white/30 text-sm">{isSearchMode ? 'Keine Ergebnisse' : 'Keine Tracks in diesem Level'}</p>
            </div>
          ) : (() => {
            const visibleTracks = isSearchMode || showAllTracks ? displayTracks : displayTracks.slice(0, TRACKS_PREVIEW);
            const hasMore = !isSearchMode && displayTracks.length > TRACKS_PREVIEW;
            return (
              <>
                {visibleTracks.map((track, i) => {
                  const isActive = player.currentTrack?.id === track.id;
                  return (
                    <button
                      key={track.id}
                      onClick={() => player.loadTrack(track)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-left transition-all hover:bg-white/5"
                      style={isActive
                        ? { background: 'rgba(30,134,255,0.22)', border: '1px solid rgba(30,134,255,0.35)' }
                        : { background: 'rgba(255,255,255,0.03)', border: '1px solid transparent' }}
                    >
                      <span
                        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                        style={isActive
                          ? { background: 'hsl(212 100% 56%)', color: 'white' }
                          : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
                      >
                        {isActive && player.isPlaying ? '▶' : i + 1}
                      </span>
                      <span className="flex-1 text-sm font-medium truncate" style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.75)' }}>
                        {track.display_name}
                      </span>
                      {track.duration_seconds && (
                        <span className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          {formatTime(track.duration_seconds)}
                        </span>
                      )}
                    </button>
                  );
                })}
                {hasMore && (
                  <button
                    onClick={() => setShowAllTracks(v => !v)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl mb-1 text-sm font-semibold transition-all hover:bg-white/5"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
                  >
                    {showAllTracks
                      ? <><ChevronUp className="w-4 h-4" /> Weniger anzeigen</>
                      : <><ChevronDown className="w-4 h-4" /> {displayTracks.length - TRACKS_PREVIEW} weitere Tracks</>}
                  </button>
                )}
              </>
            );
          })()}
        </div>

        {/* ── Player — fixed bottom panel ── */}
        <div
          className="flex-shrink-0 px-5 pb-5 pt-4 space-y-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(6,12,35,0.98)' }}
        >
          {/* Now playing */}
          {player.currentTrack && (
            <div className="flex items-center gap-2 min-w-0">
              {player.isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-white/50 flex-shrink-0" />}
              <p className="text-white text-sm font-semibold truncate flex-1">{player.currentTrack.display_name}</p>
            </div>
          )}

          {/* Progress bar */}
          <div className="space-y-1">
            <div
              className="relative h-3 rounded-full cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.12)' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                player.seek((x / rect.width) * player.duration);
              }}
            >
              {player.loop.enabled && player.duration > 0 && (
                <div
                  className="absolute top-0 h-full rounded-full"
                  style={{ left: `${loopStartPercent}%`, width: `${loopEndPercent - loopStartPercent}%`, background: 'rgba(255,204,0,0.25)' }}
                />
              )}
              <div
                className="absolute top-0 left-0 h-full rounded-full"
                style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, hsl(212 100% 56%), hsl(218 88% 46%))' }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-lg"
                style={{ left: `calc(${progressPercent}% - 8px)`, background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
              />
            </div>
            <div className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <span>{formatTime(player.currentTime)}</span>
              <span>{formatTime(player.duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-5">
            <button
              onClick={() => currentTrackIndex > 0 && player.loadTrack(tracks[currentTrackIndex - 1])}
              disabled={currentTrackIndex <= 0}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={player.stop}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={player.togglePlay}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all"
              style={{
                background: 'linear-gradient(135deg, hsl(212 100% 56%), hsl(218 88% 42%))',
                color: 'white',
                boxShadow: '0 4px 24px rgba(30,134,255,0.55)',
              }}
            >
              {player.isPlaying
                ? <Pause className="w-7 h-7" />
                : <Play className="w-7 h-7 ml-0.5" />}
            </button>
            <button
              onClick={() => currentTrackIndex < tracks.length - 1 && player.loadTrack(tracks[currentTrackIndex + 1])}
              disabled={currentTrackIndex >= tracks.length - 1}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Tempo + Loop row */}
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Tempo</span>
                <span className="text-xs font-bold" style={{ color: 'hsl(48 100% 50%)' }}>{player.tempo}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={150}
                value={player.tempo}
                onChange={e => player.setTempo(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, hsl(212 100% 56%) ${(player.tempo - 50) / 100 * 100}%, rgba(255,255,255,0.15) ${(player.tempo - 50) / 100 * 100}%)`,
                }}
              />
            </div>
            {player.tempo !== 100 && (
              <button
                onClick={() => player.setTempo(100)}
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Loop A-B toggle */}
          <button
            onClick={() => setShowLoop(!showLoop)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={player.loop.enabled
              ? { background: 'rgba(255,204,0,0.12)', border: '1px solid rgba(255,204,0,0.3)', color: 'hsl(48 100% 50%)' }
              : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wide">A–B Loop</span>
              {player.loop.enabled && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'hsl(48 100% 50%)', color: '#000' }}>AN</span>
              )}
            </div>
            {showLoop ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showLoop && (
            <div className="rounded-xl p-3 space-y-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Loop aktivieren</span>
                <button
                  onClick={player.toggleLoopEnabled}
                  className="w-10 h-5 rounded-full transition-all relative"
                  style={{ background: player.loop.enabled ? 'hsl(212 100% 56%)' : 'rgba(255,255,255,0.15)' }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                    style={{ left: player.loop.enabled ? '22px' : '2px' }}
                  />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={player.setLoopStartToCurrent}
                  className="py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: 'rgba(30,134,255,0.2)', color: 'hsl(212 100% 70%)', border: '1px solid rgba(30,134,255,0.3)' }}
                >
                  ◀ Start setzen<br />
                  <span className="font-normal opacity-70">{formatTime(player.loop.start)}</span>
                </button>
                <button
                  onClick={player.setLoopEndToCurrent}
                  className="py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: 'rgba(30,134,255,0.2)', color: 'hsl(212 100% 70%)', border: '1px solid rgba(30,134,255,0.3)' }}
                >
                  Ende setzen ▶<br />
                  <span className="font-normal opacity-70">{formatTime(player.loop.end)}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
