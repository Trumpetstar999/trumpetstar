import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Save, Plus, Mail, Eye, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface EmailTemplate {
  id: string;
  template_key: string;
  display_name: string;
  description: string | null;
  subject_de: string;
  subject_en: string;
  subject_es: string;
  body_html_de: string;
  body_html_en: string;
  body_html_es: string;
  created_at: string;
  updated_at: string;
}

export function EmailTemplateManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editData, setEditData] = useState<Partial<EmailTemplate>>({});
  const [previewLang, setPreviewLang] = useState<'de' | 'en' | 'es'>('de');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ template_key: '', display_name: '', description: '' });

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setLoading(true);
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at');

    if (error) {
      toast.error('Fehler beim Laden der Templates');
      console.error(error);
    } else {
      setTemplates((data as unknown as EmailTemplate[]) || []);
      if (!selectedTemplate && data && data.length > 0) {
        const first = data[0] as unknown as EmailTemplate;
        setSelectedTemplate(first);
        setEditData(first);
      }
    }
    setLoading(false);
  }

  function selectTemplate(t: EmailTemplate) {
    setSelectedTemplate(t);
    setEditData(t);
  }

  async function handleSave() {
    if (!selectedTemplate) return;
    setSaving(true);

    const { error } = await supabase
      .from('email_templates')
      .update({
        display_name: editData.display_name,
        description: editData.description,
        subject_de: editData.subject_de,
        subject_en: editData.subject_en,
        subject_es: editData.subject_es,
        body_html_de: editData.body_html_de,
        body_html_en: editData.body_html_en,
        body_html_es: editData.body_html_es,
      } as any)
      .eq('id', selectedTemplate.id);

    if (error) {
      toast.error('Fehler beim Speichern');
      console.error(error);
    } else {
      toast.success('Template gespeichert');
      fetchTemplates();
    }
    setSaving(false);
  }

  async function handleCreate() {
    if (!newTemplate.template_key || !newTemplate.display_name) {
      toast.error('Key und Name sind erforderlich');
      return;
    }

    const { error } = await supabase
      .from('email_templates')
      .insert({
        template_key: newTemplate.template_key,
        display_name: newTemplate.display_name,
        description: newTemplate.description || null,
      } as any);

    if (error) {
      toast.error('Fehler beim Erstellen');
      console.error(error);
    } else {
      toast.success('Template erstellt');
      setShowCreateDialog(false);
      setNewTemplate({ template_key: '', display_name: '', description: '' });
      fetchTemplates();
    }
  }

  function getPreviewHtml() {
    const bodyKey = `body_html_${previewLang}` as keyof typeof editData;
    return (editData[bodyKey] as string) || '';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Template List */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => selectTemplate(t)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedTemplate?.id === t.id
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Mail className="w-4 h-4" />
              {t.display_name}
            </button>
          ))}
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Neues Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neues E-Mail-Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Template Key (eindeutig)</Label>
                <Input
                  value={newTemplate.template_key}
                  onChange={(e) => setNewTemplate({ ...newTemplate, template_key: e.target.value })}
                  placeholder="z.B. welcome_email"
                />
              </div>
              <div>
                <Label>Anzeigename</Label>
                <Input
                  value={newTemplate.display_name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, display_name: e.target.value })}
                  placeholder="z.B. Willkommens-E-Mail"
                />
              </div>
              <div>
                <Label>Beschreibung (optional)</Label>
                <Input
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Wann wird diese E-Mail versendet?"
                />
              </div>
              <Button onClick={handleCreate} className="w-full">
                Template erstellen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Editor */}
      {selectedTemplate && (
        <div className="admin-card">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{editData.display_name}</h3>
                {editData.description && (
                  <p className="text-sm text-slate-500 mt-1">{editData.description}</p>
                )}
              </div>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Speichern
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Editor */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Anzeigename</Label>
                  <Input
                    value={editData.display_name || ''}
                    onChange={(e) => setEditData({ ...editData, display_name: e.target.value })}
                  />
                </div>

                <Tabs defaultValue="de">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="de">🇩🇪 Deutsch</TabsTrigger>
                    <TabsTrigger value="en">🇬🇧 English</TabsTrigger>
                    <TabsTrigger value="es">🇪🇸 Español</TabsTrigger>
                  </TabsList>

                  {(['de', 'en', 'es'] as const).map((lang) => (
                    <TabsContent key={lang} value={lang} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Betreff ({lang.toUpperCase()})</Label>
                        <Input
                          value={(editData[`subject_${lang}` as keyof typeof editData] as string) || ''}
                          onChange={(e) =>
                            setEditData({ ...editData, [`subject_${lang}`]: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>HTML Body ({lang.toUpperCase()})</Label>
                        <Textarea
                          value={(editData[`body_html_${lang}` as keyof typeof editData] as string) || ''}
                          onChange={(e) =>
                            setEditData({ ...editData, [`body_html_${lang}`]: e.target.value })
                          }
                          rows={16}
                          className="font-mono text-xs"
                        />
                        <p className="text-xs text-slate-400">
                          Verfügbare Platzhalter: {'{{magic_link}}'} – wird durch den Login-Link ersetzt
                        </p>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              {/* Right: Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Vorschau
                  </Label>
                  <div className="flex gap-1">
                    {(['de', 'en', 'es'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setPreviewLang(lang)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                          previewLang === lang
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  <div className="bg-white border-b border-slate-200 px-4 py-2">
                    <p className="text-xs text-slate-400">Betreff:</p>
                    <p className="text-sm font-medium text-slate-900">
                      {(editData[`subject_${previewLang}` as keyof typeof editData] as string) || '—'}
                    </p>
                  </div>
                  <div
                    className="p-4 bg-white min-h-[300px]"
                    dangerouslySetInnerHTML={{
                      __html: getPreviewHtml().replace(
                        /\{\{magic_link\}\}/g,
                        '#'
                      ),
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
