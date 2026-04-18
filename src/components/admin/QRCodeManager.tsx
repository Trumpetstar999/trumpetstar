import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Plus, Pencil, Check, X, Trash2, QrCode } from 'lucide-react';
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

  const fetchAll = async () => {
    setLoading(true);
    const [qrRes, vidRes, audRes] = await Promise.all([
      supabase.from('qr_codes').select('*').order('code'),
      supabase.from('videos').select('id, title, vimeo_video_id').eq('is_active', true).order('title'),
      supabase.from('audio_files').select('id, display_name').order('display_name'),
    ]);
    if (qrRes.data) setQrCodes(qrRes.data);
    if (vidRes.data) setVideos(vidRes.data);
    if (audRes.data) setAudios(audRes.data);
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
      return a ? `🎵 ${a.display_name}` : '🎵 (unbekannt)';
    }
    return '– nicht verknüpft –';
  };

  if (loading) return <div className="text-center py-8 text-slate-500">Laden...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <QrCode className="w-5 h-5" /> QR-Codes ({qrCodes.length})
        </h3>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-4 h-4 mr-1" /> Neuer QR-Code
        </Button>
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
              <Select value={newForm.video_id} onValueChange={v => setNewForm(f => ({ ...f, video_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Video auswählen" /></SelectTrigger>
                <SelectContent>
                  {videos.map(v => <SelectItem key={v.id} value={v.id}>{v.title}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Select value={newForm.audio_id} onValueChange={v => setNewForm(f => ({ ...f, audio_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Audio auswählen" /></SelectTrigger>
                <SelectContent>
                  {audios.map(a => <SelectItem key={a.id} value={a.id}>{a.display_name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Erstellen</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Abbrechen</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {qrCodes.map(qr => (
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
                    <Select value={editForm.video_id || ''} onValueChange={v => setEditForm(f => ({ ...f, video_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Video auswählen" /></SelectTrigger>
                      <SelectContent>
                        {videos.map(v => <SelectItem key={v.id} value={v.id}>{v.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select value={editForm.audio_id || ''} onValueChange={v => setEditForm(f => ({ ...f, audio_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Audio auswählen" /></SelectTrigger>
                      <SelectContent>
                        {audios.map(a => <SelectItem key={a.id} value={a.id}>{a.display_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
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
        {qrCodes.length === 0 && (
          <p className="text-center text-slate-400 py-6">Noch keine QR-Codes angelegt.</p>
        )}
      </div>
    </div>
  );
}
