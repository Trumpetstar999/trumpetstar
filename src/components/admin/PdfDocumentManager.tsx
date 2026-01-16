import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Plus, FileText, Upload, Trash2, Edit, Loader2, Music, Eye, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PdfDocument {
  id: string;
  level_id: string | null;
  title: string;
  description: string | null;
  plan_required: string;
  pdf_file_url: string;
  page_count: number;
  is_active: boolean;
  sort_index: number;
  created_at: string;
  levels?: { title: string } | null;
}

interface Level {
  id: string;
  title: string;
}

interface PdfDocumentManagerProps {
  onManageAudio?: (pdfId: string, pdfTitle: string, pageCount: number) => void;
}

interface UploadState {
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  message: string;
}

export function PdfDocumentManager({ onManageAudio }: PdfDocumentManagerProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPdf, setEditingPdf] = useState<PdfDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadState, setUploadState] = useState<UploadState>({
    progress: 0,
    status: 'idle',
    message: '',
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level_id: '',
    plan_required: 'BASIC',
    is_active: true,
    pdf_file: null as File | null,
  });

  // Fetch PDFs
  const { data: pdfs, isLoading } = useQuery({
    queryKey: ['admin-pdfs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_documents')
        .select('*, levels(title)')
        .order('sort_index', { ascending: true });
      if (error) throw error;
      return data as PdfDocument[];
    },
  });

  // Fetch levels
  const { data: levels } = useQuery({
    queryKey: ['levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('levels')
        .select('id, title')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as Level[];
    },
  });

  // Fetch audio track counts per PDF
  const { data: trackCounts } = useQuery({
    queryKey: ['pdf-track-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_audio_tracks')
        .select('pdf_document_id');
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(track => {
        counts[track.pdf_document_id] = (counts[track.pdf_document_id] || 0) + 1;
      });
      return counts;
    },
  });

  // Upload file with progress tracking using XMLHttpRequest
  const uploadFileWithProgress = useCallback(async (file: File): Promise<{ url: string; pageCount: number; fileName: string }> => {
    return new Promise(async (resolve, reject) => {
      const fileName = `${Date.now()}-${file.name}`;
      
      setUploadState({ progress: 0, status: 'uploading', message: 'Upload wird gestartet...' });

      // Get upload URL from Supabase
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      
      if (!token) {
        setUploadState({ progress: 0, status: 'error', message: 'Nicht authentifiziert' });
        reject(new Error('Nicht authentifiziert'));
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const uploadUrl = `${supabaseUrl}/storage/v1/object/pdf-documents/${fileName}`;

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          const uploadedMB = (event.loaded / (1024 * 1024)).toFixed(1);
          const totalMB = (event.total / (1024 * 1024)).toFixed(1);
          setUploadState({
            progress: percentComplete,
            status: 'uploading',
            message: `${uploadedMB} MB / ${totalMB} MB hochgeladen`,
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const { data: urlData } = supabase.storage
            .from('pdf-documents')
            .getPublicUrl(fileName);
          
          // Immediately complete - page count will be updated in background
          setUploadState({ progress: 100, status: 'complete', message: 'Upload abgeschlossen!' });
          resolve({ url: urlData.publicUrl, pageCount: 0, fileName });
        } else {
          let errorMessage = 'Upload fehlgeschlagen';
          try {
            const response = JSON.parse(xhr.responseText);
            errorMessage = response.message || response.error || errorMessage;
          } catch {}
          setUploadState({ progress: 0, status: 'error', message: errorMessage });
          reject(new Error(errorMessage));
        }
      });

      xhr.addEventListener('error', () => {
        setUploadState({ progress: 0, status: 'error', message: 'Netzwerkfehler beim Upload' });
        reject(new Error('Netzwerkfehler beim Upload'));
      });

      xhr.addEventListener('timeout', () => {
        setUploadState({ progress: 0, status: 'error', message: 'Upload-Timeout' });
        reject(new Error('Upload-Timeout'));
      });

      xhr.open('POST', uploadUrl, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Content-Type', 'application/pdf');
      xhr.setRequestHeader('x-upsert', 'true');
      xhr.timeout = 600000; // 10 minutes timeout for large files
      xhr.send(file);
    });
  }, []);

  // Background page count updater - uses fetch to avoid CORS issues with pdfjs
  const updatePageCountInBackground = useCallback(async (pdfUrl: string, docId: string, file?: File) => {
    try {
      let pageCount = 0;
      
      // If we have the original file, use it directly (no CORS issues)
      if (file) {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        pageCount = pdf.numPages;
      }
      
      if (pageCount > 0) {
        await supabase
          .from('pdf_documents')
          .update({ page_count: pageCount })
          .eq('id', docId);
        
        queryClient.invalidateQueries({ queryKey: ['admin-pdfs'] });
        console.log(`Page count updated to ${pageCount} for document ${docId}`);
        toast.success(`Seitenzahl ermittelt: ${pageCount} Seiten`);
      }
    } catch (e) {
      console.error('Background page count update failed:', e);
    }
  }, [queryClient]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string; pdf_file_url?: string; page_count?: number }) => {
      let pdfUrl = data.pdf_file_url || '';
      const originalFile = data.pdf_file;

      // Upload PDF if new file
      if (data.pdf_file) {
        const result = await uploadFileWithProgress(data.pdf_file);
        pdfUrl = result.url;
      }

      const payload = {
        title: data.title,
        description: data.description || null,
        level_id: data.level_id || null,
        plan_required: data.plan_required,
        is_active: data.is_active,
        pdf_file_url: pdfUrl,
        page_count: data.page_count || 0, // Will be updated in background
      };

      let docId = data.id;

      if (data.id) {
        const { error } = await supabase
          .from('pdf_documents')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { data: insertedDoc, error } = await supabase
          .from('pdf_documents')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        docId = insertedDoc.id;
      }

      // Return info for background processing - include the original file
      return { docId, pdfUrl, isNewUpload: !!originalFile, originalFile };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-pdfs'] });
      toast.success(editingPdf ? 'PDF aktualisiert' : 'PDF erstellt');
      handleCloseDialog();
      
      // Start background page count update if new file was uploaded
      // Pass the original file to avoid CORS issues
      if (result.isNewUpload && result.docId && result.pdfUrl && result.originalFile) {
        updatePageCountInBackground(result.pdfUrl, result.docId, result.originalFile);
      }
    },
    onError: (error) => {
      setUploadState({ progress: 0, status: 'error', message: error.message });
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pdf_documents')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pdfs'] });
      toast.success('PDF gelöscht');
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleOpenDialog = (pdf?: PdfDocument) => {
    if (pdf) {
      setEditingPdf(pdf);
      setFormData({
        title: pdf.title,
        description: pdf.description || '',
        level_id: pdf.level_id || '',
        plan_required: pdf.plan_required,
        is_active: pdf.is_active,
        pdf_file: null,
      });
    } else {
      setEditingPdf(null);
      setFormData({
        title: '',
        description: '',
        level_id: '',
        plan_required: 'BASIC',
        is_active: true,
        pdf_file: null,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPdf(null);
    setUploadState({ progress: 0, status: 'idle', message: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, pdf_file: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error('Titel ist erforderlich');
      return;
    }
    if (!editingPdf && !formData.pdf_file) {
      toast.error('PDF-Datei ist erforderlich');
      return;
    }

    saveMutation.mutate({
      ...formData,
      id: editingPdf?.id,
      pdf_file_url: editingPdf?.pdf_file_url,
      page_count: editingPdf?.page_count,
    });
  };

  const filteredPdfs = pdfs?.filter(pdf => {
    const matchesSearch = pdf.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || pdf.level_id === filterLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="PDF suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Level filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Levels</SelectItem>
              {levels?.map(level => (
                <SelectItem key={level.id} value={level.id}>{level.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          PDF hochladen
        </Button>
      </div>

      {/* PDF List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : filteredPdfs?.length === 0 ? (
        <div className="admin-card p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">Keine PDFs gefunden</h3>
          <p className="text-slate-500 text-sm">Lade dein erstes PDF hoch, um zu starten.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPdfs?.map(pdf => (
            <div
              key={pdf.id}
              className={cn(
                "admin-card p-5 relative group",
                !pdf.is_active && "opacity-60"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 truncate">{pdf.title}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {pdf.page_count} Seiten • {trackCounts?.[pdf.id] || 0} Audios
                  </p>
                  {pdf.levels?.title && (
                    <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
                      {pdf.levels.title}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onManageAudio?.(pdf.id, pdf.title, pdf.page_count)}
                  className="flex-1 gap-1.5"
                >
                  <Music className="w-4 h-4" />
                  Audios
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    // Extract file path from full URL
                    const urlParts = pdf.pdf_file_url.split('/storage/v1/object/public/pdf-documents/');
                    const filePath = urlParts[1] || pdf.pdf_file_url.split('/storage/v1/object/sign/pdf-documents/')[1] || pdf.pdf_file_url.split('/pdf-documents/').pop();
                    
                    if (filePath) {
                      const { data, error } = await supabase.storage
                        .from('pdf-documents')
                        .createSignedUrl(filePath, 3600); // 1 hour validity
                      
                      if (data?.signedUrl) {
                        window.open(data.signedUrl, '_blank');
                      } else {
                        console.error('Failed to create signed URL:', error);
                        toast.error('PDF konnte nicht geöffnet werden');
                      }
                    }
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenDialog(pdf)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm('PDF wirklich löschen? Alle zugehörigen Audios werden ebenfalls gelöscht.')) {
                      deleteMutation.mutate(pdf.id);
                    }
                  }}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog - Two Column Layout */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !saveMutation.isPending && setIsDialogOpen(open)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingPdf ? 'PDF bearbeiten' : 'Neues PDF hochladen'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Left Column - File Upload */}
            <div className="space-y-4">
              {!editingPdf && (
                <div>
                  <Label className="text-base font-medium">PDF-Datei *</Label>
                  <p className="text-sm text-muted-foreground mb-3">Unterstützt Dateien bis 150 MB</p>
                  
                  {!formData.pdf_file ? (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-all">
                      <Upload className="w-10 h-10 text-slate-400 mb-3" />
                      <span className="text-sm font-medium text-slate-600">PDF auswählen</span>
                      <span className="text-xs text-slate-400 mt-1">oder hierher ziehen</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 150 * 1024 * 1024) {
                              toast.error('Datei ist größer als 150 MB');
                              return;
                            }
                            setFormData(prev => ({
                              ...prev,
                              pdf_file: file,
                              title: prev.title || file.name.replace('.pdf', ''),
                            }));
                          }
                        }}
                      />
                    </label>
                  ) : (
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{formData.pdf_file.name}</p>
                          <p className="text-sm text-slate-500">{formatFileSize(formData.pdf_file.size)}</p>
                        </div>
                        {uploadState.status === 'idle' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRemoveFile}
                            className="shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {/* Upload Progress */}
                      {uploadState.status !== 'idle' && (
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className={cn(
                              "font-medium",
                              uploadState.status === 'complete' && "text-green-600",
                              uploadState.status === 'error' && "text-red-600"
                            )}>
                              {uploadState.status === 'uploading' && 'Wird hochgeladen...'}
                              {uploadState.status === 'processing' && 'PDF wird verarbeitet...'}
                              {uploadState.status === 'complete' && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Fertig
                                </span>
                              )}
                              {uploadState.status === 'error' && 'Fehler'}
                            </span>
                            <span className="text-slate-500">{uploadState.progress}%</span>
                          </div>
                          <Progress value={uploadState.progress} className="h-2" />
                          <p className="text-xs text-slate-500">{uploadState.message}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {editingPdf && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">Aktuelle Datei</p>
                      <p className="text-sm text-slate-500">{editingPdf.page_count} Seiten</p>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-blue-600"
                        onClick={() => window.open(editingPdf.pdf_file_url, '_blank')}
                      >
                        PDF ansehen
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Form Fields */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <Label>Titel *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="z.B. Arban Übungen Kapitel 1"
                  className="mt-1.5"
                />
              </div>

              {/* Description */}
              <div>
                <Label>Beschreibung</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optionale Beschreibung..."
                  className="mt-1.5"
                  rows={3}
                />
              </div>

              {/* Level */}
              <div>
                <Label>Level zuordnen</Label>
                <Select
                  value={formData.level_id || 'none'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, level_id: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Level auswählen (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Level</SelectItem>
                    {levels?.map(level => (
                      <SelectItem key={level.id} value={level.id}>{level.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Plan Required */}
              <div>
                <Label>Erforderlicher Plan</Label>
                <Select
                  value={formData.plan_required}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, plan_required: value }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">FREE</SelectItem>
                    <SelectItem value="BASIC">BASIC</SelectItem>
                    <SelectItem value="PREMIUM">PREMIUM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between py-2">
                <Label>Aktiv (sichtbar für Nutzer)</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCloseDialog}
              disabled={saveMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saveMutation.isPending || uploadState.status === 'uploading' || uploadState.status === 'processing'}
            >
              {(saveMutation.isPending || uploadState.status === 'uploading' || uploadState.status === 'processing') && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingPdf ? 'Speichern' : 'Hochladen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
