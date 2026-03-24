import { useEffect, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { AudioLevelSelector } from './AudioLevelSelector';
import { TrackList } from './TrackList';
import { TrackSearch } from './TrackSearch';
import { PlayerControls } from './PlayerControls';
import { ProgressBar } from './ProgressBar';
import { TempoSlider } from './TempoSlider';
import { CollapsibleLoopControls } from './CollapsibleLoopControls';
import { SettingsPanel } from './SettingsPanel';

interface AudioLevel {
  id: string;
  name: string;
}

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

  const player = useAudioPlayer();

  const displayTracks = searchQuery.trim() ? searchResults : tracks;
  const isSearchMode = searchQuery.trim().length > 0;

  // Search songs
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const searchSongs = async () => {
      setIsSearching(true);
      const { data, error } = await supabase
        .from('audio_files')
        .select('id, display_name, storage_url, duration_seconds')
        .ilike('display_name', `%${searchQuery}%`)
        .order('display_name', { ascending: true })
        .limit(50);
      if (error) {
        console.error('Error searching songs:', error);
        setSearchResults([]);
      } else {
        setSearchResults(data || []);
      }
      setIsSearching(false);
    };
    const timeoutId = setTimeout(searchSongs, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Load levels
  useEffect(() => {
    const fetchLevels = async () => {
      setIsLoadingLevels(true);
      const { data, error } = await supabase
        .from('audio_levels')
        .select('id, name')
        .order('created_at', { ascending: true });
      if (error) {
        console.error('Error fetching audio levels:', error);
      } else {
        setLevels(data || []);
        if (data && data.length > 0 && !selectedLevelId) {
          setSelectedLevelId(data[0].id);
        }
      }
      setIsLoadingLevels(false);
    };
    fetchLevels();
  }, []);

  // Load tracks when level changes
  useEffect(() => {
    if (!selectedLevelId) {
      setTracks([]);
      return;
    }
    const fetchTracks = async () => {
      setIsLoadingTracks(true);
      const { data, error } = await supabase
        .from('audio_level_items')
        .select(`
          position,
          audio_files (
            id,
            display_name,
            storage_url,
            duration_seconds
          )
        `)
        .eq('level_id', selectedLevelId)
        .order('position', { ascending: true });
      if (error) {
        console.error('Error fetching tracks:', error);
        setTracks([]);
      } else {
        const mappedTracks = (data || [])
          .filter((item) => item.audio_files)
          .map((item: any) => ({
            id: item.audio_files.id,
            display_name: item.audio_files.display_name,
            storage_url: item.audio_files.storage_url,
            duration_seconds: item.audio_files.duration_seconds,
            position: item.position,
          }));
        setTracks(mappedTracks);
      }
      setIsLoadingTracks(false);
    };
    fetchTracks();
  }, [selectedLevelId]);

  const currentTrackIndex = useMemo(() => {
    if (!player.currentTrack) return -1;
    return tracks.findIndex((t) => t.id === player.currentTrack?.id);
  }, [tracks, player.currentTrack]);

  const handlePrev = () => {
    if (currentTrackIndex > 0) player.loadTrack(tracks[currentTrackIndex - 1]);
  };

  const handleNext = () => {
    if (currentTrackIndex < tracks.length - 1) player.loadTrack(tracks[currentTrackIndex + 1]);
  };

  const handleLevelChange = (levelId: string) => {
    setSelectedLevelId(levelId);
    player.stop();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header row with search and settings */}
      <div className="flex items-center gap-2 px-4 pt-4">
        <div className="flex-1">
          <TrackSearch value={searchQuery} onChange={setSearchQuery} />
        </div>
        <SettingsPanel
          transpositionId={player.transpositionId}
          onTranspositionChange={player.setTranspositionId}
        />
      </div>

      {/* Level Selector - hidden during search */}
      {!isSearchMode && (
        <div className="p-4 border-b border-border">
          <AudioLevelSelector
            levels={levels}
            selectedLevelId={selectedLevelId}
            onLevelChange={handleLevelChange}
            isLoading={isLoadingLevels}
          />
        </div>
      )}

      {/* Search mode indicator */}
      {isSearchMode && (
        <div className="px-4 py-2 border-b border-border">
          <p className="text-sm text-muted-foreground">
            {isSearching ? 'Suche...' : `${searchResults.length} Ergebnis${searchResults.length !== 1 ? 'se' : ''} gefunden`}
          </p>
        </div>
      )}

      {/* Track List */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        <TrackList
          tracks={displayTracks}
          currentTrackId={player.currentTrack?.id ?? null}
          onTrackSelect={(track) => player.loadTrack(track)}
          isLoading={isSearchMode ? isSearching : isLoadingTracks}
        />
      </div>

      {/* Player Panel */}
      <div className="border-t border-border bg-player-surface p-4 space-y-4">
        {player.currentTrack && (
          <div className="text-center flex items-center justify-center gap-2">
            {player.isLoading && <Loader2 className="w-4 h-4 animate-spin text-gold" />}
            <p className="font-bold truncate">{player.currentTrack.display_name}</p>
          </div>
        )}

        <ProgressBar
          currentTime={player.currentTime}
          duration={player.duration}
          onSeek={player.seek}
          loopStart={player.loop.start}
          loopEnd={player.loop.end}
          loopEnabled={player.loop.enabled}
          onLoopStartChange={player.setLoopStart}
          onLoopEndChange={player.setLoopEnd}
        />

        <PlayerControls
          isPlaying={player.isPlaying}
          onTogglePlay={player.togglePlay}
          onStop={player.stop}
          onPrev={handlePrev}
          onNext={handleNext}
          hasPrev={currentTrackIndex > 0}
          hasNext={currentTrackIndex < tracks.length - 1}
        />

        <TempoSlider tempo={player.tempo} onTempoChange={player.setTempo} />

        <CollapsibleLoopControls
          loopEnabled={player.loop.enabled}
          loopStart={player.loop.start}
          loopEnd={player.loop.end}
          onToggleLoop={player.toggleLoopEnabled}
          onSetLoopStart={player.setLoopStartToCurrent}
          onSetLoopEnd={player.setLoopEndToCurrent}
        />
      </div>
    </div>
  );
}
