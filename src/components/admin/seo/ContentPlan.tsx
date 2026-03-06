import { useState } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SeoItem {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  publish_date: string | null;
  content_type: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  idea: 'bg-slate-200 text-slate-600',
  planned: 'bg-blue-200 text-blue-800',
  writing: 'bg-amber-200 text-amber-800',
  review: 'bg-purple-200 text-purple-800',
  published: 'bg-emerald-200 text-emerald-800',
  archived: 'bg-slate-100 text-slate-400',
};

export function ContentPlan() {
  const { data: items, loading, refetch } = useRealtimeTable<SeoItem>('seo_content_items');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<SeoItem | null>(null);
  const [newDate, setNewDate] = useState('');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days at start
  const startDow = monthStart.getDay();
  const paddingDays = startDow === 0 ? 6 : startDow - 1;

  const itemsWithDate = items.filter(i => i.publish_date);

  function getItemsForDay(day: Date) {
    return itemsWithDate.filter(item => {
      if (!item.publish_date) return false;
      return isSameDay(new Date(item.publish_date), day);
    });
  }

  async function updatePublishDate() {
    if (!selectedItem || !newDate) return;
    const { error } = await supabase.from('seo_content_items').update({ publish_date: newDate } as any).eq('id', selectedItem.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Datum aktualisiert');
    setSelectedItem(null);
    refetch();
  }

  return (
    <div className="space-y-4">
      {/* Month Nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1))} className="admin-btn p-2">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="font-semibold text-slate-900">
          {format(currentMonth, 'MMMM yyyy', { locale: de })}
        </h3>
        <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1))} className="admin-btn p-2">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {Object.entries(STATUS_COLORS).map(([s, c]) => (
          <span key={s} className={`text-xs px-2 py-1 rounded-full ${c}`}>{s}</span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="admin-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
            <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-slate-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: paddingDays }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-[80px] border-r border-b border-slate-50 bg-slate-50/50" />
          ))}
          {days.map(day => {
            const dayItems = getItemsForDay(day);
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[80px] border-r border-b border-slate-100 p-1.5 ${isToday(day) ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'}`}
              >
                <div className={`text-xs font-medium mb-1 ${isToday(day) ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {dayItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => { setSelectedItem(item); setNewDate(item.publish_date || ''); }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium cursor-pointer truncate ${STATUS_COLORS[item.status || 'idea']}`}
                      title={item.title}
                    >
                      {item.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Items without date */}
      <div className="admin-card p-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Ohne Datum ({items.filter(i => !i.publish_date).length})</h4>
        <div className="flex flex-wrap gap-2">
          {items.filter(i => !i.publish_date).slice(0, 20).map(item => (
            <button
              key={item.id}
              onClick={() => { setSelectedItem(item); setNewDate(''); }}
              className={`px-2 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[item.status || 'idea']} hover:opacity-80`}
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>

      {/* Date Edit Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-900 mb-1">{selectedItem.title}</h3>
            <p className="text-sm text-slate-500 mb-4">Veröffentlichungsdatum setzen</p>
            <input type="date" className="admin-input w-full mb-4" value={newDate} onChange={e => setNewDate(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={updatePublishDate} className="admin-btn-primary flex-1">Speichern</button>
              <button onClick={() => setSelectedItem(null)} className="admin-btn">Abbrechen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
