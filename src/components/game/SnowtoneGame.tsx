import { useEffect, useRef, useState } from 'react';
import { useDailyUsage } from '@/hooks/useDailyUsage';
import { useLanguage } from '@/hooks/useLanguage';
import { DailyLimitOverlay } from '@/components/premium/DailyLimitOverlay';

export function SnowtoneGame() {
  const frame = useRef<HTMLIFrameElement>(null);
  const pending = useRef(false);
  const { recordGameStart } = useDailyUsage();
  const { language } = useLanguage();
  const [limitOpen, setLimitOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const receive = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type !== 'snowtone-start' || typeof event.data.id !== 'string' || pending.current) return;
      pending.current = true;
      const target = event.source as Window;
      let allowed = false;
      try { allowed = await recordGameStart(); }
      finally { pending.current = false; }
      if (!active) return;
      target.postMessage({ type: 'snowtone-start-result', id: event.data.id, allowed }, window.location.origin);
      if (!allowed) setLimitOpen(true);
    };
    window.addEventListener('message', receive);
    return () => { active = false; window.removeEventListener('message', receive); };
  }, [recordGameStart]);

  return <>
    <iframe ref={frame} key={language} src={`/snowtone/index.html?lang=${language}`} title="Snowtone"
      allow="microphone; autoplay; fullscreen" allowFullScreen className="block h-full w-full border-0" />
    <DailyLimitOverlay open={limitOpen} type="game" onClose={() => setLimitOpen(false)} />
  </>;
}