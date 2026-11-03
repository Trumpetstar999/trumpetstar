import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Trash2, Upload } from 'lucide-react';
import type { AppUpdate } from '@/lib/news';
import { sortShopProducts, type ShopProduct } from '@/lib/shop';

const LANGS = ['de', 'en', 'es', 'sl'] as const;
const empty = () => ({ title: { de: '', en: '', es: '', sl: '' } as Record<string, string>, body: { de: '', en: '', es: '', sl: '' } as Record<string, string>, link: '' });

function UpdatesSection() {
  const [items, setItems] = useState<AppUpdate[]>([]);
  const [draft, setDraft] = useState(empty());
  const [editId, setEditId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('app_updates').select('*').order('created_at', { ascending: false });
    setItems((data as AppUpdate[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!draft.title.de.trim()) { toast.error('Deutscher Titel fehlt'); return; }
    const link = draft.link.trim();
    if (link && !/^(https:\/\/|\/)/.test(link)) { toast.error('Link muss mit https:// oder / beginnen'); return; }
    const row = { title_i18n: draft.title, body_i18n: draft.body, link: link || null };
    const { error } = editId
      ? await supabase.from('app_updates').update(row).eq('id', editId)
      : await supabase.from('app_updates').insert(row);
    if (error) { toast.error(error.message); return; }
    toast.success('Gespeichert'); setDraft(empty()); setEditId(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Neuigkeit löschen?')) return;
    await supabase.from('app_updates').delete().eq('id', id); load();
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">Neuigkeiten (Glocke)</h2>
      <div className="grid md:grid-cols-2 gap-3 rounded-xl border p-4">
        {LANGS.map((l) => (
          <div key={l} className="space-y-2">
            <Input placeholder={`Titel (${l.toUpperCase()})`} value={draft.title[l]} onChange={(e) => setDraft({ ...draft, title: { ...draft.title, [l]: e.target.value } })} />
            <Textarea placeholder={`Text (${l.toUpperCase()})`} value={draft.body[l]} onChange={(e) => setDraft({ ...draft, body: { ...draft.body, [l]: e.target.value } })} />
          </div>
        ))}
        <Input className="md:col-span-2" placeholder="Link (optional, https://… oder /videos)" value={draft.link} onChange={(e) => setDraft({ ...draft, link: e.target.value })} />
        <div className="md:col-span-2 flex gap-2">
          <Button onClick={save}>{editId ? 'Änderung speichern' : 'Neuigkeit anlegen'}</Button>
          {editId && <Button variant="outline" onClick={() => { setEditId(null); setDraft(empty()); }}>Abbrechen</Button>}
        </div>
      </div>
      <ul className="space-y-2">
        {items.map((u) => (
          <li key={u.id} className="flex items-center gap-3 rounded-lg border p-3">
            <span className="text-xs opacity-70 w-24">{new Date(u.created_at).toLocaleDateString('de')}</span>
            <span className="flex-1 font-medium">{u.title_i18n?.de}</span>
            <Button size="sm" variant="outline" onClick={() => { setEditId(u.id); setDraft({ title: { ...empty().title, ...u.title_i18n }, body: { ...empty().body, ...u.body_i18n }, link: u.link ?? '' }); }}>Bearbeiten</Button>
            <Button size="sm" variant="ghost" onClick={() => remove(u.id)} aria-label="Löschen"><Trash2 className="w-4 h-4" /></Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ShopSection() {
  const [items, setItems] = useState<ShopProduct[]>([]);
  const load = async () => {
    const { data } = await supabase.from('shop_products').select('*');
    setItems(sortShopProducts((data as ShopProduct[]) ?? []));
  };
  useEffect(() => { load(); }, []);

  const patch = async (id: string, values: Partial<ShopProduct>) => {
    const { error } = await supabase.from('shop_products').update(values).eq('id', id);
    if (error) toast.error(error.message); else load();
  };

  const upload = async (id: string, file: File) => {
    const path = `shop/${id}-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`;
    const { error } = await supabase.storage.from('pdf-covers').upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from('pdf-covers').getPublicUrl(path);
    patch(id, { image_url: data.publicUrl });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">Shop-Produkte (Karussell & /shop)</h2>
      <p className="text-sm opacity-70">Produkte werden stündlich aus Digistore24 ergänzt. Neue Produkte sind zunächst ausgeblendet. Reihenfolge: kleinere Zahl zuerst, sonst neueste zuerst.</p>
      <div className="space-y-2">
        {items.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
            <div className="w-14 h-14 rounded bg-muted overflow-hidden shrink-0">{p.image_url && <img src={p.image_url} alt="" className="w-full h-full object-cover" />}</div>
            <div className="flex-1 min-w-[180px]">
              <p className="font-medium">{p.name}</p>
              <p className="text-xs opacity-70">#{p.id} · {new Date(p.created_at).toLocaleDateString('de')}</p>
            </div>
            <Input className="w-24" type="number" step="0.01" placeholder="Preis" defaultValue={p.price ?? ''} onBlur={(e) => patch(p.id, { price: e.target.value === '' ? null : Number(e.target.value) })} />
            <Input className="w-20" type="number" placeholder="Pos." defaultValue={p.sort_override ?? ''} onBlur={(e) => patch(p.id, { sort_override: e.target.value === '' ? null : Number(e.target.value) })} />
            <label className="flex items-center gap-1 text-sm">NEU <Switch checked={p.is_new} onCheckedChange={(v) => patch(p.id, { is_new: v })} /></label>
            <label className="flex items-center gap-1 text-sm">Sichtbar <Switch checked={p.visible} onCheckedChange={(v) => patch(p.id, { visible: v })} /></label>
            <label className="inline-flex items-center gap-1 text-sm cursor-pointer border rounded px-2 py-1">
              <Upload className="w-4 h-4" /> Cover
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(p.id, e.target.files[0])} />
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AdminHomeContentManager() {
  return (
    <div className="space-y-10">
      <UpdatesSection />
      <ShopSection />
    </div>
  );
}
