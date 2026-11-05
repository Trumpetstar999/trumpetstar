import { useEffect, useState } from 'react';
import { ChevronDown, Download, ExternalLink, Loader2, Package, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { purchasesCopy } from '@/i18n/purchases';
import type { Purchase } from '../../../supabase/functions/my-purchases/purchases';

export function MyPurchases() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const c = purchasesCopy[language];
  const [result, setResult] = useState<{ userId: string; purchases: Purchase[]; source: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true); setError(false);
    supabase.functions.invoke('my-purchases', { body: {} }).then(({ data, error }) => {
      if (cancelled) return;
      if (error || !Array.isArray(data?.purchases)) setError(true);
      else setResult({ userId: user.id, purchases: data.purchases, source: data.source });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user?.id, retry]);
  if (!user) return null;
  const purchases = result?.userId === user.id ? result.purchases : [];
  const date = (value: string | null) => {
    const parsed = value ? new Date(value) : null;
    return parsed && Number.isFinite(parsed.getTime()) ? parsed.toLocaleDateString(language) : '–';
  };
  return <section aria-label={c.title} className="mt-8 border-t border-ts-ink/15 pt-6 text-ts-ink">
    <Collapsible open={open} onOpenChange={setOpen}>
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="min-w-0 flex-1"><CollapsibleTrigger asChild><Button variant="ghost" className="w-full justify-between px-0 text-xl font-bold text-ts-ink hover:bg-transparent"><span className="flex items-center gap-2"><Package className="h-5 w-5" />{c.title}</span><ChevronDown className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`} /></Button></CollapsibleTrigger></h2>
      {open && <Button variant="ghost" size="icon" aria-label={c.refresh} title={c.refresh} disabled={loading} onClick={() => setRetry(n => n + 1)} className="shrink-0 text-ts-deep hover:bg-ts-card"><RefreshCw className={loading ? 'animate-spin' : ''} /></Button>}
    </div>
    <CollapsibleContent>
    {loading ? <div className="flex justify-center py-8" role="status"><Loader2 className="h-6 w-6 animate-spin" /></div> : error ? <p role="alert" className="py-4 text-ts-muted">{c.error}</p> : <>
      {result?.source === 'saved' && <p className="mb-3 text-sm text-ts-muted">{c.cached}</p>}
      {!purchases.length ? <p className="py-4 text-ts-muted">{c.empty}</p> : <ul className="divide-y divide-ts-ink/15">
        {purchases.map(p => <li key={p.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold break-words">{p.name}</h3>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-ts-muted">
              <span>{c.date}: {date(p.date)}</span>
              {p.amount !== null && <span>{c.total}: {new Intl.NumberFormat(language, { style: 'currency', currency: p.currency }).format(p.amount)}</span>}
              <span className="font-medium">{c[p.status]}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {p.downloadUrl && <Button asChild size="sm"><a href={p.downloadUrl} target="_blank" rel="noopener noreferrer"><Download />{c.download}</a></Button>}
            {p.orderUrl && <Button asChild variant="outline" size="sm" className="border-ts-ink/15 bg-ts-card text-ts-deep"><a href={p.orderUrl} target="_blank" rel="noopener noreferrer"><ExternalLink />{c.order}</a></Button>}
          </div>
        </li>)}
      </ul>}
    </>}
    </CollapsibleContent>
    </Collapsible>
  </section>;
}