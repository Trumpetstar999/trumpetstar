import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Play, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { useDailyUsage } from '@/hooks/useDailyUsage';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { DailyLimitOverlay } from '@/components/premium/DailyLimitOverlay';
import { Button } from '@/components/ui/button';
import { BEGINNER_COPY } from '@/i18n/beginner';
import { beginnerShowcases, orderedBeginnerVideos } from '@/lib/beginner-course';
import type { Video } from '@/types';

type Course = { id: string; title: string; showcaseId: string; videos: Video[] };
const BeginnerFeedback = lazy(() => import('./BeginnerFeedback'));

function Showcase({ course, playingId, onPlay, disabled }: { course: Course; playingId: string | null; onPlay: (video: Video) => void; disabled: boolean }) {
  const { language } = useLanguage();
  const c = BEGINNER_COPY[language];
  const [selectedId, setSelectedId] = useState(course.videos[0]?.id);
  const strip = useRef<HTMLDivElement>(null);
  const active = course.videos.find(v => v.id === selectedId) ?? course.videos[0];
  const complete = useCallback(() => window.dispatchEvent(new CustomEvent('stars-updated')), []);
  if (!active) return null;
  return (
    <section className="min-w-0 space-y-3" data-showcase={course.showcaseId}>
      <h2 className="break-words text-xl font-bold text-foreground">{course.title}</h2>
      {playingId === active.id ? <VideoPlayer key={active.id} video={active} levelId={course.id} levelTitle={course.title} inline onClose={() => {}} onComplete={complete} /> : (
        <Button variant="ghost" disabled={disabled} onClick={() => onPlay(active)} aria-label={`${c.play}: ${active.title}`} className="relative block h-auto w-full overflow-hidden rounded-lg bg-muted p-0 hover:bg-muted">
          <div className="aspect-video w-full">
            {active.thumbnail && <img src={active.thumbnail} alt={active.title} className="h-full w-full object-contain" />}
            <span className="absolute inset-0 flex items-center justify-center"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-ts-gold text-ts-ink shadow-lg"><Play className="h-6 w-6" /></span></span>
          </div>
        </Button>
      )}
      <p className="break-words text-sm font-semibold text-foreground">{active.title}</p>
      <div className="flex min-w-0 items-center gap-1">
        <Button size="icon" variant="ghost" className="shrink-0" aria-label={c.previous} title={c.previous} onClick={() => strip.current?.scrollBy({ left: -400, behavior: 'smooth' })}><ChevronLeft /></Button>
        <div ref={strip} className="flex min-w-0 flex-1 snap-x gap-3 overflow-x-auto pb-2">
          {course.videos.map((video, index) => <Button key={video.id} variant="ghost" aria-pressed={active.id === video.id} onClick={() => { setSelectedId(video.id); onPlay(video); }} disabled={disabled} className={`h-auto w-40 shrink-0 snap-start flex-col items-stretch gap-0 overflow-hidden whitespace-normal rounded-lg border-2 p-0 text-left sm:w-48 ${active.id === video.id ? 'border-primary bg-secondary hover:bg-secondary' : 'border-border bg-card hover:bg-accent'}`}>
            <div className="aspect-video w-full bg-muted">{video.thumbnail && <img src={video.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />}</div>
            <span className="flex min-h-14 items-start gap-2 p-2 text-sm"><span className="shrink-0 text-muted-foreground">{index + 1}.</span><span className="line-clamp-2 break-words">{video.title}</span></span>
          </Button>)}
        </div>
        <Button size="icon" variant="ghost" className="shrink-0" aria-label={c.next} title={c.next} onClick={() => strip.current?.scrollBy({ left: 400, behavior: 'smooth' })}><ChevronRight /></Button>
      </div>
    </section>
  );
}

export function BeginnerCourse() {
  const { language } = useLanguage();
  const c = BEGINNER_COPY[language];
  const usage = useDailyUsage();
  const [catalog, setCatalog] = useState<{ language: string; courses: Course[] } | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [mode, setMode] = useState<'video' | 'feedback'>('video');
  const [playing, setPlaying] = useState<{ language: string; id: string } | null>(null);
  const [starting, setStarting] = useState(false);
  const [limit, setLimit] = useState(false);
  const languageRef = useRef(language);
  languageRef.current = language;
  useEffect(() => {
    let cancelled = false;
    setPlaying(null); setError(false);
    async function load() {
      const ids = beginnerShowcases(language);
      const { data: levels, error: levelError } = await supabase.from('levels').select('id,title,vimeo_showcase_id').in('vimeo_showcase_id', [...ids]).eq('is_active', true);
      if (levelError || !levels?.length) throw new Error('Missing beginner showcases');
      const { data: memberships, error: membershipError } = await supabase.from('beginner_showcase_videos').select('showcase_id,video_id,sort_order').in('showcase_id', [...ids]);
      if (membershipError || !memberships?.length) throw new Error('Missing beginner video memberships');
      const { data: rows, error: videoError } = await supabase.from('videos').select('id,title,vimeo_video_id,vimeo_player_url,thumbnail_url,duration_seconds').in('id', memberships.map(m => m.video_id)).eq('is_active', true);
      if (videoError) throw videoError;
      const courses = ids.flatMap(showcaseId => {
        const level = levels.find(l => l.vimeo_showcase_id === showcaseId);
        if (!level) return [];
        return [{ id: level.id, title: level.title, showcaseId, videos: orderedBeginnerVideos(memberships.filter(m => m.showcase_id === showcaseId)).flatMap(m => {
          const v = rows?.find(row => row.id === m.video_id);
          return v ? [{ id: v.id, title: v.title, vimeoId: v.vimeo_video_id, vimeoPlayerUrl: v.vimeo_player_url ?? undefined, thumbnail: v.thumbnail_url ?? '', duration: v.duration_seconds ?? 0, completions: 0 }] : [];
        }) }];
      });
      if (courses.length !== ids.length || courses.some(s => !s.videos.length)) throw new Error('Incomplete beginner catalog');
      if (!cancelled) setCatalog({ language, courses });
    }
    load().catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [language, retry]);
  const play = async (video: Video) => {
    if (starting || usage.isLoading || playing?.id === video.id && playing.language === language) return;
    const requestedLanguage = language;
    setStarting(true);
    try {
      if (!usage.canStartVideo() || !await usage.recordVideoStart()) { setLimit(true); return; }
      if (languageRef.current === requestedLanguage) setPlaying({ language: requestedLanguage, id: video.id });
    } finally { setStarting(false); }
  };
  return (
    <div className="space-y-8 px-3 py-4 text-foreground sm:px-6">
      <div className="grid grid-cols-2 gap-2 border-b border-border pb-3" role="tablist">
        <Button role="tab" aria-selected={mode === 'video'} variant={mode === 'video' ? 'default' : 'outline'} onClick={() => setMode('video')} className="h-auto min-h-11 whitespace-normal py-2"><Play />{c.video}</Button>
        <Button role="tab" aria-selected={mode === 'feedback'} variant={mode === 'feedback' ? 'default' : 'outline'} onClick={() => { setMode('feedback'); setPlaying(null); }} className="h-auto min-h-11 whitespace-normal py-2"><MessageCircle /><span>{c.feedback}</span></Button>
      </div>
      {mode === 'feedback' ? <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin" /></div>}><BeginnerFeedback /></Suspense> : error ? <div className="py-12 text-center"><p className="mb-4">{c.unavailable}</p><Button onClick={() => setRetry(n => n + 1)}>{c.retry}</Button></div> : catalog?.language !== language ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin" /></div> : catalog.courses.map(course => <Showcase key={`${language}:${course.id}`} course={course} playingId={playing?.language === language ? playing.id : null} onPlay={play} disabled={starting || usage.isLoading} />)}
      <DailyLimitOverlay open={limit} type="video" onClose={() => setLimit(false)} />
    </div>
  );
}