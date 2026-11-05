import { useEffect, useState, useMemo } from 'react';
import { Loader2, SkipBack, SkipForward, Play, Pause, Square, Search, X, Settings2, ChevronDown, ChevronUp, RotateCcw, Check, Music2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatTime } from '@/lib/formatTime';
import { useLanguage } from '@/hooks/useLanguage';
import { PRACTICE_COPY } from '@/i18n/practice-tools';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
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
  const [showSettings, setShowSettings] = useState(false);
  const [showLoop, setShowLoop] = useState(false);

  const { t, language } = useLanguage();
  const copy = PRACTICE_COPY[language];
  const instrumentNames: Record<string, string> = { concert: copy.concert, 'trumpet-c': copy.trumpetC, 'horn-f': copy.hornF, 'horn-eb': copy.hornEb, tenorhorn: copy.tenorhorn };

  const player = useAudioPlayer();
  const displayTracks = searchQuery.trim() ? searchResults : tracks;
  const isSearchMode = searchQuery.trim().length > 0;

  // Search
  useEffect(() => {
    let cancelled = false;
    const query = searchQuery.trim();
    if (!query) { setSearchResults([]); setIsSearching(false); return; }
    setIsSearching(true);
    const searchSongs = async () => {
      const results: Track[] = [];
      const pageSize = 1000;
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await supabase
        .from('audio_files')
        .select('id, display_name, storage_url, duration_seconds')
        .ilike('display_name', `%${query.replace(/[\\%_]/g, '\\$&')}%`)
        .order('display_name', { ascending: true })
        .order('id', { ascending: true })
        .range(offset, offset + pageSize - 1);
        if (cancelled) return;
        if (error) break;
        results.push(...(data || []));
        if (!data || data.length < pageSize) break;
      }
      if (!cancelled) { setSearchResults(results); setIsSearching(false); }
    };
    const id = setTimeout(searchSongs, 300);
    return () => { cancelled = true; clearTimeout(id); };
  }, [searchQuery]);

  // Load levels
  useEffect(() => {
    const fetchLevels = async () => {
      setIsLoadingLevels(true);
      const { data } = await supabase.from('audio_levels').select('id, name').order('sort_order', { ascending: true });
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
      setIsLoadingTracks(false);
    };
    fetchTracks();
  }, [selectedLevelId]);

  const currentTrackIndex = useMemo(() => {
    if (!player.currentTrack) return -1;
    return displayTracks.findIndex((t) => t.id === player.currentTrack?.id);
  }, [displayTracks, player.currentTrack]);

  const loopStartPercent = player.duration > 0 ? (player.loop.start / player.duration) * 100 : 0;
  const loopEndPercent = player.duration > 0 ? (player.loop.end / player.duration) * 100 : 100;

  const selectedLevel = levels.find(l => l.id === selectedLevelId);

  return (
    <div className="ts-light-module ts-audio-player flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <Search className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
        <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} aria-label={t('common.search')} placeholder={copy.searchPlaceholder} className="bg-card flex-1 min-w-0" />
        {searchQuery && <Button variant="ghost" size="icon" aria-label={t('common.clear')} title={t('common.clear')} onClick={() => setSearchQuery('')}><X className="h-4 w-4" /></Button>}
      </div>
      <div className="flex flex-1 min-h-0 flex-col md:flex-row overflow-hidden">
      <aside className="shrink-0 border-b md:border-b-0 md:border-r border-border bg-card md:w-56 md:flex md:flex-col md:min-h-0">
        <div className="flex items-center gap-2 px-4 pt-4 pb-2 text-muted-foreground">
          <Music2 className="w-4 h-4 text-primary" /><h2 className="text-sm font-bold uppercase">{t('levels.title')}</h2>
        </div>
        <nav aria-label={t('levels.title')} className="flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden px-3 pb-3 md:flex-1 md:min-h-0">
          {isLoadingLevels ? <Loader2 className="w-5 h-5 animate-spin m-3" /> : levels.map(level => (
            <Button key={level.id} variant="ghost" onClick={() => { setSelectedLevelId(level.id); player.stop(); }}
              aria-pressed={selectedLevelId === level.id}
              className={`shrink-0 md:shrink md:w-full justify-start h-auto min-h-11 px-3 py-2 rounded-lg text-sm md:whitespace-normal md:text-left ${selectedLevelId === level.id ? 'bg-secondary text-primary font-semibold hover:bg-secondary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              {level.name}
            </Button>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-base break-words">{isSearchMode ? t('common.search') : selectedLevel?.name ?? copy.chooseLevel}</h2>
            {!isSearchMode && <p className="text-sm text-muted-foreground">{tracks.length} {copy.tracks}</p>}
          </div>
          <Button variant="secondary" size="icon" aria-label={copy.settings} title={copy.settings} aria-pressed={showSettings}
            onClick={() => setShowSettings(!showSettings)}><Settings2 /></Button>
        </div>
        {showSettings && <section className="mx-4 mb-2 border-b border-border pb-3 shrink-0">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">{copy.transposition}</h3>
          <div className="flex flex-wrap gap-1.5">{TRANSPOSITION_OPTIONS.map(opt => (
            <Button key={opt.id} variant="secondary" size="sm" aria-pressed={player.transpositionId === opt.id}
              onClick={() => { player.setTranspositionId(opt.id); setShowSettings(false); }}
              className={player.transpositionId === opt.id ? 'bg-gold text-gold-foreground hover:bg-gold/90' : ''}>
              {player.transpositionId === opt.id && <Check />}{instrumentNames[opt.id]}
            </Button>
          ))}</div>
        </section>}
        {isSearchMode && <p className="px-4 text-sm text-muted-foreground shrink-0">{isSearching ? t('common.loading') : t('common.resultsCount', { count: searchResults.length })}</p>}
        <div className="flex-1 overflow-y-auto px-4 min-h-0 py-1">
          {(isSearchMode ? isSearching : isLoadingTracks) ? <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            : displayTracks.length === 0 ? <p className="text-muted-foreground text-sm py-8 text-center">{isSearchMode ? t('common.noResults') : copy.noTracks}</p>
            : displayTracks.map((track, index) => {
              const active = player.currentTrack?.id === track.id;
              return <Button key={track.id} variant="ghost" aria-pressed={active} onClick={() => player.loadTrack(track)}
                className={`w-full justify-start gap-3 h-auto min-h-14 px-3 py-3 rounded-lg mb-1 text-left whitespace-normal ${active ? 'bg-secondary hover:bg-secondary text-primary' : 'bg-card hover:bg-muted text-foreground'}`}>
                <span className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {active && player.isPlaying ? <Play className="!size-3" /> : index + 1}
                </span>
                <span className="flex-1 min-w-0 break-words">{track.display_name}</span>
                {!!track.duration_seconds && <span className="text-sm text-muted-foreground shrink-0 tabular-nums">{formatTime(track.duration_seconds)}</span>}
              </Button>;
            })}
        </div>
        <section aria-label={t('navigation.audios')} className="shrink-0 px-4 pt-3 pb-4 border-t border-border bg-card space-y-3">
          {player.currentTrack && <div className="flex gap-2 items-center min-w-0">
            {player.isLoading && <Loader2 className="size-4 animate-spin shrink-0" />}
            <p className="text-base font-semibold break-words">{player.currentTrack.display_name}</p>
          </div>}
          <div className="space-y-2">
            <div className="relative">
              {player.loop.enabled && player.duration > 0 && <div className="absolute top-1/2 -translate-y-1/2 h-2 bg-gold/30 rounded-full pointer-events-none" style={{ left: `${loopStartPercent}%`, width: `${loopEndPercent - loopStartPercent}%` }} />}
              <Slider aria-label={t('player.selectTrack')} value={[player.currentTime]} min={0} max={player.duration || 1} step={0.1} disabled={!player.currentTrack || player.isLoading} onValueChange={([value]) => player.seek(value)} />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground tabular-nums"><span>{formatTime(player.currentTime)}</span><span>{formatTime(player.duration)}</span></div>
          </div>
          <div className="flex items-center justify-center gap-3 md:gap-5">
            <Button variant="secondary" size="icon" title={copy.previous} aria-label={copy.previous} disabled={currentTrackIndex <= 0} onClick={() => currentTrackIndex > 0 && player.loadTrack(displayTracks[currentTrackIndex - 1])} className="rounded-full"><SkipBack /></Button>
            <Button variant="secondary" size="icon" title={t('player.stop')} aria-label={t('player.stop')} disabled={!player.currentTrack} onClick={player.stop} className="rounded-full"><Square /></Button>
            <Button size="icon" title={t(player.isPlaying ? 'player.pause' : 'player.play')} aria-label={t(player.isPlaying ? 'player.pause' : 'player.play')} disabled={!player.currentTrack || player.isLoading} onClick={player.togglePlay} className="w-14 h-14 rounded-full bg-gold hover:bg-gold/90 text-gold-foreground shadow-sm [&_svg]:size-6">{player.isPlaying ? <Pause /> : <Play />}</Button>
            <Button variant="secondary" size="icon" title={copy.next} aria-label={copy.next} disabled={currentTrackIndex < 0 || currentTrackIndex >= displayTracks.length - 1} onClick={() => currentTrackIndex >= 0 && currentTrackIndex < displayTracks.length - 1 && player.loadTrack(displayTracks[currentTrackIndex + 1])} className="rounded-full"><SkipForward /></Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-2"><div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('player.tempo')}</span><span className="font-bold text-primary tabular-nums">{player.tempo}%</span></div>
              <Slider aria-label={t('player.tempo')} value={[player.tempo]} min={40} max={150} step={1} onValueChange={([value]) => player.setTempo(value)} />
            </div>
            {player.tempo !== 100 && <Button variant="secondary" size="icon" aria-label={copy.resetTempo} title={copy.resetTempo} onClick={() => player.setTempo(100)}><RotateCcw /></Button>}
          </div>
          <Button variant="secondary" onClick={() => setShowLoop(!showLoop)} aria-expanded={showLoop} className="w-full justify-between">
            <span>{copy.loop}{player.loop.enabled && <span className="ml-2 text-primary">{copy.on}</span>}</span>{showLoop ? <ChevronUp /> : <ChevronDown />}
          </Button>
          {showLoop && <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between"><label htmlFor="audio-loop" className="text-sm text-muted-foreground">{copy.enableLoop}</label><Switch id="audio-loop" checked={player.loop.enabled} onCheckedChange={player.toggleLoopEnabled} /></div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={player.setLoopStartToCurrent} disabled={!player.currentTrack} className="h-auto min-h-11 flex-col gap-0 py-2"><span>{copy.loopStart}</span><span className="text-sm font-normal text-muted-foreground">{formatTime(player.loop.start)}</span></Button>
              <Button variant="secondary" onClick={player.setLoopEndToCurrent} disabled={!player.currentTrack} className="h-auto min-h-11 flex-col gap-0 py-2"><span>{copy.loopEnd}</span><span className="text-sm font-normal text-muted-foreground">{formatTime(player.loop.end)}</span></Button>
            </div>
          </div>}
        </section>
      </div>
      </div>
    </div>
  );
}
