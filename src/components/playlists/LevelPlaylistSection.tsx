import { useState, useEffect } from 'react';
import { Plus, ListMusic, Lock } from 'lucide-react';
import { PlaylistCard } from './PlaylistCard';
import { CreatePlaylistPage } from './CreatePlaylistPage';
import { PlaylistEditor } from './PlaylistEditor';
import { PlaylistPlayerOverlay } from './PlaylistPlayerOverlay';
import { usePlaylists, PlaylistWithItems } from '@/hooks/usePlaylists';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface Level {
  id: string;
  title: string;
}

interface LevelPlaylistSectionProps {
  currentLevelId: string;
  levels: Level[];
  onStarEarned: () => void;
}

export function LevelPlaylistSection({ currentLevelId, levels, onStarEarned }: LevelPlaylistSectionProps) {
  const { user } = useAuth();
  const {
    playlists, isLoading, canCreatePlaylist, canAddVideo,
    createPlaylist, deletePlaylist, addVideo, removeVideo, reorderItems,
    getPlaylistsForLevel, isPremium, FREE_MAX_PLAYLISTS,
  } = usePlaylists();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<PlaylistWithItems | null>(null);
  const [playingPlaylist, setPlayingPlaylist] = useState<PlaylistWithItems | null>(null);
  const [completedVideoIds, setCompletedVideoIds] = useState<string[]>([]);

  const levelPlaylists = getPlaylistsForLevel(currentLevelId);

  // Fetch completed video IDs
  useEffect(() => {
    if (!user) return;
    supabase
      .from('video_completions')
      .select('video_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setCompletedVideoIds(data.map((d: any) => d.video_id));
      });
  }, [user]);

  if (!user) return null;

  // Update editing playlist reference when playlists change
  const currentEditingPlaylist = editingPlaylist
    ? playlists.find(p => p.id === editingPlaylist.id) || editingPlaylist
    : null;

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-primary" />
            <h3 className="text-base font-semibold text-white">Deine Playlists</h3>
            {levelPlaylists.length > 0 && (
              <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full">{levelPlaylists.length}</span>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCreateOpen(true)}
            disabled={!canCreatePlaylist()}
            className="gap-1.5 text-white/70 hover:text-white hover:bg-white/10 text-xs"
          >
            {canCreatePlaylist() ? (
              <><Plus className="w-3.5 h-3.5" /> Neue Playlist</>
            ) : (
              <><Lock className="w-3.5 h-3.5" /> Upgrade</>
            )}
          </Button>
        </div>

        {isLoading ? (
          <div className="h-20 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : levelPlaylists.length === 0 ? (
          <button
            onClick={() => setCreateOpen(true)}
            className="w-full p-6 rounded-xl border-2 border-dashed border-white/15 hover:border-primary/40 transition-colors flex flex-col items-center gap-2 group"
          >
            <Plus className="w-8 h-8 text-white/30 group-hover:text-primary transition-colors" />
            <p className="text-sm text-white/40 group-hover:text-white/60 transition-colors">
              Erstelle deinen ersten Übeplan
            </p>
          </button>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {levelPlaylists.map(playlist => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                completedVideoIds={completedVideoIds}
                onEdit={() => setEditingPlaylist(playlist)}
                onStart={() => setPlayingPlaylist(playlist)}
              />
            ))}
          </div>
        )}
      </div>

      <CreatePlaylistPage
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        levels={levels}
        defaultLevelId={currentLevelId}
        onCreate={createPlaylist}
        onAddVideoToPlaylist={addVideo}
      />

      {currentEditingPlaylist && (
        <PlaylistEditor
          open={!!currentEditingPlaylist}
          onOpenChange={(open) => !open && setEditingPlaylist(null)}
          playlist={currentEditingPlaylist}
          onAddVideo={addVideo}
          onRemoveVideo={removeVideo}
          onReorder={reorderItems}
          onDelete={deletePlaylist}
          onStartPlaylist={(p) => { setEditingPlaylist(null); setPlayingPlaylist(p); }}
        />
      )}

      {playingPlaylist && (
        <PlaylistPlayerOverlay
          playlist={playingPlaylist}
          onClose={() => setPlayingPlaylist(null)}
          onStarEarned={onStarEarned}
        />
      )}
    </>
  );
}
