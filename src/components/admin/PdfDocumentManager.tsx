import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, FileText, Upload, Trash2, Edit, Loader2, Music, Eye } from 'lucide-react';
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

export function PdfDocumentManager({ onManageAudio }: PdfDocumentManagerProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPdf, setEditingPdf] = useState<PdfDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');

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

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string; pdf_file_url?: string; page_count?: number }) => {
      let pdfUrl = data.pdf_file_url || '';
      let pageCount = data.page_count || 1;

      // Upload PDF if new file
      if (data.pdf_file) {
        setIsUploading(true);
        const fileName = `${Date.now()}-${data.pdf_file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('pdf-documents')
          .upload(fileName, data.pdf_file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('pdf-documents')
          .getPublicUrl(fileName);
        pdfUrl = urlData.publicUrl;

        // Get page count from PDF
        try {
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;
          
          const arrayBuffer = await data.pdf_file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          pageCount = pdf.numPages;
        } catch (e) {
          console.error('Error getting page count:', e);
        }
        setIsUploading(false);
      }

      const payload = {
        title: data.title,
        description: data.description || null,
        level_id: data.level_id || null,
        plan_required: data.plan_required,
        is_active: data.is_active,
        pdf_file_url: pdfUrl,
        page_count: pageCount,
      };

      if (data.id) {
        const { error } = await supabase
          .from('pdf_documents')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pdf_documents')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pdfs'] });
      toast.success(editingPdf ? 'PDF aktualisiert' : 'PDF erstellt');
      handleCloseDialog();
    },
    onError: (error) => {
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
                  onClick={() => window.open(pdf.pdf_file_url, '_blank')}
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPdf ? 'PDF bearbeiten' : 'Neues PDF hochladen'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Upload */}
            {!editingPdf && (
              <div>
                <Label>PDF-Datei *</Label>
                <div className="mt-1.5">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-sm text-slate-500">
                      {formData.pdf_file ? formData.pdf_file.name : 'PDF auswählen'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData(prev => ({ ...prev, pdf_file: file }));
                          if (!formData.title) {
                            setFormData(prev => ({
                              ...prev,
                              pdf_file: file,
                              title: file.name.replace('.pdf', ''),
                            }));
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            )}

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

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Abbrechen</Button>
            <Button
              onClick={handleSubmit}
              disabled={saveMutation.isPending || isUploading}
            >
              {(saveMutation.isPending || isUploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingPdf ? 'Speichern' : 'Hochladen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
