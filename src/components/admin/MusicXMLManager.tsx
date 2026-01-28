import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { MultilingualInput } from './MultilingualInput';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Music, 
  Upload, 
  Search, 
  FileMusic,
  ArrowLeft,
  Headphones,
  Globe
} from 'lucide-react';

interface MusicXMLDocument {
  id: string;
  level_id: string | null;
  title: string;
  title_en: string | null;
  title_es: string | null;
  category: string | null;
  category_en: string | null;
  category_es: string | null;
  plan_required: string;
  xml_file_url: string;
  is_active: boolean;
  sort_index: number;
  created_at: string;
  levels?: { title: string } | null;
}

interface Level {
  id: string;
  title: string;
}

interface MusicXMLManagerProps {
  onManageAudio?: (docId: string, docTitle: string) => void;
}

export function MusicXMLManager({ onManageAudio }: MusicXMLManagerProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<MusicXMLDocument | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleEs, setTitleEs] = useState('');
  const [category, setCategory] = useState('');
  const [categoryEn, setCategoryEn] = useState('');
  const [categoryEs, setCategoryEs] = useState('');
  const [levelId, setLevelId] = useState<string>('none');
  const [planRequired, setPlanRequired] = useState('BASIC');
  const [isActive, setIsActive] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['admin-musicxml'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('musicxml_documents')
        .select('*, levels(title)')
        .order('sort_index', { ascending: true });
      
      if (error) throw error;
      return data as MusicXMLDocument[];
    },
  });

  // Fetch levels
  const { data: levels = [] } = useQuery({
    queryKey: ['levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('levels')
        .select('id, title')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as Level[];
    },
  });

  // Fetch audio track counts
  const { data: audioTrackCounts = {} } = useQuery({
    queryKey: ['musicxml-audio-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('musicxml_audio_tracks')
        .select('musicxml_document_id');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(track => {
        counts[track.musicxml_document_id] = (counts[track.musicxml_document_id] || 0) + 1;
      });
      return counts;
    },
  });

  // Upload file
  const uploadFile = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for small files
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const { error } = await supabase.storage
        .from('musicxml-files')
        .upload(fileName, file);

      clearInterval(progressInterval);

      if (error) throw error;

      setUploadProgress(100);

      const { data: { publicUrl } } = supabase.storage
        .from('musicxml-files')
        .getPublicUrl(fileName);

      return publicUrl;
    } finally {
      setIsUploading(false);
    }
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      let xmlFileUrl = editingDoc?.xml_file_url || '';

      if (selectedFile) {
        xmlFileUrl = await uploadFile(selectedFile);
      }

      if (!xmlFileUrl) {
        throw new Error('XML-Datei erforderlich');
      }

      const docData = {
        title,
        title_en: titleEn || null,
        title_es: titleEs || null,
        category: category || null,
        category_en: categoryEn || null,
        category_es: categoryEs || null,
        level_id: levelId === 'none' ? null : levelId,
        plan_required: planRequired,
        is_active: isActive,
        xml_file_url: xmlFileUrl,
      };

      if (editingDoc) {
        const { error } = await supabase
          .from('musicxml_documents')
          .update(docData)
          .eq('id', editingDoc.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('musicxml_documents')
          .insert({
            ...docData,
            sort_index: documents.length,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-musicxml'] });
      toast.success(editingDoc ? 'Dokument aktualisiert' : 'Dokument erstellt');
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('musicxml_documents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-musicxml'] });
      toast.success('Dokument gelöscht');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });

  const handleOpenDialog = (doc?: MusicXMLDocument) => {
    if (doc) {
      setEditingDoc(doc);
      setTitle(doc.title);
      setTitleEn(doc.title_en || '');
      setTitleEs(doc.title_es || '');
      setCategory(doc.category || '');
      setCategoryEn(doc.category_en || '');
      setCategoryEs(doc.category_es || '');
      setLevelId(doc.level_id || 'none');
      setPlanRequired(doc.plan_required);
      setIsActive(doc.is_active);
    } else {
      setEditingDoc(null);
      setTitle('');
      setTitleEn('');
      setTitleEs('');
      setCategory('');
      setCategoryEn('');
      setCategoryEs('');
      setLevelId('none');
      setPlanRequired('BASIC');
      setIsActive(true);
    }
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingDoc(null);
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xml') && !file.name.endsWith('.musicxml')) {
        toast.error('Nur .xml oder .musicxml Dateien erlaubt');
        return;
      }
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.(xml|musicxml)$/, ''));
      }
    }
  };

  const filteredDocs = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileMusic className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">MusicXML Verwaltung</h2>
            <p className="text-sm text-muted-foreground">{documents.length} Dokumente</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Neues Dokument
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Documents List */}
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-3">
          {filteredDocs.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Music className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{doc.title}</h3>
                        {(doc.title_en || doc.title_es) && (
                          <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {doc.levels?.title && <span>{doc.levels.title}</span>}
                        {doc.category && <span>• {doc.category}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={doc.is_active ? 'default' : 'secondary'}>
                      {doc.is_active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                    <Badge variant="outline">{doc.plan_required}</Badge>
                    
                    {/* Audio tracks count */}
                    <Badge variant="secondary" className="gap-1">
                      <Headphones className="w-3 h-3" />
                      {audioTrackCounts[doc.id] || 0}
                    </Badge>

                    {onManageAudio && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onManageAudio(doc.id, doc.title)}
                      >
                        <Headphones className="w-4 h-4 mr-1" />
                        Audios
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(doc)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm('Dokument löschen?')) {
                          deleteMutation.mutate(doc.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredDocs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileMusic className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Keine MusicXML Dokumente gefunden</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDoc ? 'Dokument bearbeiten' : 'Neues MusicXML Dokument'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>MusicXML Datei {!editingDoc && '*'}</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".xml,.musicxml"
                  onChange={handleFileChange}
                  className="hidden"
                  id="xml-upload"
                />
                <label
                  htmlFor="xml-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  {selectedFile ? (
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {editingDoc ? 'Neue Datei wählen (optional)' : 'Datei wählen'}
                    </span>
                  )}
                </label>
              </div>
              {isUploading && (
                <Progress value={uploadProgress} className="h-2" />
              )}
            </div>

            {/* Title - Multilingual */}
            <MultilingualInput
              label="Titel"
              required
              valueDE={title}
              valueEN={titleEn}
              valueES={titleEs}
              onChangeDE={setTitle}
              onChangeEN={setTitleEn}
              onChangeES={setTitleEs}
              placeholder="z.B. Tonleiter C-Dur"
            />

            {/* Category - Multilingual */}
            <MultilingualInput
              label="Kategorie"
              valueDE={category}
              valueEN={categoryEn}
              valueES={categoryEs}
              onChangeDE={setCategory}
              onChangeEN={setCategoryEn}
              onChangeES={setCategoryEs}
              placeholder="z.B. Tonleitern, Etüden, Stücke"
            />

            {/* Level */}
            <div className="space-y-2">
              <Label>Level-Zuordnung</Label>
              <Select value={levelId} onValueChange={setLevelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Kein Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Level</SelectItem>
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Plan Required */}
            <div className="space-y-2">
              <Label>Plan erforderlich</Label>
              <Select value={planRequired} onValueChange={setPlanRequired}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">FREE</SelectItem>
                  <SelectItem value="BASIC">BASIC</SelectItem>
                  <SelectItem value="PREMIUM">PREMIUM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active */}
            <div className="flex items-center justify-between">
              <Label htmlFor="is-active">Aktiv</Label>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Abbrechen
            </Button>
            <Button 
              onClick={() => saveMutation.mutate()}
              disabled={!title || (!editingDoc && !selectedFile) || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Speichert...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
