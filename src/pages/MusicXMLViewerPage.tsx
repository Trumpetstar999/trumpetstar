import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useUserRole } from '@/hooks/useUserRole';
import { useMidiPlayer } from '@/hooks/useMidiPlayer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { 
  Loader2, 
  X, 
  Play, 
  Pause, 
  Square,
  Volume2,
  Music,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Repeat,
  AlertTriangle,
  RefreshCw,
  Headphones,
  Settings,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PlanKey } from '@/types/plans';

interface MusicXMLDocument {
  id: string;
  title: string;
  xml_file_url: string;
  plan_required: string;
}

interface AudioTrack {
  id: string;
  title: string;
  audio_url: string;
  duration: number | null;
}

export function MusicXMLViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { canAccessLevel } = useMembership();
  const { isAdmin } = useUserRole();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [osmd, setOsmd] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const [isConcertPitch, setIsConcertPitch] = useState(false);
  
  // Playback state
  const [playbackMode, setPlaybackMode] = useState<'midi' | 'audio'>('midi');
  const [tempo, setTempo] = useState(100);
  const [volume, setVolume] = useState(80);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [metronomeVolume, setMetronomeVolume] = useState(50);
  const [countIn, setCountIn] = useState(0);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopStart, setLoopStart] = useState(1);
  const [loopEnd, setLoopEnd] = useState(1);
  const [currentBar, setCurrentBar] = useState(1);
  const [totalBars, setTotalBars] = useState(1);
  const [followMode, setFollowMode] = useState(true);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<AudioTrack | null>(null);
  const [audioIsPlaying, setAudioIsPlaying] = useState(false);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // MIDI Player hook
  const midiPlayer = useMidiPlayer({
    tempo,
    volume,
    loopEnabled,
    loopStart,
    loopEnd,
    onBarChange: (bar) => setCurrentBar(bar),
  });

  const showDebug = searchParams.get('debug') === '1' || isAdmin;

  // Fetch document
  const { data: document, isLoading: docLoading } = useQuery({
    queryKey: ['musicxml-doc', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('musicxml_documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as MusicXMLDocument;
    },
    enabled: !!id,
  });

  // Fetch audio tracks
  const { data: audioTracks = [] } = useQuery({
    queryKey: ['musicxml-audio', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('musicxml_audio_tracks')
        .select('*')
        .eq('musicxml_document_id', id)
        .order('sort_index', { ascending: true });

      if (error) throw error;
      return data as AudioTrack[];
    },
    enabled: !!id,
  });

  // Check access
  const hasAccess = document ? canAccessLevel(document.plan_required as PlanKey) : false;

  // Load OSMD and render
  useEffect(() => {
    if (!document || !containerRef.current || !hasAccess) return;

    const loadOSMD = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        // Dynamically import OSMD
        const { OpenSheetMusicDisplay } = await import('opensheetmusicdisplay');

        // Fetch MusicXML content
        const response = await fetch(document.xml_file_url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Konnte XML nicht laden`);
        }
        const xmlContent = await response.text();

        // Validate XML
        if (!xmlContent.includes('<score-partwise') && !xmlContent.includes('<score-timewise')) {
          throw new Error('Ungültiges MusicXML Format');
        }

        // Create OSMD instance
        const osmdInstance = new OpenSheetMusicDisplay(containerRef.current!, {
          autoResize: true,
          drawTitle: true,
          drawSubtitle: true,
          drawComposer: true,
          drawPartNames: true,
          drawMeasureNumbers: true,
          drawingParameters: 'default',
        });

        await osmdInstance.load(xmlContent);
        osmdInstance.render();

        // Get total bars
        const measures = osmdInstance.Sheet?.SourceMeasures?.length || 1;
        setTotalBars(measures);
        setLoopEnd(measures);

        setOsmd(osmdInstance);
        
        // Initialize MIDI player
        await midiPlayer.initialize();
        
        // Parse sheet for MIDI playback (default 120 BPM)
        midiPlayer.parseOSMDSheet(osmdInstance, 120);
        
        setIsLoading(false);
      } catch (error) {
        console.error('OSMD load error:', error);
        setLoadError((error as Error).message);
        setIsLoading(false);
      }
    };

    loadOSMD();
  }, [document, hasAccess, isConcertPitch]);

  // Handle zoom
  useEffect(() => {
    if (osmd) {
      osmd.Zoom = zoom;
      osmd.render();
    }
  }, [zoom, osmd]);

  // Update audio tempo (playbackRate)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = tempo / 100;
    }
  }, [tempo]);

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Handle close
  const handleClose = () => {
    midiPlayer.stop();
    navigate('/musicxml');
  };

  // Handle retry
  const handleRetry = () => {
    setLoadError(null);
    setIsLoading(true);
    if (osmd) {
      osmd.clear();
      setOsmd(null);
    }
  };

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (playbackMode === 'audio' && audioRef.current) {
      if (audioIsPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    } else {
      // MIDI playback
      if (midiPlayer.isPlaying) {
        midiPlayer.pause();
      } else {
        if (!midiPlayer.isReady) {
          toast.info('MIDI wird initialisiert...');
          midiPlayer.initialize().then(() => {
            if (osmd) {
              midiPlayer.parseOSMDSheet(osmd, 120);
            }
            midiPlayer.play();
          });
        } else {
          midiPlayer.play();
        }
      }
    }
  }, [playbackMode, audioIsPlaying, midiPlayer, osmd]);

  // Stop playback
  const handleStop = useCallback(() => {
    if (playbackMode === 'audio' && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioIsPlaying(false);
    } else {
      midiPlayer.stop();
    }
    setCurrentBar(1);
  }, [playbackMode, midiPlayer]);

  // Audio track selection
  const handleSelectAudioTrack = useCallback((track: AudioTrack) => {
    midiPlayer.stop();
    setSelectedAudioTrack(track);
    setPlaybackMode('audio');
  }, [midiPlayer]);

  // Switch to MIDI mode
  const handleSwitchToMidi = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setAudioIsPlaying(false);
    }
    setPlaybackMode('midi');
  }, []);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get current playing state
  const isPlaying = playbackMode === 'midi' ? midiPlayer.isPlaying : audioIsPlaying;

  // Loading state - Trumpetstar style
  if (docLoading) {
    return (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ 
          background: 'linear-gradient(180deg, hsl(212 100% 56%) 0%, hsl(218 88% 46%) 40%, hsl(222 86% 29%) 100%)'
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full border-4 border-reward-gold border-t-transparent animate-spin" />
          <span className="text-white/70">Noten werden geladen...</span>
        </div>
      </div>
    );
  }

  // Not found state
  if (!document) {
    return (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ 
          background: 'linear-gradient(180deg, hsl(212 100% 56%) 0%, hsl(218 88% 46%) 40%, hsl(222 86% 29%) 100%)'
        }}
      >
        <div className="card-glass flex flex-col items-center gap-4 max-w-md text-center p-8 rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Dokument nicht gefunden</h2>
          <p className="text-gray-600">Das angeforderte Stück konnte nicht gefunden werden.</p>
          <Button onClick={handleClose} className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-full mt-2">
            Zurück zur Übersicht
          </Button>
        </div>
      </div>
    );
  }

  // No access state
  if (!hasAccess) {
    return (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ 
          background: 'linear-gradient(180deg, hsl(212 100% 56%) 0%, hsl(218 88% 46%) 40%, hsl(222 86% 29%) 100%)'
        }}
      >
        <div className="card-glass flex flex-col items-center gap-4 max-w-md text-center p-8 rounded-2xl">
          <div className="w-20 h-20 rounded-full bg-reward-gold/20 flex items-center justify-center">
            <Lock className="w-10 h-10 text-reward-gold" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">{document.title}</h2>
          <p className="text-gray-600">
            Dieses Stück erfordert den <span className="font-semibold text-primary">{document.plan_required}</span>-Plan.
          </p>
          <div className="flex gap-3 mt-2">
            <Button className="gap-2 bg-reward-gold hover:bg-reward-gold/90 text-black rounded-full glow-gold">
              Jetzt upgraden
            </Button>
            <Button variant="outline" onClick={handleClose} className="rounded-full">
              Zurück
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col animate-fade-in"
      style={{ 
        background: 'linear-gradient(180deg, rgba(11, 46, 138, 0.98) 0%, rgba(0, 0, 0, 0.98) 100%)'
      }}
    >
      {/* Close button - Glass style */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-[110] p-3 rounded-full glass hover:bg-white/20 text-white transition-all"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Header - Glass style */}
      <div className="shrink-0 glass px-6 py-3 safe-top flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white truncate max-w-md">
          {document.title}
        </h2>
        
        <div className="flex items-center gap-3">
          {/* Concert Pitch Toggle */}
          <div className="flex items-center gap-2 px-4 py-2 glass rounded-full">
            <span className="text-sm text-white/80">
              {isConcertPitch ? 'Konzertton' : 'B♭ Trompete'}
            </span>
            <Switch
              id="concert-pitch"
              checked={isConcertPitch}
              onCheckedChange={setIsConcertPitch}
              className="data-[state=checked]:bg-reward-gold"
            />
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 px-3 py-1.5 glass rounded-full">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white hover:bg-white/20" 
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-white/80 w-12 text-center font-mono">{Math.round(zoom * 100)}%</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white hover:bg-white/20" 
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white hover:bg-white/20" 
              onClick={() => setZoom(1)}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Score Container */}
      <div className="flex-1 min-h-0 overflow-auto relative">
        {/* Loading overlay */}
        {isLoading && (
          <div 
            className="absolute inset-0 flex items-center justify-center z-10"
            style={{ background: 'linear-gradient(180deg, hsl(222 86% 29%) 0%, hsl(0 0% 0%) 100%)' }}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full border-4 border-reward-gold border-t-transparent animate-spin" />
              <span className="text-white/70">Noten werden gerendert...</span>
              {midiPlayer.isLoading && (
                <span className="text-sm text-white/50">Trompeten-Sound wird geladen...</span>
              )}
            </div>
          </div>
        )}

        {/* Error overlay */}
        {loadError && (
          <div 
            className="absolute inset-0 flex items-center justify-center z-10"
            style={{ background: 'linear-gradient(180deg, hsl(222 86% 29%) 0%, hsl(0 0% 0%) 100%)' }}
          >
            <div className="card-glass flex flex-col items-center gap-4 max-w-md text-center p-8 rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Fehler beim Laden</h3>
              <p className="text-gray-600">{loadError}</p>
              <div className="flex gap-3 mt-2">
                <Button onClick={handleRetry} className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-full">
                  <RefreshCw className="w-4 h-4" />
                  Erneut versuchen
                </Button>
                <Button variant="outline" onClick={handleClose} className="rounded-full">
                  Schließen
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MIDI Error indicator */}
        {midiPlayer.error && !isLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 glass rounded-full text-sm flex items-center gap-2 text-white">
            <AlertTriangle className="w-4 h-4 text-reward-gold" />
            <span className="text-white/80">{midiPlayer.error}</span>
          </div>
        )}

        {/* OSMD Container - White card */}
        <div 
          ref={containerRef} 
          className={cn(
            "m-4 p-6 rounded-2xl shadow-2xl min-h-[calc(100%-2rem)]",
            (isLoading || loadError) && "invisible"
          )}
          style={{ 
            background: 'rgba(255, 255, 255, 0.98)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
        />
      </div>

      {/* Bottom Player Bar - Glass style with gold accents */}
      <div className="shrink-0 z-[105] glass px-6 py-4 safe-bottom">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          {/* Playback Mode Switch */}
          <div className="flex items-center glass rounded-full p-1">
            <button
              className={cn(
                "px-4 py-2 text-sm rounded-full transition-all font-medium",
                playbackMode === 'midi' 
                  ? 'bg-reward-gold text-black glow-gold' 
                  : 'text-white/70 hover:text-white'
              )}
              onClick={handleSwitchToMidi}
            >
              <Music className="w-4 h-4 inline-block mr-1.5" />
              MIDI
            </button>
            {audioTracks.length > 0 && (
              <button
                className={cn(
                  "px-4 py-2 text-sm rounded-full transition-all font-medium",
                  playbackMode === 'audio' 
                    ? 'bg-reward-gold text-black glow-gold' 
                    : 'text-white/70 hover:text-white'
                )}
                onClick={() => setPlaybackMode('audio')}
              >
                <Headphones className="w-4 h-4 inline-block mr-1.5" />
                Audio
              </button>
            )}
          </div>

          {/* Play/Pause - Gold accent */}
          <button
            onClick={togglePlayPause}
            disabled={playbackMode === 'midi' && midiPlayer.isLoading}
            className="w-12 h-12 rounded-full bg-reward-gold hover:bg-reward-gold/90 text-black transition-all shrink-0 flex items-center justify-center glow-gold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          {/* Stop */}
          <button
            onClick={handleStop}
            className="w-10 h-10 rounded-full glass hover:bg-white/20 text-white transition-all shrink-0 flex items-center justify-center"
          >
            <Square className="w-4 h-4" />
          </button>

          {/* Bar indicator */}
          <div className="px-4 py-2 glass rounded-full">
            <span className="text-sm font-mono">
              <span className="text-reward-gold font-bold">{currentBar}</span>
              <span className="text-white/50 mx-1">/</span>
              <span className="text-white/70">{totalBars}</span>
            </span>
          </div>

          {/* Tempo Slider */}
          <div className="flex items-center gap-3 flex-1 max-w-xs pl-4 border-l border-white/20">
            <span className="text-white/60 text-sm">Tempo</span>
            <Slider
              value={[tempo]}
              min={40}
              max={120}
              step={1}
              onValueChange={([v]) => setTempo(v)}
              variant="player"
              className="flex-1"
            />
            <span className="text-reward-gold font-bold text-sm w-12 text-center bg-white/10 rounded-full px-2 py-1">
              {tempo}%
            </span>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 pl-4 border-l border-white/20">
            <Volume2 className="w-4 h-4 text-white/60" />
            <Slider
              value={[volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={([v]) => setVolume(v)}
              variant="player"
              className="w-20"
            />
          </div>

          {/* Loop Toggle */}
          <button
            onClick={() => setLoopEnabled(!loopEnabled)}
            className={cn(
              "px-4 py-2 rounded-full transition-all flex items-center gap-1.5 text-sm font-medium",
              loopEnabled 
                ? 'bg-reward-gold text-black glow-gold' 
                : 'glass text-white/70 hover:text-white'
            )}
          >
            <Repeat className="w-4 h-4" />
            Loop
          </button>

          {/* Settings Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="w-10 h-10 rounded-full glass hover:bg-white/20 text-white transition-all flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </button>
            </SheetTrigger>
            <SheetContent className="bg-card border-l-0">
              <SheetHeader>
                <SheetTitle className="text-card-foreground">Player-Einstellungen</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 py-6">
                {/* Metronome */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-card-foreground">Metronom</Label>
                    <Switch
                      checked={metronomeEnabled}
                      onCheckedChange={setMetronomeEnabled}
                    />
                  </div>
                  {metronomeEnabled && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Lautstärke</span>
                      <Slider
                        value={[metronomeVolume]}
                        min={0}
                        max={100}
                        onValueChange={([v]) => setMetronomeVolume(v)}
                        variant="gold"
                        className="flex-1"
                      />
                    </div>
                  )}
                </div>

                {/* Count-in */}
                <div className="space-y-2">
                  <Label className="text-card-foreground">Count-in (Takte)</Label>
                  <div className="flex items-center gap-2">
                    {[0, 1, 2].map(n => (
                      <Button
                        key={n}
                        variant={countIn === n ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCountIn(n)}
                        className={cn(
                          "rounded-full",
                          countIn === n && "bg-reward-gold text-black hover:bg-reward-gold/90"
                        )}
                      >
                        {n}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Loop Range */}
                <div className="space-y-3">
                  <Label className="text-card-foreground">Loop-Bereich</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Von Takt</span>
                      <Input
                        type="number"
                        min={1}
                        max={loopEnd}
                        value={loopStart}
                        onChange={(e) => setLoopStart(Math.max(1, Math.min(loopEnd, parseInt(e.target.value) || 1)))}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Bis Takt</span>
                      <Input
                        type="number"
                        min={loopStart}
                        max={totalBars}
                        value={loopEnd}
                        onChange={(e) => setLoopEnd(Math.max(loopStart, Math.min(totalBars, parseInt(e.target.value) || totalBars)))}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Follow Mode */}
                <div className="flex items-center justify-between">
                  <Label className="text-card-foreground">Auto-Scroll (Follow)</Label>
                  <Switch
                    checked={followMode}
                    onCheckedChange={setFollowMode}
                  />
                </div>

                {/* Audio Tracks */}
                {audioTracks.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-card-foreground">Audio-Tracks</Label>
                    <div className="space-y-2">
                      {audioTracks.map(track => (
                        <button
                          key={track.id}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                            selectedAudioTrack?.id === track.id 
                              ? 'bg-reward-gold/20 border-2 border-reward-gold' 
                              : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                          )}
                          onClick={() => handleSelectAudioTrack(track)}
                        >
                          <Headphones className={cn(
                            "w-4 h-4",
                            selectedAudioTrack?.id === track.id ? 'text-reward-gold' : 'text-muted-foreground'
                          )} />
                          <span className="flex-1 truncate text-card-foreground">{track.title}</span>
                          {track.duration && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {formatTime(track.duration)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Debug Info */}
                {showDebug && (
                  <div className="space-y-2 pt-4 border-t">
                    <Label className="text-xs text-muted-foreground">Debug Info</Label>
                    <div className="text-xs space-y-1 font-mono bg-muted p-3 rounded-lg text-card-foreground">
                      <div>MIDI Ready: {midiPlayer.isReady ? 'Yes' : 'No'}</div>
                      <div>MIDI Loading: {midiPlayer.isLoading ? 'Yes' : 'No'}</div>
                      <div>MIDI Error: {midiPlayer.error || 'None'}</div>
                      <div>Playback Mode: {playbackMode}</div>
                      <div>Total Bars: {totalBars}</div>
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Hidden Audio Element */}
      {selectedAudioTrack && (
        <audio
          ref={audioRef}
          src={selectedAudioTrack.audio_url}
          onEnded={() => setAudioIsPlaying(false)}
          onPlay={() => setAudioIsPlaying(true)}
          onPause={() => setAudioIsPlaying(false)}
        />
      )}
    </div>
  );
}
