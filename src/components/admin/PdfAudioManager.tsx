import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  ArrowLeft, Upload, Trash2, Loader2, Music, Search, 
  Check, X, Edit2, Save, FileAudio, Wand2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface AudioTrack {
  id: string;
  pdf_document_id: string;
  level_id: string | null;
  title: string;
  original_filename: string;
  audio_url: string;
  duration: number | null;
  page_number: number;
  sort_index: number;
  created_at: string;
}

interface PdfAudioManagerProps {
  pdfId: string;
  pdfTitle: string;
  pageCount: number;
  onBack: () => void;
}

// Helper to extract page number from filename
function extractPageFromFilename(filename: string): number | null {
  // Match patterns like: p12, page12, Page_12, -12-, _12_, 12.mp3
  const patterns = [
    /[pP]age[_\s-]?(\d+)/,
    /[pP](\d+)/,
    /[_\-\s](\d+)[_\-\s\.]/,
    /^(\d+)[_\-\s\.]/,
  ];
  
  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0) return num;
    }
  }
  return null;
}

export function PdfAudioManager({ pdfId, pdfTitle, pageCount, onBack }: PdfAudioManagerProps) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPage, setFilterPage] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPage, setEditPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const parentRef = useRef<HTMLDivElement>(null);

  // Fetch audio tracks
  const { data: tracks, isLoading } = useQuery({
    queryKey: ['pdf-audio-tracks', pdfId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_audio_tracks')
        .select('*')
        .eq('pdf_document_id', pdfId)
        .order('page_number', { ascending: true })
        .order('sort_index', { ascending: true });
      if (error) throw error;
      return data as AudioTrack[];
    },
  });

  // Filter tracks
  const filteredTracks = useMemo(() => {
    return tracks?.filter(track => {
      const matchesSearch = track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           track.original_filename.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPage = filterPage === 'all' || track.page_number === parseInt(filterPage);
      return matchesSearch && matchesPage;
    }) || [];
  }, [tracks, searchTerm, filterPage]);

  // Virtual list for performance with 200+ tracks
  const rowVirtualizer = useVirtualizer({
    count: filteredTracks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      setIsUploading(true);
      setUploadProgress(0);
      const total = files.length;
      let completed = 0;
      const errors: string[] = [];

      for (const file of Array.from(files)) {
        try {
          // Upload to storage
          const fileName = `${pdfId}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('pdf-audio')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('pdf-audio')
            .getPublicUrl(fileName);

          // Extract page number from filename
          const suggestedPage = extractPageFromFilename(file.name);
          const pageNumber = suggestedPage && suggestedPage <= pageCount ? suggestedPage : 1;

          // Get duration from audio file
          let duration: number | null = null;
          try {
            const audio = new Audio(URL.createObjectURL(file));
            await new Promise((resolve) => {
              audio.addEventListener('loadedmetadata', () => {
                duration = Math.round(audio.duration);
                resolve(null);
              });
              audio.addEventListener('error', () => resolve(null));
            });
          } catch (e) {
            console.error('Error getting duration:', e);
          }

          // Create database record
          const { error: dbError } = await supabase
            .from('pdf_audio_tracks')
            .insert({
              pdf_document_id: pdfId,
              title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
              original_filename: file.name,
              audio_url: urlData.publicUrl,
              page_number: pageNumber,
              duration,
            });

          if (dbError) throw dbError;
        } catch (e) {
          errors.push(file.name);
          console.error(`Error uploading ${file.name}:`, e);
        }

        completed++;
        setUploadProgress(Math.round((completed / total) * 100));
      }

      if (errors.length > 0) {
        throw new Error(`${errors.length} Dateien konnten nicht hochgeladen werden`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-audio-tracks', pdfId] });
      queryClient.invalidateQueries({ queryKey: ['pdf-track-counts'] });
      toast.success('Audios erfolgreich hochgeladen');
      setIsUploading(false);
      setUploadProgress(0);
    },
    onError: (error) => {
      toast.error(error.message);
      setIsUploading(false);
    },
  });

  // Update track mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, title, page_number }: { id: string; title: string; page_number: number }) => {
      const { error } = await supabase
        .from('pdf_audio_tracks')
        .update({ title, page_number })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-audio-tracks', pdfId] });
      toast.success('Track aktualisiert');
      setEditingId(null);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('pdf_audio_tracks')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-audio-tracks', pdfId] });
      queryClient.invalidateQueries({ queryKey: ['pdf-track-counts'] });
      toast.success('Tracks gelöscht');
      setSelectedIds(new Set());
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Auto-map pages by filename
  const autoMapPages = useCallback(async () => {
    if (!tracks) return;
    
    const updates: { id: string; page_number: number }[] = [];
    
    for (const track of tracks) {
      const suggestedPage = extractPageFromFilename(track.original_filename);
      if (suggestedPage && suggestedPage <= pageCount && suggestedPage !== track.page_number) {
        updates.push({ id: track.id, page_number: suggestedPage });
      }
    }

    if (updates.length === 0) {
      toast.info('Keine automatischen Zuordnungen gefunden');
      return;
    }

    for (const update of updates) {
      await supabase
        .from('pdf_audio_tracks')
        .update({ page_number: update.page_number })
        .eq('id', update.id);
    }

    queryClient.invalidateQueries({ queryKey: ['pdf-audio-tracks', pdfId] });
    toast.success(`${updates.length} Tracks automatisch zugeordnet`);
  }, [tracks, pageCount, pdfId, queryClient]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadMutation.mutate(files);
    }
  };

  const startEdit = (track: AudioTrack) => {
    setEditingId(track.id);
    setEditTitle(track.title);
    setEditPage(track.page_number);
  };

  const saveEdit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, title: editTitle, page_number: editPage });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredTracks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTracks.map(t => t.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{pdfTitle}</h2>
          <p className="text-sm text-slate-500">{pageCount} Seiten • {tracks?.length || 0} Audio-Tracks</p>
        </div>
      </div>

      {/* Upload Area */}
      <div className="admin-card p-6">
        <Label className="text-base font-medium">Audio-Dateien hochladen</Label>
        <p className="text-sm text-slate-500 mt-1 mb-4">
          MP3, WAV oder M4A. Seiten werden automatisch aus dem Dateinamen erkannt (z.B. "p12", "page_12").
        </p>
        
        <label className={cn(
          "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
          isUploading ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
        )}>
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
              <span className="text-sm text-blue-600 font-medium">{uploadProgress}% hochgeladen</span>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-sm text-slate-600 font-medium">Dateien auswählen oder hierher ziehen</span>
              <span className="text-xs text-slate-400 mt-1">Multi-Upload unterstützt</span>
            </>
          )}
          <input
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Select value={filterPage} onValueChange={setFilterPage}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Seite filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Seiten</SelectItem>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map(page => (
                <SelectItem key={page} value={page.toString()}>Seite {page}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={autoMapPages} className="gap-1.5">
            <Wand2 className="w-4 h-4" />
            Auto-Zuordnung
          </Button>
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm(`${selectedIds.size} Tracks wirklich löschen?`)) {
                  deleteMutation.mutate(Array.from(selectedIds));
                }
              }}
              className="gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              {selectedIds.size} löschen
            </Button>
          )}
        </div>
      </div>

      {/* Track List Header */}
      {filteredTracks.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-lg text-sm font-medium text-slate-600">
          <input
            type="checkbox"
            checked={selectedIds.size === filteredTracks.length && filteredTracks.length > 0}
            onChange={selectAll}
            className="w-4 h-4 rounded"
          />
          <span className="w-8">#</span>
          <span className="flex-1">Titel</span>
          <span className="w-24 text-center">Seite</span>
          <span className="w-20 text-center">Dauer</span>
          <span className="w-24">Aktionen</span>
        </div>
      )}

      {/* Track List (Virtualized) */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : filteredTracks.length === 0 ? (
        <div className="admin-card p-12 text-center">
          <FileAudio className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">Keine Audio-Tracks</h3>
          <p className="text-slate-500 text-sm">Lade Audio-Dateien hoch, um zu starten.</p>
        </div>
      ) : (
        <div
          ref={parentRef}
          className="h-[500px] overflow-auto rounded-lg border border-slate-200 bg-white"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const track = filteredTracks[virtualRow.index];
              const isEditing = editingId === track.id;

              return (
                <div
                  key={track.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={cn(
                    "flex items-center gap-4 px-4 border-b border-slate-100 hover:bg-slate-50 transition-colors",
                    selectedIds.has(track.id) && "bg-blue-50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(track.id)}
                    onChange={() => toggleSelect(track.id)}
                    className="w-4 h-4 rounded"
                  />
                  
                  <span className="w-8 text-sm text-slate-400">{virtualRow.index + 1}</span>
                  
                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="h-8"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-sm font-medium text-slate-700 truncate">{track.title}</span>
                      </div>
                    )}
                  </div>

                  {/* Page Number */}
                  <div className="w-24 text-center">
                    {isEditing ? (
                      <Select value={editPage.toString()} onValueChange={(v) => setEditPage(parseInt(v))}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: pageCount }, (_, i) => i + 1).map(page => (
                            <SelectItem key={page} value={page.toString()}>{page}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded">
                        S. {track.page_number}
                      </span>
                    )}
                  </div>

                  {/* Duration */}
                  <span className="w-20 text-center text-sm text-slate-500">
                    {track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '-'}
                  </span>

                  {/* Actions */}
                  <div className="w-24 flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={saveEdit}>
                          <Save className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(track)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => {
                            if (confirm('Track wirklich löschen?')) {
                              deleteMutation.mutate([track.id]);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Footer */}
      {tracks && tracks.length > 0 && (
        <div className="text-sm text-slate-500 text-center">
          {filteredTracks.length} von {tracks.length} Tracks angezeigt
        </div>
      )}
    </div>
  );
}
