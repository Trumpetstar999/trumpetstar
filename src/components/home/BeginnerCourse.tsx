import { useEffect, useState } from 'react';
import { ChevronLeft, Loader2, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { STAGE_COPY } from '@/i18n/stage-copy';
import { pickLocalized } from '@/lib/news';

export interface BeginnerLesson {
  id: string; sort_order: number; title_i18n: Record<string, string>;
  video_url: string | null; playalong_url: string | null; cover_url: string | null; active: boolean;
}

/** Embed Vimeo/YouTube links, play direct files natively. */
export function LessonVideo({ url, title }: { url: string; title: string }) {
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  const yt = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  const src = vimeo ? `https://player.vimeo.com/video/${vimeo[1]}` : yt ? `https://www.youtube-nocookie.com/embed/${yt[1]}` : null;
  return (
    <div className="aspect-video w-full overflow-hidden rounded-[18px] bg-ts-ink">
      {src ? <iframe src={src} title={title} className="h-full w-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
        : <video src={url} controls playsInline className="h-full w-full" />}
    </div>
  );
}

export function BeginnerCourse() {
  const { t, language } = useLanguage();
  const c = STAGE_COPY[language] ?? STAGE_COPY.de;
  const [lessons, setLessons] = useState<BeginnerLesson[] | null>(null);
  const [open, setOpen] = useState<BeginnerLesson | null>(null);
  const [mode, setMode] = useState<'video' | 'playalong'>('video');

  useEffect(() => {
    supabase.from('beginner_lessons').select('*').eq('active', true).order('sort_order')
      .then(({ data }) => setLessons((data as BeginnerLesson[]) ?? []));
  }, []);

  if (!lessons) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!lessons.length) return (
    <div className="m-4 rounded-[18px] bg-ts-card p-8 text-center shadow-sm">
      <p className="text-2xl font-extrabold text-ts-ink">{t('home.soon')}</p>
      <p className="mt-2 text-ts-muted">{t('home.soonP')}</p>
    </div>
  );

  if (open) {
    const title = pickLocalized(open.title_i18n, language);
    const url = mode === 'playalong' && open.playalong_url ? open.playalong_url : open.video_url;
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 text-ts-ink">
        <button onClick={() => { setOpen(null); setMode('video'); }} className="inline-flex items-center gap-1 text-sm font-semibold text-ts-deep">
          <ChevronLeft className="h-4 w-4" />{c.back}
        </button>
        <h2 className="text-2xl font-extrabold">{title}</h2>
        {url && <LessonVideo key={url} url={url} title={title} />}
        <div className="flex flex-wrap gap-2">
          {open.video_url && <button onClick={() => setMode('video')} aria-pressed={mode === 'video'} className={`rounded-full px-5 py-3 font-bold ${mode === 'video' ? 'bg-ts-deep text-ts-on' : 'bg-ts-card'}`}>{c.video}</button>}
          {open.playalong_url && <button onClick={() => setMode('playalong')} aria-pressed={mode === 'playalong'} className={`inline-flex items-center gap-2 rounded-full px-5 py-3 font-bold ${mode === 'playalong' ? 'bg-ts-gold text-ts-ink' : 'bg-ts-card'}`}><Play className="h-4 w-4" />{c.playalong}</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
      {lessons.map((l, i) => (
        <button key={l.id} onClick={() => setOpen(l)} className="overflow-hidden rounded-[18px] bg-ts-card text-left text-ts-ink shadow-sm">
          <div className="aspect-video bg-muted">
            {l.cover_url ? <img src={l.cover_url} alt="" className="h-full w-full object-cover" loading="lazy" />
              : <div className="flex h-full items-center justify-center text-3xl font-extrabold text-ts-deep">{i + 1}</div>}
          </div>
          <div className="p-3">
            <p className="text-xs font-semibold text-ts-muted">{c.lesson} {i + 1}</p>
            <p className="font-bold leading-tight">{pickLocalized(l.title_i18n, language)}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
