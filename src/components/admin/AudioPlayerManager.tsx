import { useState, useEffect, useRef } from 'react';
import {
  Layers, Plus, Edit2, Trash2, Check, X, GripVertical,
  Play, Pause, Upload, FileAudio, Loader2, CheckCircle2, FolderOpen,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { formatTime } from '@/lib/formatTime';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AudioFile {
  id: string;
  display_name: string;
  original_filename: string;
  storage_url: string;
  duration_seconds: number | null;
  level_id: string | null;
  created_at: string;
}

interface AudioLevel {
  id: string;
  name: string;
  items: {
    id: string;
    position: number;
    audio_id: string;
    audio_files: {
      id: string;
      display_name: string;
      duration_seconds: number | null;
      storage_url: string;
    };
  }[];
}

// ─── AudioUpload ─────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/ogg'];
const MAX_SIZE = 25 * 1024 * 1024;

interface UploadingFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

function AudioUpload({ onUploadComplete, levels }: { onUploadComplete: () => void; levels: AudioLevel[] }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<string>('none');

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(mp3|m4a|ogg)$/i)) {
      return 'Nur MP3, M4A und OGG Dateien erlaubt';
    }
    if (file.size > MAX_SIZE) return 'Datei ist größer als 25MB';
    return null;
  };

  const uploadFile = async (file: File, index: number, levelId: string) => {
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const displayName = file.name.replace(/\.[^/.]+$/, '');
    try {
      setUploadingFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'uploading' as const, progress: 10 } : f));

      const { error: uploadError } = await supabase.storage.from('audio-files').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      setUploadingFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: 50 } : f));

      const { data: urlData } = supabase.storage.from('audio-files').getPublicUrl(fileName);

      let durationSeconds: number | null = null;
      try {
        const audio = new Audio(urlData.publicUrl);
        await new Promise<void>((resolve) => {
          audio.onloadedmetadata = () => { durationSeconds = audio.duration; resolve(); };
          audio.onerror = () => resolve();
          setTimeout(resolve, 5000);
        });
      } catch { /* ignore */ }

      setUploadingFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: 75 } : f));

      const { data: audioData, error: dbError } = await supabase
        .from('audio_files')
        .insert({ storage_url: urlData.publicUrl, original_filename: file.name, display_name: displayName, duration_seconds: durationSeconds })
        .select('id')
        .single();

      if (dbError) throw dbError;

      if (levelId !== 'none' && audioData) {
        const { data: maxPos } = await supabase
          .from('audio_level_items')
          .select('position')
          .eq('level_id', levelId)
          .order('position', { ascending: false })
          .limit(1);
        const nextPosition = maxPos && maxPos.length > 0 ? maxPos[0].position + 1 : 0;
        await supabase.from('audio_level_items').insert({ level_id: levelId, audio_id: audioData.id, position: nextPosition });
      }

      setUploadingFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'done' as const, progress: 100 } : f));
    } catch (error: any) {
      setUploadingFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'error' as const, error: error.message } : f));
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: UploadingFile[] = [];
    const errors: string[] = [];
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) errors.push(`${file.name}: ${error}`);
      else validFiles.push({ file, progress: 0, status: 'pending' });
    });
    if (errors.length > 0) toast.error('Einige Dateien übersprungen: ' + errors.join(', '));
    if (validFiles.length === 0) return;
    const startIndex = uploadingFiles.length;
    setUploadingFiles(prev => [...prev, ...validFiles]);
    const currentLevelId = selectedLevelId;
    for (let i = 0; i < validFiles.length; i++) {
      await uploadFile(validFiles[i].file, startIndex + i, currentLevelId);
    }
    onUploadComplete();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium whitespace-nowrap">Level zuweisen:</label>
        <Select value={selectedLevelId} onValueChange={setSelectedLevelId}>
          <SelectTrigger className="w-full max-w-xs"><SelectValue placeholder="Kein Level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Kein Level</SelectItem>
            {levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${isDragging ? 'border-primary bg-primary/20' : 'border-border hover:border-primary/50 hover:bg-primary/5'}`}
      >
        <input
          type="file"
          accept=".mp3,.m4a,.ogg,audio/mpeg,audio/mp4,audio/ogg"
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
        <p className="text-lg font-medium mb-2">Dateien hierher ziehen oder klicken</p>
        <p className="text-sm text-muted-foreground">MP3, M4A, OGG • Max. 25MB pro Datei</p>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Uploads</h3>
            <Button variant="ghost" size="sm" onClick={() => setUploadingFiles(prev => prev.filter(f => f.status !== 'done' && f.status !== 'error'))}>
              Abgeschlossene entfernen
            </Button>
          </div>
          {uploadingFiles.map((uf, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FileAudio className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{uf.file.name}</p>
                {uf.status === 'uploading' && (
                  <div className="h-1 mt-1 bg-muted-foreground/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-200" style={{ width: `${uf.progress}%` }} />
                  </div>
                )}
                {uf.status === 'error' && <p className="text-xs text-destructive mt-1">{uf.error}</p>}
              </div>
              {uf.status === 'uploading' && <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />}
              {uf.status === 'done' && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
              {uf.status === 'error' && <X className="w-5 h-5 text-destructive shrink-0" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AudioLibrary ─────────────────────────────────────────────────────────────

function AudioLibrary({ refreshTrigger, onRefresh, levels }: { refreshTrigger: number; onRefresh: () => void; levels: AudioLevel[] }) {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('audio_files').select('*').order('created_at', { ascending: false });
    if (error) console.error('Error fetching audio files:', error);
    else setAudioFiles(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [refreshTrigger]);

  const handleRename = async (id: string) => {
    if (!editingName.trim()) return;
    const { error } = await supabase.from('audio_files').update({ display_name: editingName.trim() }).eq('id', id);
    if (error) toast.error('Fehler beim Umbenennen: ' + error.message);
    else { toast.success('Audio umbenannt'); setEditingId(null); fetchData(); }
  };

  const handleDelete = async (audio: AudioFile) => {
    const fileName = audio.storage_url.split('/').pop();
    if (fileName) await supabase.storage.from('audio-files').remove([fileName]);
    const { error } = await supabase.from('audio_files').delete().eq('id', audio.id);
    if (error) toast.error('Fehler beim Löschen: ' + error.message);
    else { toast.success('Audio gelöscht'); fetchData(); onRefresh(); }
  };

  const handleLevelChange = async (audioId: string, levelId: string | null) => {
    await supabase.from('audio_level_items').delete().eq('audio_id', audioId);
    const { error } = await supabase.from('audio_files').update({ level_id: levelId }).eq('id', audioId);
    if (error) { toast.error('Fehler beim Zuweisen: ' + error.message); return; }
    if (levelId) {
      const { data: maxPos } = await supabase.from('audio_level_items').select('position').eq('level_id', levelId).order('position', { ascending: false }).limit(1).single();
      await supabase.from('audio_level_items').insert({ level_id: levelId, audio_id: audioId, position: (maxPos?.position ?? -1) + 1 });
    }
    toast.success(levelId ? 'Audio zugewiesen' : 'Zuweisung entfernt');
    fetchData(); onRefresh();
  };

  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>;
  if (audioFiles.length === 0) return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <FolderOpen className="w-12 h-12 mb-4 opacity-50" />
      <p>Keine Audio-Dateien vorhanden</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {audioFiles.map(audio => {
        const isEditing = editingId === audio.id;
        return (
          <div key={audio.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <FileAudio className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="h-8" autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRename(audio.id); if (e.key === 'Escape') setEditingId(null); }} />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleRename(audio.id)}><Check className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                </div>
              ) : (
                <>
                  <p className="font-medium truncate">{audio.display_name}</p>
                  <p className="text-sm text-muted-foreground">{audio.duration_seconds ? formatTime(audio.duration_seconds) : 'Dauer unbekannt'}</p>
                </>
              )}
            </div>
            <Select value={audio.level_id ?? 'none'} onValueChange={(v) => handleLevelChange(audio.id, v === 'none' ? null : v)}>
              <SelectTrigger className="w-32 h-8 text-sm"><SelectValue placeholder="Kein Level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Level</SelectItem>
                {levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {!isEditing && (
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingId(audio.id); setEditingName(audio.display_name); }}><Edit2 className="w-4 h-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Audio löschen?</AlertDialogTitle>
                      <AlertDialogDescription>"{audio.display_name}" wird unwiderruflich gelöscht.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(audio)} className="bg-destructive hover:bg-destructive/90">Löschen</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── AudioLevelManager ───────────────────────────────────────────────────────

function AudioLevelManager({ refreshTrigger, onRefresh }: { refreshTrigger: number; onRefresh: () => void }) {
  const [levels, setLevels] = useState<AudioLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newLevelName, setNewLevelName] = useState('');
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
  const [editingLevelName, setEditingLevelName] = useState('');
  const [openLevelId, setOpenLevelId] = useState<string | null>(null);
  const [draggingItem, setDraggingItem] = useState<{ levelId: string; index: number } | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchLevels = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('audio_levels').select('id, name').order('created_at', { ascending: true });
    if (error) { console.error(error); setIsLoading(false); return; }
    const withItems: AudioLevel[] = await Promise.all(
      (data || []).map(async (level) => {
        const { data: items } = await supabase
          .from('audio_level_items')
          .select('id, position, audio_id, audio_files(id, display_name, duration_seconds, storage_url)')
          .eq('level_id', level.id)
          .order('position', { ascending: true });
        return { ...level, items: (items || []).filter(item => item.audio_files) as any[] };
      })
    );
    setLevels(withItems);
    setIsLoading(false);
  };

  useEffect(() => { fetchLevels(); }, [refreshTrigger]);
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const handleCreateLevel = async () => {
    if (!newLevelName.trim()) return;
    const { error } = await supabase.from('audio_levels').insert({ name: newLevelName.trim() });
    if (error) toast.error('Fehler beim Erstellen: ' + error.message);
    else { toast.success('Level erstellt'); setNewLevelName(''); fetchLevels(); onRefresh(); }
  };

  const handleRenameLevel = async (id: string) => {
    if (!editingLevelName.trim()) return;
    const { error } = await supabase.from('audio_levels').update({ name: editingLevelName.trim() }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Level umbenannt'); setEditingLevelId(null); fetchLevels(); }
  };

  const handleDeleteLevel = async (id: string) => {
    const { error } = await supabase.from('audio_levels').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Level gelöscht'); fetchLevels(); onRefresh(); }
  };

  const handleRemoveFromLevel = async (itemId: string, audioId: string) => {
    await supabase.from('audio_level_items').delete().eq('id', itemId);
    await supabase.from('audio_files').update({ level_id: null }).eq('id', audioId);
    toast.success('Aus Level entfernt');
    fetchLevels(); onRefresh();
  };

  const handleReorder = async (levelId: string, fromIndex: number, toIndex: number) => {
    const level = levels.find(l => l.id === levelId);
    if (!level) return;
    const newItems = [...level.items];
    const [moved] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, moved);
    setLevels(prev => prev.map(l => l.id === levelId ? { ...l, items: newItems.map((item, i) => ({ ...item, position: i })) } : l));
    for (const [i, item] of newItems.entries()) {
      await supabase.from('audio_level_items').update({ position: i }).eq('id', item.id);
    }
  };

  const handlePlayPause = (audioId: string, storageUrl: string) => {
    if (playingAudioId === audioId) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      const audio = new Audio(storageUrl);
      audio.onended = () => setPlayingAudioId(null);
      audio.play();
      audioRef.current = audio;
      setPlayingAudioId(audioId);
    }
  };

  if (isLoading) return <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input value={newLevelName} onChange={(e) => setNewLevelName(e.target.value)} placeholder="Neues Level..."
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreateLevel(); }} />
        <Button onClick={handleCreateLevel} disabled={!newLevelName.trim()}><Plus className="w-4 h-4 mr-2" />Erstellen</Button>
      </div>

      {levels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Layers className="w-12 h-12 mb-4 opacity-50" />
          <p>Keine Levels vorhanden</p>
        </div>
      ) : (
        <div className="space-y-3">
          {levels.map(level => {
            const isEditing = editingLevelId === level.id;
            const isOpen = openLevelId === level.id;
            return (
              <Collapsible key={level.id} open={isOpen} onOpenChange={(open) => setOpenLevelId(open ? level.id : null)}>
                <div className="bg-muted rounded-lg overflow-hidden">
                  <div className="flex items-center gap-3 p-3">
                    <Layers className="w-5 h-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input value={editingLevelName} onChange={(e) => setEditingLevelName(e.target.value)} className="h-8" autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter') handleRenameLevel(level.id); if (e.key === 'Escape') setEditingLevelId(null); }} />
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleRenameLevel(level.id)}><Check className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingLevelId(null)}><X className="w-4 h-4" /></Button>
                        </div>
                      ) : (
                        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                          <p className="font-medium">{level.name}</p>
                          <span className="text-sm text-muted-foreground">({level.items.length} Tracks)</span>
                        </CollapsibleTrigger>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingLevelId(level.id); setEditingLevelName(level.name); }}><Edit2 className="w-4 h-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Level löschen?</AlertDialogTitle>
                              <AlertDialogDescription>"{level.name}" wird gelöscht. Die Audios bleiben in der Library.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteLevel(level.id)} className="bg-destructive hover:bg-destructive/90">Löschen</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                  <CollapsibleContent>
                    <div className="border-t border-border p-3 space-y-2">
                      {level.items.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Keine Tracks. Weise Audios aus der Library zu.</p>
                      ) : level.items.map((item, index) => (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={() => setDraggingItem({ levelId: level.id, index })}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (draggingItem?.levelId === level.id && draggingItem.index !== index) {
                              handleReorder(level.id, draggingItem.index, index);
                              setDraggingItem({ levelId: level.id, index });
                            }
                          }}
                          onDragEnd={() => setDraggingItem(null)}
                          className={`flex items-center gap-3 p-2 rounded-lg bg-background cursor-grab active:cursor-grabbing ${draggingItem?.levelId === level.id && draggingItem.index === index ? 'opacity-50' : ''}`}
                        >
                          <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="w-6 text-center text-sm font-bold text-muted-foreground">{index + 1}</span>
                          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => handlePlayPause(item.audio_id, item.audio_files.storage_url)}>
                            {playingAudioId === item.audio_id ? <Pause className="w-4 h-4 text-primary" /> : <Play className="w-4 h-4 text-primary" />}
                          </Button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.audio_files.display_name}</p>
                          </div>
                          {item.audio_files.duration_seconds && (
                            <span className="text-xs text-muted-foreground">{formatTime(item.audio_files.duration_seconds)}</span>
                          )}
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive shrink-0" onClick={() => handleRemoveFromLevel(item.id, item.audio_id)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── AudioPlayerManager (main export) ────────────────────────────────────────

type SubTab = 'upload' | 'library' | 'levels';

export function AudioPlayerManager() {
  const [subTab, setSubTab] = useState<SubTab>('upload');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [levels, setLevels] = useState<AudioLevel[]>([]);

  const fetchLevels = async () => {
    const { data } = await supabase.from('audio_levels').select('id, name').order('created_at', { ascending: true });
    if (data) setLevels(data.map(l => ({ ...l, items: [] })));
  };

  useEffect(() => { fetchLevels(); }, [refreshTrigger]);

  const refresh = () => setRefreshTrigger(t => t + 1);

  return (
    <div className="space-y-6">
      <div className="admin-tabs">
        {(['upload', 'library', 'levels'] as SubTab[]).map(tab => (
          <button key={tab} onClick={() => setSubTab(tab)} className={`admin-tab ${subTab === tab ? 'admin-tab-active' : ''}`}>
            {tab === 'upload' ? 'Upload' : tab === 'library' ? 'Library' : 'Levels'}
          </button>
        ))}
      </div>

      {subTab === 'upload' && <AudioUpload onUploadComplete={refresh} levels={levels} />}
      {subTab === 'library' && <AudioLibrary refreshTrigger={refreshTrigger} onRefresh={refresh} levels={levels} />}
      {subTab === 'levels' && <AudioLevelManager refreshTrigger={refreshTrigger} onRefresh={refresh} />}
    </div>
  );
}
