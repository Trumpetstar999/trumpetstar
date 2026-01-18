import { useState, useRef } from 'react';
import { Plus, Upload, Music, Trash2, Edit, Search, Loader2, FileSpreadsheet, Download } from 'lucide-react';
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
import * as XLSX from 'xlsx';

interface RepertoireItem {
  id: string;
  title: string;
  composer: string | null;
  type: string | null;
  difficulty: string | null;
  key: string | null;
  tempo_bpm: number | null;
  techniques_tags: string[];
  goal: string | null;
  common_pitfalls: string | null;
  practice_steps: string | null;
  target_minutes: number | null;
  plan_required: 'FREE' | 'BASIC' | 'PREMIUM';
  notes: string | null;
  language: 'de' | 'en' | 'both';
  created_at: string;
}

const DIFFICULTY_OPTIONS = ['Anfänger', 'Leicht', 'Mittel', 'Fortgeschritten', 'Schwer', 'Sehr schwer'];
const TYPE_OPTIONS = ['Etüde', 'Solo', 'Orchesterstelle', 'Jazz Standard', 'Pop/Rock', 'Klassik', 'Warm-up', 'Technik'];

export function AssistantRepertoireManager() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RepertoireItem | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    composer: '',
    type: '',
    difficulty: '',
    key: '',
    tempo_bpm: '',
    techniques_tags: '',
    goal: '',
    common_pitfalls: '',
    practice_steps: '',
    target_minutes: '',
    plan_required: 'FREE' as RepertoireItem['plan_required'],
    notes: '',
    language: 'de' as RepertoireItem['language'],
  });

  // Fetch repertoire items
  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['repertoire-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('repertoire_items')
        .select('*')
        .order('title');
      
      if (error) throw error;
      return data as RepertoireItem[];
    },
  });

  // Create item
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('repertoire_items')
        .insert({
          title: data.title,
          composer: data.composer || null,
          type: data.type || null,
          difficulty: data.difficulty || null,
          key: data.key || null,
          tempo_bpm: data.tempo_bpm ? parseInt(data.tempo_bpm) : null,
          techniques_tags: data.techniques_tags.split(',').map(t => t.trim()).filter(Boolean),
          goal: data.goal || null,
          common_pitfalls: data.common_pitfalls || null,
          practice_steps: data.practice_steps || null,
          target_minutes: data.target_minutes ? parseInt(data.target_minutes) : null,
          plan_required: data.plan_required,
          notes: data.notes || null,
          language: data.language,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repertoire-items'] });
      toast.success('Stück hinzugefügt');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });

  // Update item
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { error } = await supabase
        .from('repertoire_items')
        .update({
          title: data.title,
          composer: data.composer || null,
          type: data.type || null,
          difficulty: data.difficulty || null,
          key: data.key || null,
          tempo_bpm: data.tempo_bpm ? parseInt(data.tempo_bpm) : null,
          techniques_tags: data.techniques_tags.split(',').map(t => t.trim()).filter(Boolean),
          goal: data.goal || null,
          common_pitfalls: data.common_pitfalls || null,
          practice_steps: data.practice_steps || null,
          target_minutes: data.target_minutes ? parseInt(data.target_minutes) : null,
          plan_required: data.plan_required,
          notes: data.notes || null,
          language: data.language,
        })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repertoire-items'] });
      toast.success('Stück aktualisiert');
      setEditingItem(null);
      resetForm();
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });

  // Delete item
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('repertoire_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repertoire-items'] });
      toast.success('Stück gelöscht');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      composer: '',
      type: '',
      difficulty: '',
      key: '',
      tempo_bpm: '',
      techniques_tags: '',
      goal: '',
      common_pitfalls: '',
      practice_steps: '',
      target_minutes: '',
      plan_required: 'FREE',
      notes: '',
      language: 'de',
    });
  };

  // Parse a single CSV line respecting quoted fields
  const parseCSVLine = (line: string, delimiter: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    return values;
  };

  // Parse CSV/TSV content
  const parseSpreadsheet = (content: string): Partial<RepertoireItem>[] => {
    const lines = content.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];

    // Detect delimiter - check if tabs exist, otherwise use comma
    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const headers = parseCSVLine(lines[0], delimiter).map(h => h.toLowerCase().replace(/^"|"$/g, ''));

    console.log('CSV Import - Headers detected:', headers);
    console.log('CSV Import - Delimiter:', delimiter === '\t' ? 'TAB' : 'COMMA');
    console.log('CSV Import - Total lines:', lines.length - 1);

    return lines.slice(1).map((line, lineIndex) => {
      const values = parseCSVLine(line, delimiter);
      const item: any = {};

      headers.forEach((header, i) => {
        const value = values[i] || '';
        switch (header) {
          case 'title':
          case 'titel':
            item.title = value;
            break;
          case 'composer':
          case 'komponist':
            item.composer = value;
            break;
          case 'type':
          case 'typ':
            item.type = value;
            break;
          case 'difficulty':
          case 'schwierigkeit':
            item.difficulty = value;
            break;
          case 'key':
          case 'tonart':
            item.key = value;
            break;
          case 'tempo':
          case 'tempo_bpm':
          case 'bpm':
            item.tempo_bpm = parseInt(value) || null;
            break;
          case 'techniques':
          case 'techniken':
          case 'techniques_tags':
            item.techniques_tags = value.split(/[,;]/).map((t: string) => t.trim()).filter(Boolean);
            break;
          case 'goal':
          case 'ziel':
            item.goal = value;
            break;
          case 'pitfalls':
          case 'common_pitfalls':
          case 'fehler':
            item.common_pitfalls = value;
            break;
          case 'steps':
          case 'practice_steps':
          case 'übungsschritte':
            item.practice_steps = value;
            break;
          case 'minutes':
          case 'target_minutes':
          case 'dauer':
            item.target_minutes = parseInt(value) || null;
            break;
          case 'plan':
          case 'plan_required':
            item.plan_required = ['FREE', 'BASIC', 'PREMIUM'].includes(value.toUpperCase()) 
              ? value.toUpperCase() 
              : 'FREE';
            break;
          case 'notes':
          case 'notizen':
            item.notes = value;
            break;
          case 'language':
          case 'sprache':
            item.language = ['de', 'en', 'both'].includes(value.toLowerCase()) 
              ? value.toLowerCase() 
              : 'both';
            break;
        }
      });

      if (lineIndex < 3) {
        console.log(`CSV Import - Row ${lineIndex + 1}:`, item);
      }

      return item;
    }).filter(item => item.title);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      let items: Partial<RepertoireItem>[] = [];
      
      // Check if it's an Excel file
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csvContent = XLSX.utils.sheet_to_csv(worksheet);
        items = parseSpreadsheet(csvContent);
      } else {
        const text = await file.text();
        items = parseSpreadsheet(text);
      }

      if (items.length === 0) {
        toast.error('Keine gültigen Einträge gefunden');
        return;
      }

      // Insert items in batches
      const batchSize = 50;
      let imported = 0;

      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)
          .filter(item => item.title) // Ensure title exists
          .map(item => ({
            title: item.title as string,
            composer: item.composer || null,
            type: item.type || null,
            difficulty: item.difficulty || null,
            key: item.key || null,
            tempo_bpm: item.tempo_bpm || null,
            techniques_tags: item.techniques_tags || [],
            goal: item.goal || null,
            common_pitfalls: item.common_pitfalls || null,
            practice_steps: item.practice_steps || null,
            target_minutes: item.target_minutes || null,
            plan_required: (item.plan_required as 'FREE' | 'BASIC' | 'PREMIUM') || 'FREE',
            notes: item.notes || null,
            language: (item.language as 'de' | 'en' | 'both') || 'both',
          }));

        if (batch.length === 0) continue;

        const { error } = await supabase.from('repertoire_items').insert(batch);
        if (error) throw error;
        imported += batch.length;
      }

      queryClient.invalidateQueries({ queryKey: ['repertoire-items'] });
      toast.success(`${imported} Stücke importiert`);
    } catch (error) {
      toast.error('Import-Fehler: ' + (error as Error).message);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    const headers = 'Title,Composer,Type,Difficulty,Key,Tempo_BPM,Techniques,Goal,Pitfalls,Steps,Minutes,Plan,Notes,Language';
    const example = 'Arban Etüde Nr. 1,Jean-Baptiste Arban,Etüde,Mittel,C-Dur,120,"Bindungen, Artikulation",Legato verbessern,Zu kurze Bindungen,1. Langsam üben 2. Tempo steigern,15,FREE,Klassische Etüde,de';
    const csv = `${headers}\n${example}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'repertoire_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const openEdit = (item: RepertoireItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      composer: item.composer || '',
      type: item.type || '',
      difficulty: item.difficulty || '',
      key: item.key || '',
      tempo_bpm: item.tempo_bpm?.toString() || '',
      techniques_tags: item.techniques_tags?.join(', ') || '',
      goal: item.goal || '',
      common_pitfalls: item.common_pitfalls || '',
      practice_steps: item.practice_steps || '',
      target_minutes: item.target_minutes?.toString() || '',
      plan_required: item.plan_required,
      notes: item.notes || '',
      language: item.language,
    });
  };

  const handleSubmit = () => {
    if (editingItem) {
      updateMutation.mutate({ ...formData, id: editingItem.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.composer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || item.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Nach Titel oder Komponist suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Schwierigkeit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Stufen</SelectItem>
              {DIFFICULTY_OPTIONS.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Vorlage
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
            CSV importieren
          </Button>
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Stück hinzufügen
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="admin-card p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{items.length}</div>
          <div className="text-sm text-slate-500">Gesamt</div>
        </div>
        <div className="admin-card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {items.filter(i => i.plan_required === 'FREE').length}
          </div>
          <div className="text-sm text-slate-500">FREE</div>
        </div>
        <div className="admin-card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {items.filter(i => i.plan_required === 'BASIC').length}
          </div>
          <div className="text-sm text-slate-500">BASIC</div>
        </div>
        <div className="admin-card p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {items.filter(i => i.plan_required === 'PREMIUM').length}
          </div>
          <div className="text-sm text-slate-500">PREMIUM</div>
        </div>
      </div>

      {/* Items List */}
      <div className="admin-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Music className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Keine Stücke gefunden</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Komponist</th>
                <th>Typ</th>
                <th>Schwierigkeit</th>
                <th>Plan</th>
                <th className="w-24">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td className="font-medium">{item.title}</td>
                  <td className="text-slate-500">{item.composer || '-'}</td>
                  <td>
                    {item.type && <Badge variant="secondary">{item.type}</Badge>}
                  </td>
                  <td>{item.difficulty || '-'}</td>
                  <td>
                    <Badge className={
                      item.plan_required === 'PREMIUM' ? 'bg-purple-100 text-purple-700' :
                      item.plan_required === 'BASIC' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }>
                      {item.plan_required}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => deleteMutation.mutate(item.id)}
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
      <Dialog open={isCreateOpen || !!editingItem} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setEditingItem(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Stück bearbeiten' : 'Neues Stück hinzufügen'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Titel *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="z.B. Arban Etüde Nr. 1"
                />
              </div>

              <div className="space-y-2">
                <Label>Komponist</Label>
                <Input
                  value={formData.composer}
                  onChange={(e) => setFormData(prev => ({ ...prev, composer: e.target.value }))}
                  placeholder="z.B. Jean-Baptiste Arban"
                />
              </div>

              <div className="space-y-2">
                <Label>Typ</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Schwierigkeit</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, difficulty: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_OPTIONS.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tonart</Label>
                <Input
                  value={formData.key}
                  onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="z.B. C-Dur"
                />
              </div>

              <div className="space-y-2">
                <Label>Tempo (BPM)</Label>
                <Input
                  type="number"
                  value={formData.tempo_bpm}
                  onChange={(e) => setFormData(prev => ({ ...prev, tempo_bpm: e.target.value }))}
                  placeholder="z.B. 120"
                />
              </div>

              <div className="space-y-2">
                <Label>Zielzeit (Minuten)</Label>
                <Input
                  type="number"
                  value={formData.target_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_minutes: e.target.value }))}
                  placeholder="z.B. 15"
                />
              </div>

              <div className="space-y-2">
                <Label>Plan</Label>
                <Select
                  value={formData.plan_required}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, plan_required: v as RepertoireItem['plan_required'] }))}
                >
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
            </div>

            <div className="space-y-2">
              <Label>Techniken (kommagetrennt)</Label>
              <Input
                value={formData.techniques_tags}
                onChange={(e) => setFormData(prev => ({ ...prev, techniques_tags: e.target.value }))}
                placeholder="Bindungen, Artikulation, Höhe"
              />
            </div>

            <div className="space-y-2">
              <Label>Ziel</Label>
              <Textarea
                value={formData.goal}
                onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                placeholder="Was soll der Schüler mit diesem Stück lernen?"
              />
            </div>

            <div className="space-y-2">
              <Label>Typische Fehler</Label>
              <Textarea
                value={formData.common_pitfalls}
                onChange={(e) => setFormData(prev => ({ ...prev, common_pitfalls: e.target.value }))}
                placeholder="Welche Fehler machen Schüler häufig?"
              />
            </div>

            <div className="space-y-2">
              <Label>Übungsschritte</Label>
              <Textarea
                value={formData.practice_steps}
                onChange={(e) => setFormData(prev => ({ ...prev, practice_steps: e.target.value }))}
                placeholder="Schritt-für-Schritt Anleitung zum Üben"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateOpen(false);
              setEditingItem(null);
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
              {editingItem ? 'Speichern' : 'Hinzufügen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
