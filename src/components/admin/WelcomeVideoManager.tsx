import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, GripVertical, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface WelcomeVideo {
  id: string;
  title: string;
  title_en: string | null;
  title_es: string | null;
  vimeo_video_id: string;
  vimeo_player_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  sort_order: number;
  is_active: boolean;
}

export function WelcomeVideoManager() {
  const [videos, setVideos] = useState<WelcomeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newVideo, setNewVideo] = useState({ title: '', vimeo_video_id: '', title_en: '', title_es: '' });

  useEffect(() => { fetchVideos(); }, []);

  async function fetchVideos() {
    const { data } = await supabase
      .from('welcome_videos')
      .select('*')
      .order('sort_order', { ascending: true });
    if (data) setVideos(data);
    setIsLoading(false);
  }

  async function addVideo() {
    if (!newVideo.title.trim() || !newVideo.vimeo_video_id.trim()) {
      toast.error('Titel und Vimeo-ID sind Pflichtfelder');
      return;
    }
    const { error } = await supabase.from('welcome_videos').insert({
      title: newVideo.title.trim(),
      title_en: newVideo.title_en.trim() || null,
      title_es: newVideo.title_es.trim() || null,
      vimeo_video_id: newVideo.vimeo_video_id.trim(),
      sort_order: videos.length,
    });
    if (error) { toast.error('Fehler: ' + error.message); return; }
    toast.success('Video hinzugefügt');
    setNewVideo({ title: '', vimeo_video_id: '', title_en: '', title_es: '' });
    fetchVideos();
  }

  async function deleteVideo(id: string) {
    if (!confirm('Video wirklich löschen?')) return;
    const { error } = await supabase.from('welcome_videos').delete().eq('id', id);
    if (error) { toast.error('Fehler: ' + error.message); return; }
    toast.success('Gelöscht');
    fetchVideos();
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('welcome_videos').update({ is_active: !active }).eq('id', id);
    fetchVideos();
  }

  async function saveOrder() {
    setIsSaving(true);
    for (let i = 0; i < videos.length; i++) {
      await supabase.from('welcome_videos').update({ sort_order: i }).eq('id', videos[i].id);
    }
    toast.success('Reihenfolge gespeichert');
    setIsSaving(false);
  }

  function moveVideo(index: number, direction: -1 | 1) {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= videos.length) return;
    const updated = [...videos];
    [updated[index], updated[newIdx]] = [updated[newIdx], updated[index]];
    setVideos(updated);
  }

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Willkommens-Videos</h2>
        <button onClick={saveOrder} disabled={isSaving} className="admin-btn-primary flex items-center gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Reihenfolge speichern
        </button>
      </div>

      {/* Add new video */}
      <div className="admin-card p-4">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Neues Video hinzufügen</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            className="admin-input"
            placeholder="Titel (DE)"
            value={newVideo.title}
            onChange={e => setNewVideo({ ...newVideo, title: e.target.value })}
          />
          <input
            className="admin-input"
            placeholder="Titel (EN, optional)"
            value={newVideo.title_en}
            onChange={e => setNewVideo({ ...newVideo, title_en: e.target.value })}
          />
          <input
            className="admin-input"
            placeholder="Titel (ES, optional)"
            value={newVideo.title_es}
            onChange={e => setNewVideo({ ...newVideo, title_es: e.target.value })}
          />
          <input
            className="admin-input"
            placeholder="Vimeo Video ID"
            value={newVideo.vimeo_video_id}
            onChange={e => setNewVideo({ ...newVideo, vimeo_video_id: e.target.value })}
          />
        </div>
        <button onClick={addVideo} className="admin-btn-primary mt-3 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Hinzufügen
        </button>
      </div>

      {/* Video list */}
      <div className="admin-card divide-y divide-slate-200">
        {videos.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Noch keine Willkommens-Videos angelegt.</p>
        ) : (
          videos.map((video, index) => (
            <div key={video.id} className="flex items-center gap-3 p-3">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveVideo(index, -1)} disabled={index === 0} className="text-slate-400 hover:text-slate-600 disabled:opacity-30">▲</button>
                <button onClick={() => moveVideo(index, 1)} disabled={index === videos.length - 1} className="text-slate-400 hover:text-slate-600 disabled:opacity-30">▼</button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{video.title}</p>
                <p className="text-xs text-slate-500">Vimeo: {video.vimeo_video_id}</p>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={video.is_active}
                  onChange={() => toggleActive(video.id, video.is_active)}
                  className="rounded border-slate-300"
                />
                Aktiv
              </label>
              <button onClick={() => deleteVideo(video.id)} className="text-red-400 hover:text-red-600 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
