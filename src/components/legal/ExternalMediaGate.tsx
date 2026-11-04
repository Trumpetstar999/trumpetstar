import { ReactNode, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { Play, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { LEGAL_COPY } from '@/i18n/legal';

let allowed = false;
const listeners = new Set<() => void>();
export function setMediaPermission(value: boolean) {
  allowed = value;
  listeners.forEach(listener => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function ExternalMediaGate({ children }: { children: ReactNode }) {
  const enabled = useSyncExternalStore(subscribe, () => allowed, () => false);
  const { language } = useLanguage();
  const copy = LEGAL_COPY[language];
  if (enabled) return <>{children}</>;
  return <div className="flex min-h-52 w-full flex-col items-center justify-center gap-4 rounded-lg bg-ts-card p-5 text-center text-ts-ink">
    <ShieldCheck className="h-7 w-7 text-ts-deep" />
    <p className="max-w-lg text-sm leading-relaxed">{copy.media}</p>
    <Button onClick={() => setMediaPermission(true)} className="h-auto min-h-11 whitespace-normal bg-ts-deep text-ts-on hover:bg-ts-deep/90"><Play />{copy.load}</Button>
    <Link to="/datenschutz" className="text-sm underline">{copy.privacy}</Link>
  </div>;
}