import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Upload, 
  Trash2, 
  Music, 
  Search,
  Pencil,
  Check,
  X
} from 'lucide-react';

interface AudioTrack {
  id: string;
  musicxml_document_id: string;
  title: string;
  original_filename: string;
  audio_url: string;
  duration: number | null;
  sort_index: number;
  created_at: string;
}

interface MusicXMLAudioManagerProps {
  docId: string;
  docTitle: string;
  onBack: () => void;
}

export function MusicXMLAudioManager({ docId, docTitle, onBack }: MusicXMLAudioManagerProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fetch audio tracks
  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ['musicxml-audio-tracks', docId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('musicxml_audio_tracks')
        .select('*')
        .eq('musicxml_document_id', docId)
        .order('sort_index', { ascending: true });
      
      if (error) throw error;
      return data as AudioTrack[];
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      setIsUploading(true);
      setUploadProgress(0);

      const totalFiles = files.length;
      let completed = 0;

      for (const file of Array.from(files)) {
        const fileName = `${docId}/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('musicxml-audio')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('musicxml-audio')
          .getPublicUrl(fileName);

        // Get audio duration
        let duration: number | null = null;
        try {
          duration = await getAudioDuration(file);
        } catch (e) {
          console.warn('Could not get audio duration:', e);
        }

        const { error: insertError } = await supabase
          .from('musicxml_audio_tracks')
          .insert({
            musicxml_document_id: docId,
            title: file.name.replace(/\.(mp3|wav|ogg|m4a)$/i, ''),
            original_filename: file.name,
            audio_url: publicUrl,
            duration: duration ? Math.round(duration) : null,
            sort_index: tracks.length + completed,
          });

        if (insertError) throw insertError;

        completed++;
        setUploadProgress(Math.round((completed / totalFiles) * 100));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musicxml-audio-tracks', docId] });
      queryClient.invalidateQueries({ queryKey: ['musicxml-audio-counts'] });
      toast.success('Audio-Tracks hochgeladen');
      setIsUploading(false);
      setUploadProgress(0);
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
      setIsUploading(false);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase
        .from('musicxml_audio_tracks')
        .update({ title })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musicxml-audio-tracks', docId] });
      toast.success('Track aktualisiert');
      setEditingId(null);
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('musicxml_audio_tracks')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musicxml-audio-tracks', docId] });
      queryClient.invalidateQueries({ queryKey: ['musicxml-audio-counts'] });
      toast.success('Tracks gelöscht');
      setSelectedIds(new Set());
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => resolve(audio.duration);
      audio.onerror = reject;
      audio.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadMutation.mutate(files);
    }
  };

  const startEditing = (track: AudioTrack) => {
    setEditingId(track.id);
    setEditingTitle(track.title);
  };

  const saveEditing = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, title: editingTitle });
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredTracks = tracks.filter(track =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Audio-Tracks</h2>
          <p className="text-sm text-muted-foreground">{docTitle}</p>
        </div>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed rounded-lg p-6 text-center">
        <input
          type="file"
          accept="audio/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          id="audio-upload"
          disabled={isUploading}
        />
        <label
          htmlFor="audio-upload"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <Upload className="w-8 h-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Audio-Dateien hierher ziehen oder klicken
          </span>
          <span className="text-xs text-muted-foreground">
            MP3, WAV, OGG, M4A
          </span>
        </label>
        {isUploading && (
          <div className="mt-4">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Wird hochgeladen... {uploadProgress}%
            </p>
          </div>
        )}
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {selectedIds.size > 0 && (
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm(`${selectedIds.size} Track(s) löschen?`)) {
                deleteMutation.mutate(Array.from(selectedIds));
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {selectedIds.size} löschen
          </Button>
        )}
      </div>

      {/* Tracks List */}
      <ScrollArea className="h-[calc(100vh-400px)]">
        <div className="space-y-2">
          {filteredTracks.map((track) => (
            <Card key={track.id} className={selectedIds.has(track.id) ? 'ring-2 ring-primary' : ''}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedIds.has(track.id)}
                    onChange={() => toggleSelect(track.id)}
                    className="w-4 h-4"
                  />

                  {/* Icon */}
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <Music className="w-4 h-4 text-primary" />
                  </div>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    {editingId === track.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="h-8"
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" onClick={saveEditing}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <p className="font-medium truncate">{track.title}</p>
                    )}
                  </div>

                  {/* Duration */}
                  <Badge variant="secondary" className="shrink-0">
                    {formatDuration(track.duration)}
                  </Badge>

                  {/* Actions */}
                  {editingId !== track.id && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditing(track)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm('Track löschen?')) {
                            deleteMutation.mutate([track.id]);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredTracks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Keine Audio-Tracks vorhanden</p>
              <p className="text-sm">Lade Audio-Dateien hoch</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
