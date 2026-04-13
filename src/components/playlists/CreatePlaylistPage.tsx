import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Check, Search, ListMusic, Sparkles, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Level {
  id: string;
  title: string;
}

interface VideoItem {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  level_id: string;
}

interface LevelWithVideos {
  id: string;
  title: string;
  videos: VideoItem[];
}

interface CreatePlaylistPageProps {
  open: boolean;
  onClose: () => void;
  levels: Level[];
  defaultLevelId?: string;
  onCreate: (name: string, description?: string, levelId?: string) => Promise<any>;
  onAddVideoToPlaylist?: (playlistId: string, videoId: string) => Promise<boolean>;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function CreatePlaylistPage({ open, onClose, levels, defaultLevelId, onCreate, onAddVideoToPlaylist }: CreatePlaylistPageProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState(defaultLevelId || '');
  const [isCreating, setIsCreating] = useState(false);
  const [createdPlaylistId, setCreatedPlaylistId] = useState<string | null>(null);
  const [addedVideoIds, setAddedVideoIds] = useState<Set<string>>(new Set());
  const [addingVideoId, setAddingVideoId] = useState<string | null>(null);

  // Video browsing state
  const [levelsWithVideos, setLevelsWithVideos] = useState<LevelWithVideos[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Step: 1 = name/details, 2 = browse videos
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (!open) {
      // Reset on close
      setName('');
      setDescription('');
      setSelectedLevelId(defaultLevelId || '');
      setCreatedPlaylistId(null);
      setAddedVideoIds(new Set());
      setStep(1);
      setSearchQuery('');
      return;
    }
    fetchAllVideos();
  }, [open]);

  async function fetchAllVideos() {
    setIsLoadingVideos(true);
    const { data, error } = await supabase
      .from('videos')
      .select('id, title, thumbnail_url, duration_seconds, level_id')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!error && data) {
      const grouped: LevelWithVideos[] = levels.map(level => ({
        ...level,
        videos: (data as VideoItem[]).filter(v => v.level_id === level.id),
      })).filter(l => l.videos.length > 0);

      setLevelsWithVideos(grouped);

      // Auto-expand current level
      if (defaultLevelId) {
        setExpandedLevels(new Set([defaultLevelId]));
      }
    }
    setIsLoadingVideos(false);
  }

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    const levelToUse = selectedLevelId === 'none' ? undefined : selectedLevelId || undefined;
    const result = await onCreate(name.trim(), description.trim() || undefined, levelToUse);
    setIsCreating(false);
    if (result) {
      setCreatedPlaylistId(result.id);
      setStep(2);
    }
  };

  const handleAddVideo = async (videoId: string) => {
    if (!createdPlaylistId || !onAddVideoToPlaylist) return;
    setAddingVideoId(videoId);
    const ok = await onAddVideoToPlaylist(createdPlaylistId, videoId);
    if (ok) {
      setAddedVideoIds(prev => new Set(prev).add(videoId));
    }
    setAddingVideoId(null);
  };

  const toggleLevel = (levelId: string) => {
    setExpandedLevels(prev => {
      const next = new Set(prev);
      if (next.has(levelId)) next.delete(levelId);
      else next.add(levelId);
      return next;
    });
  };

  // Filter videos by search
  const filteredLevels = useMemo(() => {
    if (!searchQuery.trim()) return levelsWithVideos;
    const q = searchQuery.toLowerCase();
    return levelsWithVideos.map(level => ({
      ...level,
      videos: level.videos.filter(v => v.title.toLowerCase().includes(q)),
    })).filter(l => l.videos.length > 0);
  }, [levelsWithVideos, searchQuery]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <ListMusic className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold text-card-foreground">
              {step === 1 ? 'Neue Playlist erstellen' : `${name} – Videos hinzufügen`}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === 1 ? 'Gib deinem Übeplan einen Namen' : `${addedVideoIds.size} Videos hinzugefügt`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {step === 2 && (
            <Button onClick={onClose} className="bg-primary hover:bg-primary/90 gap-1.5">
              <Sparkles className="w-4 h-4" />
              Fertig ({addedVideoIds.size} Videos)
            </Button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {step === 1 ? (
        /* Step 1: Name & Details */
        <div className="flex-1 flex items-start justify-center pt-16 px-6">
          <div className="w-full max-w-md space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Name *</label>
              <Input
                placeholder="z.B. Meine Lieblingsstücke"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-card border-border text-lg h-12"
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Beschreibung (optional)</label>
              <Input
                placeholder="Worum geht's in dieser Playlist?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-card border-border"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Level-Zuordnung</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedLevelId('none')}
                  className={cn(
                    'px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                    selectedLevelId === 'none' || selectedLevelId === ''
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                  )}
                >
                  Kein Level
                </button>
                {levels.map(level => (
                  <button
                    key={level.id}
                    onClick={() => setSelectedLevelId(level.id)}
                    className={cn(
                      'px-3 py-2 rounded-lg border text-sm font-medium transition-all truncate',
                      selectedLevelId === level.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                    )}
                  >
                    {level.title}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleCreate}
              disabled={!name.trim() || isCreating}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-12 text-base"
            >
              <Sparkles className="w-5 h-5" />
              {isCreating ? 'Wird erstellt...' : 'Weiter – Videos wählen'}
            </Button>
          </div>
        </div>
      ) : (
        /* Step 2: Browse all levels & videos */
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="px-6 py-3 border-b border-border">
            <div className="relative max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Videos durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-card border-border"
                autoFocus
              />
            </div>
          </div>

          {/* Levels & Videos list */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoadingVideos ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLevels.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">Keine Videos gefunden</p>
            ) : (
              <div className="space-y-2 max-w-4xl mx-auto">
                {filteredLevels.map(level => {
                  const isExpanded = expandedLevels.has(level.id) || searchQuery.trim().length > 0;
                  return (
                    <div key={level.id} className="rounded-xl border border-border bg-card overflow-hidden">
                      {/* Level header */}
                      <button
                        onClick={() => toggleLevel(level.id)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          )}
                          <h3 className="text-base font-semibold text-card-foreground">{level.title}</h3>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {level.videos.length} Videos
                          </span>
                        </div>
                      </button>

                      {/* Videos */}
                      {isExpanded && (
                        <div className="border-t border-border divide-y divide-border">
                          {level.videos.map(video => {
                            const isAdded = addedVideoIds.has(video.id);
                            const isAdding = addingVideoId === video.id;
                            return (
                              <div
                                key={video.id}
                                className="flex items-center gap-4 px-5 py-3 hover:bg-accent/30 transition-colors"
                              >
                                <img
                                  src={video.thumbnail_url || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=80&h=45&fit=crop'}
                                  alt={video.title}
                                  className="w-20 h-11 rounded-md object-cover flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-card-foreground truncate">{video.title}</p>
                                  <p className="text-xs text-muted-foreground">{formatDuration(video.duration_seconds)}</p>
                                </div>
                                <button
                                  onClick={() => handleAddVideo(video.id)}
                                  disabled={isAdded || isAdding}
                                  className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex-shrink-0',
                                    isAdded
                                      ? 'bg-primary/10 text-primary cursor-default'
                                      : 'bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105'
                                  )}
                                >
                                  {isAdded ? (
                                    <><Check className="w-4 h-4" /> Hinzugefügt</>
                                  ) : isAdding ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <><Plus className="w-4 h-4" /> Hinzufügen</>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
