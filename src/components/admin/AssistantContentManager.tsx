import { useState, useRef } from 'react';
import { Plus, Upload, FileText, Trash2, Edit, Search, RefreshCw, Loader2, Check, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface KnowledgeSource {
  id: string;
  title: string;
  type: 'method' | 'platform' | 'faq' | 'repertoire' | 'mental';
  language: 'de' | 'en' | 'both';
  visibility: 'FREE' | 'BASIC' | 'PREMIUM' | 'ADMIN';
  tags: string[];
  content: string | null;
  created_at: string;
  updated_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  method: 'Methodik',
  platform: 'Plattform',
  faq: 'FAQ',
  repertoire: 'Repertoire',
  mental: 'Mental',
};

const VISIBILITY_COLORS: Record<string, string> = {
  FREE: 'bg-green-100 text-green-700',
  BASIC: 'bg-blue-100 text-blue-700',
  PREMIUM: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-red-100 text-red-700',
};

// Simple text chunking function
function chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 100): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + para).length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export function AssistantContentManager() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<KnowledgeSource | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    type: 'platform' as KnowledgeSource['type'],
    language: 'de' as KnowledgeSource['language'],
    visibility: 'FREE' as KnowledgeSource['visibility'],
    tags: '',
    content: '',
  });

  // Fetch knowledge sources
  const { data: sources = [], isLoading, refetch } = useQuery({
    queryKey: ['knowledge-sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_sources')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as KnowledgeSource[];
    },
  });

  // Create source with chunks
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Create source
      const { data: source, error: sourceError } = await supabase
        .from('knowledge_sources')
        .insert({
          title: data.title,
          type: data.type,
          language: data.language,
          visibility: data.visibility,
          tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
          content: data.content,
        })
        .select()
        .single();

      if (sourceError) throw sourceError;

      // Create chunks
      if (data.content) {
        const chunks = chunkText(data.content);
        const chunkRecords = chunks.map((text) => ({
          source_id: source.id,
          chunk_text: text,
          tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
          plan_required: data.visibility === 'ADMIN' ? 'PREMIUM' : data.visibility,
        }));

        const { error: chunksError } = await supabase
          .from('knowledge_chunks')
          .insert(chunkRecords);

        if (chunksError) throw chunksError;
      }

      return source;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-sources'] });
      toast.success('Inhalt erstellt und indexiert');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Fehler beim Erstellen: ' + (error as Error).message);
    },
  });

  // Update source
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      // Update source
      const { error: sourceError } = await supabase
        .from('knowledge_sources')
        .update({
          title: data.title,
          type: data.type,
          language: data.language,
          visibility: data.visibility,
          tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
          content: data.content,
        })
        .eq('id', data.id);

      if (sourceError) throw sourceError;

      // Re-create chunks
      await supabase.from('knowledge_chunks').delete().eq('source_id', data.id);

      if (data.content) {
        const chunks = chunkText(data.content);
        const chunkRecords = chunks.map((text) => ({
          source_id: data.id,
          chunk_text: text,
          tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
          plan_required: data.visibility === 'ADMIN' ? 'PREMIUM' : data.visibility,
        }));

        const { error: chunksError } = await supabase
          .from('knowledge_chunks')
          .insert(chunkRecords);

        if (chunksError) throw chunksError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-sources'] });
      toast.success('Inhalt aktualisiert');
      setEditingSource(null);
      resetForm();
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren: ' + (error as Error).message);
    },
  });

  // Delete source
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('knowledge_sources').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-sources'] });
      toast.success('Inhalt gelöscht');
    },
    onError: (error) => {
      toast.error('Fehler beim Löschen: ' + (error as Error).message);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'platform',
      language: 'de',
      visibility: 'FREE',
      tags: '',
      content: '',
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const text = await file.text();
      
      // Extract title from filename
      const title = file.name.replace(/\.(txt|md|markdown)$/i, '');
      
      setFormData(prev => ({
        ...prev,
        title: title,
        content: text,
      }));
      
      setIsCreateOpen(true);
      toast.success('Datei geladen');
    } catch (error) {
      toast.error('Fehler beim Laden der Datei');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const openEdit = (source: KnowledgeSource) => {
    setEditingSource(source);
    setFormData({
      title: source.title,
      type: source.type,
      language: source.language,
      visibility: source.visibility,
      tags: source.tags?.join(', ') || '',
      content: source.content || '',
    });
  };

  const handleSubmit = () => {
    if (editingSource) {
      updateMutation.mutate({ ...formData, id: editingSource.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Filter sources
  const filteredSources = sources.filter(source => {
    const matchesSearch = source.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || source.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Typ filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Typen</SelectItem>
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.markdown"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Datei importieren
          </Button>
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Neuer Inhalt
          </Button>
        </div>
      </div>

      {/* Sources List */}
      <div className="admin-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
          </div>
        ) : filteredSources.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Keine Inhalte gefunden</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Typ</th>
                <th>Sprache</th>
                <th>Sichtbarkeit</th>
                <th>Tags</th>
                <th>Erstellt</th>
                <th className="w-24">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredSources.map((source) => (
                <tr key={source.id}>
                  <td className="font-medium">{source.title}</td>
                  <td>
                    <Badge variant="secondary">{TYPE_LABELS[source.type]}</Badge>
                  </td>
                  <td className="uppercase text-xs">{source.language}</td>
                  <td>
                    <Badge className={VISIBILITY_COLORS[source.visibility]}>
                      {source.visibility}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {source.tags?.slice(0, 3).map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {source.tags?.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{source.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="text-slate-500 text-sm">
                    {new Date(source.created_at).toLocaleDateString('de-DE')}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(source)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => deleteMutation.mutate(source.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || !!editingSource} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setEditingSource(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSource ? 'Inhalt bearbeiten' : 'Neuen Inhalt erstellen'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Titel</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="z.B. Ansatz-Übungen für Anfänger"
                />
              </div>

              <div className="space-y-2">
                <Label>Typ</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as KnowledgeSource['type'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sprache</Label>
                <Select
                  value={formData.language}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, language: v as KnowledgeSource['language'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="en">Englisch</SelectItem>
                    <SelectItem value="both">Beide</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sichtbarkeit</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, visibility: v as KnowledgeSource['visibility'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">FREE (Alle)</SelectItem>
                    <SelectItem value="BASIC">BASIC</SelectItem>
                    <SelectItem value="PREMIUM">PREMIUM</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags (kommagetrennt)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="ansatz, anfänger, basics"
              />
            </div>

            <div className="space-y-2">
              <Label>Inhalt (Markdown unterstützt)</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Der Inhalt wird automatisch in Chunks aufgeteilt und indexiert..."
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateOpen(false);
              setEditingSource(null);
              resetForm();
            }}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.title || createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingSource ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
