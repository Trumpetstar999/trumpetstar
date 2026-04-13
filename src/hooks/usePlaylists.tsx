import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useMembership } from './useMembership';
import { toast } from 'sonner';

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  level_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  video_id: string;
  order_index: number;
  created_at: string;
}

export interface PlaylistWithItems extends Playlist {
  items: PlaylistItem[];
}

const FREE_MAX_PLAYLISTS = 1;
const FREE_MAX_VIDEOS = 5;

export function usePlaylists() {
  const { user } = useAuth();
  const { planKey } = useMembership();
  const [playlists, setPlaylists] = useState<PlaylistWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isPremium = planKey !== 'FREE';

  const fetchPlaylists = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data: playlistsData, error: pErr } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (pErr) throw pErr;

      const { data: itemsData, error: iErr } = await supabase
        .from('playlist_items')
        .select('*')
        .in('playlist_id', (playlistsData || []).map(p => p.id))
        .order('order_index', { ascending: true });

      if (iErr) throw iErr;

      const combined: PlaylistWithItems[] = (playlistsData || []).map(p => ({
        ...p,
        items: (itemsData || []).filter(i => i.playlist_id === p.id),
      }));

      setPlaylists(combined);
    } catch (err) {
      console.error('Error fetching playlists:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const canCreatePlaylist = useCallback(() => {
    if (isPremium) return true;
    return playlists.length < FREE_MAX_PLAYLISTS;
  }, [isPremium, playlists.length]);

  const canAddVideo = useCallback((playlistId: string) => {
    if (isPremium) return true;
    const playlist = playlists.find(p => p.id === playlistId);
    return (playlist?.items.length || 0) < FREE_MAX_VIDEOS;
  }, [isPremium, playlists]);

  const createPlaylist = useCallback(async (name: string, description?: string, levelId?: string) => {
    if (!user) return null;
    if (!canCreatePlaylist()) {
      toast.error('Upgrade auf Basic oder Pro für mehr Playlists');
      return null;
    }

    const { data, error } = await supabase
      .from('playlists')
      .insert({ user_id: user.id, name, description: description || null, level_id: levelId || null })
      .select()
      .single();

    if (error) {
      toast.error('Fehler beim Erstellen der Playlist');
      console.error(error);
      return null;
    }

    await fetchPlaylists();
    toast.success('Playlist erstellt!');
    return data;
  }, [user, canCreatePlaylist, fetchPlaylists]);

  const deletePlaylist = useCallback(async (playlistId: string) => {
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId);

    if (error) {
      toast.error('Fehler beim Löschen');
      return;
    }
    await fetchPlaylists();
    toast.success('Playlist gelöscht');
  }, [fetchPlaylists]);

  const addVideo = useCallback(async (playlistId: string, videoId: string) => {
    if (!canAddVideo(playlistId)) {
      toast.error('Upgrade für mehr Videos pro Playlist');
      return false;
    }

    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist?.items.some(i => i.video_id === videoId)) {
      toast.info('Video ist bereits in der Playlist');
      return false;
    }

    const maxOrder = Math.max(0, ...(playlist?.items.map(i => i.order_index) || [0]));

    const { error } = await supabase
      .from('playlist_items')
      .insert({ playlist_id: playlistId, video_id: videoId, order_index: maxOrder + 1 });

    if (error) {
      toast.error('Fehler beim Hinzufügen');
      console.error(error);
      return false;
    }

    await fetchPlaylists();
    return true;
  }, [canAddVideo, playlists, fetchPlaylists]);

  const removeVideo = useCallback(async (itemId: string) => {
    const { error } = await supabase
      .from('playlist_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast.error('Fehler beim Entfernen');
      return;
    }
    await fetchPlaylists();
  }, [fetchPlaylists]);

  const reorderItems = useCallback(async (playlistId: string, orderedItemIds: string[]) => {
    // Optimistic update
    setPlaylists(prev => prev.map(p => {
      if (p.id !== playlistId) return p;
      const reordered = orderedItemIds.map((id, idx) => {
        const item = p.items.find(i => i.id === id)!;
        return { ...item, order_index: idx };
      });
      return { ...p, items: reordered };
    }));

    // Persist
    const updates = orderedItemIds.map((id, idx) =>
      supabase.from('playlist_items').update({ order_index: idx }).eq('id', id)
    );
    await Promise.all(updates);
  }, []);

  const getPlaylistsForLevel = useCallback((levelId: string) => {
    return playlists.filter(p => p.level_id === levelId);
  }, [playlists]);

  return {
    playlists,
    isLoading,
    isPremium,
    canCreatePlaylist,
    canAddVideo,
    createPlaylist,
    deletePlaylist,
    addVideo,
    removeVideo,
    reorderItems,
    getPlaylistsForLevel,
    refreshPlaylists: fetchPlaylists,
    FREE_MAX_PLAYLISTS,
    FREE_MAX_VIDEOS,
  };
}
