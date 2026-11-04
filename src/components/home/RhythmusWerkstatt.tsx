import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';

/** Preserve the supplied standalone audio/notation engine, sharing only locale/theme. */
export function RhythmusWerkstatt() {
  const frame = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const sendTheme = useCallback(() => {
    const styles = getComputedStyle(document.documentElement);
    const tokens: Record<string, string> = {};
    for (const token of ['--ts-sky', '--ts-deep', '--ts-bright', '--ts-gold', '--ts-red', '--ts-ink', '--ts-ink-muted', '--ts-surface', '--ts-card', '--ts-on-gradient', '--tuner-tuned']) {
      tokens[token] = styles.getPropertyValue(token).trim();
    }
    frame.current?.contentWindow?.postMessage({ typ: 'trumpetstar-rhythmus-theme', tokens }, window.location.origin);
  }, []);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.typ === 'trumpetstar-rhythmus' && event.data?.aktion === 'schliessen') navigate('/');
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [navigate]);
  return <div className="ts-light-module fixed inset-0"><iframe ref={frame} key={language} title={t('home.apps.rhythm')} src={`/rhythmus-werkstatt/index.html?lang=${language}`} allow="microphone; autoplay" onLoad={sendTheme} className="block h-[100dvh] w-full border-0" /></div>;
}