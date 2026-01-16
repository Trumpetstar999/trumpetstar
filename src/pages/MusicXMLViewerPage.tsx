import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  Volume2,
  Music,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Repeat,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  Headphones,
  Settings
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
  const [isPlaying, setIsPlaying] = useState(false);
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
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

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
        
        // Note: Transposition would require modifying the XML before loading
        // OSMD doesn't have built-in transpose - we display as-is for now

        osmdInstance.render();

        // Get total bars
        const measures = osmdInstance.Sheet?.SourceMeasures?.length || 1;
        setTotalBars(measures);
        setLoopEnd(measures);

        setOsmd(osmdInstance);
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

  // Handle close
  const handleClose = () => {
    navigate('/musicxml');
  };

  // Handle retry
  const handleRetry = () => {
    setLoadError(null);
    setIsLoading(true);
    // Re-trigger by remounting
    if (osmd) {
      osmd.clear();
      setOsmd(null);
    }
  };

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (playbackMode === 'audio' && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      // MIDI playback - TODO: implement with soundfont
      toast.info('MIDI Playback wird geladen...');
      setIsPlaying(!isPlaying);
    }
  }, [playbackMode, isPlaying]);

  // Audio track selection
  const handleSelectAudioTrack = useCallback((track: AudioTrack) => {
    setSelectedAudioTrack(track);
    setPlaybackMode('audio');
  }, []);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (docLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-semibold mb-2">Dokument nicht gefunden</h2>
          <Button onClick={handleClose}>Zurück</Button>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="text-center max-w-sm">
          <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">{document.title}</h2>
          <p className="text-muted-foreground mb-4">
            Dieses Stück erfordert den {document.plan_required}-Plan.
          </p>
          <Button onClick={handleClose}>Zurück</Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col bg-background"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold truncate max-w-xs md:max-w-md">
            {document.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Concert Pitch Toggle */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
            <Label htmlFor="concert-pitch" className="text-xs cursor-pointer">
              {isConcertPitch ? 'Konzertton' : 'B♭ Trompete'}
            </Label>
            <Switch
              id="concert-pitch"
              checked={isConcertPitch}
              onCheckedChange={setIsConcertPitch}
              className="scale-75"
            />
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(1)}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Score Container */}
      <div className="flex-1 overflow-auto relative">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <span className="text-muted-foreground">Noten werden geladen...</span>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="flex flex-col items-center gap-4 max-w-md text-center">
              <AlertTriangle className="w-12 h-12 text-destructive" />
              <h3 className="text-lg font-semibold">Fehler beim Laden</h3>
              <p className="text-muted-foreground">{loadError}</p>
              <div className="flex gap-2">
                <Button onClick={handleRetry}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Erneut versuchen
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Schließen
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* OSMD Container */}
        <div 
          ref={containerRef} 
          className={cn(
            "p-4 min-h-full",
            (isLoading || loadError) && "invisible"
          )}
        />
      </div>

      {/* Bottom Player Bar */}
      <div className="shrink-0 border-t bg-card px-4 py-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            {/* Playback Mode Switch */}
            <div className="flex items-center bg-muted rounded-full p-1">
              <button
                className={cn(
                  "px-3 py-1 text-sm rounded-full transition-colors",
                  playbackMode === 'midi' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                )}
                onClick={() => setPlaybackMode('midi')}
              >
                MIDI
              </button>
              {audioTracks.length > 0 && (
                <button
                  className={cn(
                    "px-3 py-1 text-sm rounded-full transition-colors",
                    playbackMode === 'audio' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                  )}
                  onClick={() => setPlaybackMode('audio')}
                >
                  Audio
                </button>
              )}
            </div>

            {/* Play/Pause */}
            <Button
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={togglePlayPause}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>

            {/* Bar indicator */}
            <div className="text-sm text-muted-foreground">
              Takt {currentBar} / {totalBars}
            </div>

            {/* Tempo Slider */}
            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <span className="text-sm text-muted-foreground w-14">Tempo</span>
              <Slider
                value={[tempo]}
                min={40}
                max={120}
                step={1}
                onValueChange={([v]) => setTempo(v)}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12 text-right">{tempo}%</span>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={([v]) => setVolume(v)}
                className="w-20"
              />
            </div>

            {/* Loop Toggle */}
            <Button
              variant={loopEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLoopEnabled(!loopEnabled)}
            >
              <Repeat className="w-4 h-4 mr-1" />
              Loop
            </Button>

            {/* Settings Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Player-Einstellungen</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 py-6">
                  {/* Metronome */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Metronom</Label>
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
                          className="flex-1"
                        />
                      </div>
                    )}
                  </div>

                  {/* Count-in */}
                  <div className="space-y-2">
                    <Label>Count-in (Takte)</Label>
                    <div className="flex items-center gap-2">
                      {[0, 1, 2].map(n => (
                        <Button
                          key={n}
                          variant={countIn === n ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCountIn(n)}
                        >
                          {n}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Loop Range */}
                  <div className="space-y-3">
                    <Label>Loop-Bereich</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Von Takt</span>
                        <Input
                          type="number"
                          min={1}
                          max={loopEnd}
                          value={loopStart}
                          onChange={(e) => setLoopStart(Math.max(1, Math.min(loopEnd, parseInt(e.target.value) || 1)))}
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
                        />
                      </div>
                    </div>
                  </div>

                  {/* Follow Mode */}
                  <div className="flex items-center justify-between">
                    <Label>Auto-Scroll (Follow)</Label>
                    <Switch
                      checked={followMode}
                      onCheckedChange={setFollowMode}
                    />
                  </div>

                  {/* Audio Tracks */}
                  {audioTracks.length > 0 && (
                    <div className="space-y-2">
                      <Label>Audio-Tracks</Label>
                      <div className="space-y-2">
                        {audioTracks.map(track => (
                          <button
                            key={track.id}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                              selectedAudioTrack?.id === track.id 
                                ? 'bg-primary/10 border border-primary' 
                                : 'bg-muted hover:bg-muted/80'
                            )}
                            onClick={() => handleSelectAudioTrack(track)}
                          >
                            <Headphones className="w-4 h-4" />
                            <span className="flex-1 truncate">{track.title}</span>
                            {track.duration && (
                              <span className="text-xs text-muted-foreground">
                                {formatTime(track.duration)}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      {selectedAudioTrack && (
        <audio
          ref={audioRef}
          src={selectedAudioTrack.audio_url}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}
    </div>
  );
}
