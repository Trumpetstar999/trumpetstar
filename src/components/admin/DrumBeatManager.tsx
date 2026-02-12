import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Upload, Trash2, Play, Square, Loader2, Plus, Music2 } from 'lucide-react';

interface DrumBeat {
  id: string;
  title: string;
  category: string | null;
  native_bpm: number | null;
  time_signature_top: number | null;
  time_signature_bottom: number | null;
  file_url: string;
  is_active: boolean;
  sort_order: number;
}

export function DrumBeatManager() {
  const [beats, setBeats] = useState<DrumBeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New beat form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newNativeBpm, setNewNativeBpm] = useState('');
  const [newTimeSigTop, setNewTimeSigTop] = useState('4');
  const [newTimeSigBottom, setNewTimeSigBottom] = useState('4');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function loadBeats() {
    const { data, error } = await supabase
      .from('drum_beats')
      .select('*')
      .order('sort_order');
    if (error) {
      toast.error('Fehler beim Laden der Beats');
      console.error(error);
    } else {
      setBeats((data || []) as DrumBeat[]);
    }
    setLoading(false);
  }

  useEffect(() => { loadBeats(); }, []);

  async function handleUpload() {
    if (!selectedFile || !newTitle) {
      toast.error('Titel und Datei sind erforderlich');
      return;
    }

    setUploading(true);
    try {
      const id = crypto.randomUUID();
      const ext = selectedFile.name.split('.').pop() || 'mp3';
      const storagePath = `${id}/beat.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('drum-beats')
        .upload(storagePath, selectedFile, { contentType: selectedFile.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('drum-beats').getPublicUrl(storagePath);

      const { error: insertError } = await supabase.from('drum_beats').insert({
        id,
        title: newTitle,
        category: newCategory || null,
        native_bpm: newNativeBpm ? parseInt(newNativeBpm) : null,
        time_signature_top: parseInt(newTimeSigTop) || null,
        time_signature_bottom: parseInt(newTimeSigBottom) || null,
        file_url: urlData.publicUrl,
        sort_order: beats.length,
      });

      if (insertError) throw insertError;

      toast.success('Beat hochgeladen');
      setNewTitle('');
      setNewCategory('');
      setNewNativeBpm('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadBeats();
    } catch (error: any) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function toggleActive(beat: DrumBeat) {
    const { error } = await supabase
      .from('drum_beats')
      .update({ is_active: !beat.is_active })
      .eq('id', beat.id);
    if (error) {
      toast.error('Fehler beim Aktualisieren');
    } else {
      loadBeats();
    }
  }

  async function deleteBeat(beat: DrumBeat) {
    if (!confirm(`"${beat.title}" wirklich löschen?`)) return;
    
    // Delete storage file
    const path = beat.file_url.split('/drum-beats/')[1];
    if (path) {
      await supabase.storage.from('drum-beats').remove([decodeURIComponent(path)]);
    }

    const { error } = await supabase.from('drum_beats').delete().eq('id', beat.id);
    if (error) {
      toast.error('Fehler beim Löschen');
    } else {
      toast.success('Beat gelöscht');
      loadBeats();
    }
  }

  function togglePreview(beat: DrumBeat) {
    if (playingId === beat.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(beat.file_url);
    audio.loop = true;
    audio.play();
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    setPlayingId(beat.id);
  }

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upload form */}
      <div className="admin-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Neuen Beat hochladen
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Titel *</Label>
            <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="z.B. Rock Beat 4/4" />
          </div>
          <div className="space-y-2">
            <Label>Kategorie</Label>
            <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="z.B. Rock, Jazz, Latin" />
          </div>
          <div className="space-y-2">
            <Label>Native BPM</Label>
            <Input type="number" value={newNativeBpm} onChange={e => setNewNativeBpm(e.target.value)} placeholder="z.B. 120" />
          </div>
          <div className="flex gap-2">
            <div className="space-y-2 flex-1">
              <Label>Taktart Zähler</Label>
              <Input type="number" value={newTimeSigTop} onChange={e => setNewTimeSigTop(e.target.value)} min="1" max="12" />
            </div>
            <div className="space-y-2 flex-1">
              <Label>Nenner</Label>
              <Input type="number" value={newTimeSigBottom} onChange={e => setNewTimeSigBottom(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>MP3-Datei *</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/mp3"
            onChange={e => setSelectedFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <Button onClick={handleUpload} disabled={uploading || !newTitle || !selectedFile}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
          Hochladen
        </Button>
      </div>

      {/* Beats list */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">
          Beats ({beats.length})
        </h3>
        {beats.length === 0 ? (
          <div className="admin-card p-8 text-center text-slate-500">
            <Music2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Noch keine Beats hochgeladen</p>
          </div>
        ) : (
          beats.map(beat => (
            <div key={beat.id} className="admin-card p-4 flex items-center gap-4">
              <button onClick={() => togglePreview(beat)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
                {playingId === beat.id ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{beat.title}</p>
                <p className="text-xs text-slate-500">
                  {beat.category && `${beat.category} · `}
                  {beat.native_bpm ? `${beat.native_bpm} BPM` : 'Kein BPM'}
                  {beat.time_signature_top && ` · ${beat.time_signature_top}/${beat.time_signature_bottom}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={beat.is_active} onCheckedChange={() => toggleActive(beat)} />
                <button onClick={() => deleteBeat(beat)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
