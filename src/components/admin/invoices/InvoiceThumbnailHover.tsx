import { useEffect, useRef, useState } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { generateInvoiceHTMLWithLogo } from '@/lib/invoice-print';

interface Props {
  invoiceId: string;
  children: React.ReactNode;
}

/**
 * Shows a miniature PDF (HTML) preview of the invoice on hover.
 * Lazy-loads the full invoice (with items + customer) only when hovered.
 */
export function InvoiceThumbnailHover({ invoiceId, children }: Props) {
  const [open, setOpen] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!open || loadedFor.current === invoiceId) return;
    loadedFor.current = invoiceId;
    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*, customer:customers(*), items:invoice_items(*, product:products(*))')
          .eq('id', invoiceId)
          .single();
        if (error || !data) throw error ?? new Error('not found');
        const generated = await generateInvoiceHTMLWithLogo(data as any);
        setHtml(generated);
      } catch (e) {
        console.error('[InvoiceThumbnailHover] failed', e);
        setHtml('<p style="font-family:sans-serif;padding:24px;color:#888;">Vorschau nicht verfügbar</p>');
      } finally {
        setLoading(false);
      }
    })();
  }, [open, invoiceId]);

  useEffect(() => {
    if (!html || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
  }, [html]);

  return (
    <HoverCard openDelay={250} closeDelay={80} onOpenChange={setOpen}>
      <HoverCardTrigger asChild>
        <span className="cursor-help">{children}</span>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        className="p-0 w-[320px] h-[440px] overflow-hidden border-slate-200 shadow-xl bg-white"
      >
        {loading && !html ? (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div className="relative w-full h-full bg-white">
            <iframe
              ref={iframeRef}
              title="Rechnungsvorschau"
              className="border-0 bg-white"
              style={{
                width: '794px', // A4 @ 96dpi
                height: '1123px',
                transform: 'scale(0.40)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }}
            />
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
