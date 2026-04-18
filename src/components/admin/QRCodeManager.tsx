import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Plus, Pencil, Check, X, Trash2, QrCode, Download } from 'lucide-react';
import { toast } from 'sonner';

interface QRCode {
  id: string;
  code: string;
  content_type: string;
  video_id: string | null;
  audio_id: string | null;
  label: string | null;
  is_active: boolean;
}

interface VideoOption {
  id: string;
  title: string;
  vimeo_video_id: string;
}

interface AudioOption {
  id: string;
  display_name: string;
  level_name?: string | null;
}

export function QRCodeManager() {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [videos, setVideos] = useState<VideoOption[]>([]);
  const [audios, setAudios] = useState<AudioOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<QRCode>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newForm, setNewForm] = useState({ code: '', content_type: 'video', video_id: '', audio_id: '', label: '' });
  const [tab, setTab] = useState<'all' | 'linked' | 'unlinked'>('all');

  const isLinked = (qr: QRCode) =>
    (qr.content_type === 'video' && !!qr.video_id) ||
    (qr.content_type === 'audio' && !!qr.audio_id);

  const linkedCodes = qrCodes.filter(isLinked);
  const unlinkedCodes = qrCodes.filter(qr => !isLinked(qr));
  const visibleCodes =
    tab === 'linked' ? linkedCodes : tab === 'unlinked' ? unlinkedCodes : qrCodes;

  const handleDownloadHtaccess = () => {
    const base = 'https://www.trumpetstar.app';
    const lines: string[] = [
      '# ============================================================',
      '# Trumpetstar QR-Code Redirects (.htaccess)',
      `# Generiert: ${new Date().toISOString()}`,
      `# Gesamt: ${qrCodes.length} | Verlinkt: ${linkedCodes.length} | Nicht verlinkt: ${unlinkedCodes.length}`,
      '# ============================================================',
      '',
      'RewriteEngine On',
      '',
      '# --- Verlinkte QR-Codes ---',
      '',
    ];

    for (const qr of [...linkedCodes].sort((a, b) => a.code.localeCompare(b.code))) {
      const info = getContentLabel(qr).replace(/\n/g, ' ');
      const label = qr.label ? ` | ${qr.label}` : '';
      lines.push(`# ${qr.code}${label} -> ${info}`);
      lines.push(`Redirect 301 /qr/${qr.code} ${base}/qr/${qr.code}`);
      lines.push('');
    }

    if (unlinkedCodes.length > 0) {
      lines.push('# --- Nicht verlinkte QR-Codes (Fallback auf App-Startseite) ---');
      lines.push('');
      for (const qr of [...unlinkedCodes].sort((a, b) => a.code.localeCompare(b.code))) {
        const label = qr.label ? ` | ${qr.label}` : '';
        lines.push(`# ${qr.code}${label} -> NICHT VERLINKT`);
        lines.push(`Redirect 301 /qr/${qr.code} ${base}/qr/${qr.code}`);
        lines.push('');
      }
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `htaccess_qr_redirects_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`.htaccess mit ${qrCodes.length} Redirects heruntergeladen`);
  };

  const fetchAll = async () => {
    setLoading(true);
    const [qrRes, vidRes, audRes] = await Promise.all([
      supabase.from('qr_codes').select('*').order('code'),
      supabase.from('videos').select('id, title, vimeo_video_id').eq('is_active', true).order('title'),
      supabase.from('audio_files').select('id, display_name, audio_levels(name)').order('display_name'),
    ]);
    if (qrRes.data) setQrCodes(qrRes.data);
    if (vidRes.data) setVideos(vidRes.data);
    if (audRes.data) {
      setAudios(
        audRes.data.map((a: any) => ({
          id: a.id,
          display_name: a.display_name,
          level_name: a.audio_levels?.name ?? null,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAdd = async () => {
    if (!newForm.code.trim()) { toast.error('Code ist erforderlich'); return; }
    const insert: any = {
      code: newForm.code.trim(),
      content_type: newForm.content_type,
      label: newForm.label || null,
      video_id: newForm.content_type === 'video' && newForm.video_id ? newForm.video_id : null,
      audio_id: newForm.content_type === 'audio' && newForm.audio_id ? newForm.audio_id : null,
    };
    const { error } = await supabase.from('qr_codes').insert(insert);
    if (error) { toast.error(error.message); return; }
    toast.success('QR-Code erstellt');
    setShowAdd(false);
    setNewForm({ code: '', content_type: 'video', video_id: '', audio_id: '', label: '' });
    fetchAll();
  };

  const handleUpdate = async (id: string) => {
    const updates: any = { ...editForm };
    if (updates.content_type === 'video') updates.audio_id = null;
    if (updates.content_type === 'audio') updates.video_id = null;
    const { error } = await supabase.from('qr_codes').update(updates).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Gespeichert');
    setEditingId(null);
    fetchAll();
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    await supabase.from('qr_codes').update({ is_active: active }).eq('id', id);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('QR-Code wirklich löschen?')) return;
    await supabase.from('qr_codes').delete().eq('id', id);
    toast.success('Gelöscht');
    fetchAll();
  };

  const getContentLabel = (qr: QRCode) => {
    if (qr.content_type === 'video' && qr.video_id) {
      const v = videos.find(v => v.id === qr.video_id);
      return v ? `🎬 ${v.title}` : '🎬 (unbekannt)';
    }
    if (qr.content_type === 'audio' && qr.audio_id) {
      const a = audios.find(a => a.id === qr.audio_id);
      if (!a) return '🎵 (unbekannt)';
      return a.level_name ? `🎵 ${a.display_name} (${a.level_name})` : `🎵 ${a.display_name}`;
    }
    return '– nicht verknüpft –';
  };

  if (loading) return <div className="text-center py-8 text-slate-500">Laden...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <QrCode className="w-5 h-5" /> QR-Codes ({qrCodes.length})
        </h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleDownloadHtaccess}>
            <Download className="w-4 h-4 mr-1" /> .htaccess herunterladen
          </Button>
          <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="w-4 h-4 mr-1" /> Neuer QR-Code
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200">
        {([
          ['all', `Alle (${qrCodes.length})`],
          ['linked', `Verlinkt (${linkedCodes.length})`],
          ['unlinked', `Nicht verlinkt (${unlinkedCodes.length})`],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {showAdd && (
        <div className="admin-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Code (z.B. V001)" value={newForm.code} onChange={e => setNewForm(f => ({ ...f, code: e.target.value }))} />
            <Input placeholder="Beschreibung" value={newForm.label} onChange={e => setNewForm(f => ({ ...f, label: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select value={newForm.content_type} onValueChange={v => setNewForm(f => ({ ...f, content_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
              </SelectContent>
            </Select>
            {newForm.content_type === 'video' ? (
              <SearchableSelect
                value={newForm.video_id}
                onChange={v => setNewForm(f => ({ ...f, video_id: v }))}
                options={videos.map(v => ({ value: v.id, label: v.title }))}
                placeholder="Video auswählen"
                searchPlaceholder="Video suchen..."
              />
            ) : (
              <SearchableSelect
                value={newForm.audio_id}
                onChange={v => setNewForm(f => ({ ...f, audio_id: v }))}
                options={audios.map(a => ({
                  value: a.id,
                  label: a.level_name ? `${a.display_name} (${a.level_name})` : a.display_name,
                }))}
                placeholder="Audio auswählen"
                searchPlaceholder="Audio suchen..."
              />
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Erstellen</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Abbrechen</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {visibleCodes.map(qr => (
          <div key={qr.id} className="admin-card p-4">
            {editingId === qr.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input value={editForm.code || ''} onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))} placeholder="Code" />
                  <Input value={editForm.label || ''} onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))} placeholder="Beschreibung" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={editForm.content_type || 'video'} onValueChange={v => setEditForm(f => ({ ...f, content_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                    </SelectContent>
                  </Select>
                  {editForm.content_type === 'video' ? (
                    <SearchableSelect
                      value={editForm.video_id || ''}
                      onChange={v => setEditForm(f => ({ ...f, video_id: v }))}
                      options={videos.map(v => ({ value: v.id, label: v.title }))}
                      placeholder="Video auswählen"
                      searchPlaceholder="Video suchen..."
                    />
                  ) : (
                    <SearchableSelect
                      value={editForm.audio_id || ''}
                      onChange={v => setEditForm(f => ({ ...f, audio_id: v }))}
                      options={audios.map(a => ({
                        value: a.id,
                        label: a.level_name ? `${a.display_name} (${a.level_name})` : a.display_name,
                      }))}
                      placeholder="Audio auswählen"
                      searchPlaceholder="Audio suchen..."
                    />
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleUpdate(qr.id)}><Check className="w-4 h-4 mr-1" /> Speichern</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono font-bold">{qr.code}</code>
                  <span className="text-sm text-slate-600">{qr.label || '–'}</span>
                  <span className="text-xs text-slate-400">{getContentLabel(qr)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={qr.is_active} onCheckedChange={v => handleToggleActive(qr.id, v)} />
                  <Button size="icon" variant="ghost" onClick={() => { setEditingId(qr.id); setEditForm(qr); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(qr.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {visibleCodes.length === 0 && (
          <p className="text-center text-slate-400 py-6">
            {tab === 'linked'
              ? 'Keine verlinkten QR-Codes.'
              : tab === 'unlinked'
              ? 'Alle QR-Codes sind verlinkt. 🎉'
              : 'Noch keine QR-Codes angelegt.'}
          </p>
        )}
      </div>
    </div>
  );
}
