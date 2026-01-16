import { useState } from 'react';
import { cn } from '@/lib/utils';
import { FileText, Lock, Search, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { PlanKey, PLAN_DISPLAY_NAMES } from '@/types/plans';

interface PdfDocument {
  id: string;
  title: string;
  description: string | null;
  page_count: number;
  plan_required: string;
}

interface PdfSidebarProps {
  pdfs: PdfDocument[];
  selectedPdfId: string | null;
  onSelectPdf: (id: string) => void;
  canAccessLevel: (plan: PlanKey) => boolean;
}

export function PdfSidebar({ pdfs, selectedPdfId, onSelectPdf, canAccessLevel }: PdfSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPdfs = pdfs.filter(pdf =>
    pdf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (pdf.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  return (
    <div className="w-72 border-r bg-card flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Notenhefte
        </h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* PDF List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredPdfs.map((pdf) => {
            const isSelected = pdf.id === selectedPdfId;
            const hasAccess = canAccessLevel(pdf.plan_required as PlanKey);
            const planRequired = pdf.plan_required as PlanKey;

            return (
              <button
                key={pdf.id}
                onClick={() => onSelectPdf(pdf.id)}
                className={cn(
                  'w-full p-3 rounded-lg text-left transition-all duration-200',
                  'hover:bg-accent/50 group',
                  isSelected && 'bg-primary/10 border border-primary/20',
                  !hasAccess && 'opacity-75'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    {hasAccess ? (
                      <FileText className="w-5 h-5" />
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-medium text-sm truncate',
                        isSelected && 'text-primary'
                      )}>
                        {pdf.title}
                      </span>
                      <ChevronRight className={cn(
                        'w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0',
                        isSelected && 'opacity-100 text-primary'
                      )} />
                    </div>
                    
                    {pdf.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {pdf.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-muted-foreground">
                        {pdf.page_count} Seiten
                      </span>
                      
                      {planRequired !== 'FREE' && (
                        <Badge 
                          variant={hasAccess ? 'secondary' : 'outline'}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {PLAN_DISPLAY_NAMES[planRequired]}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {filteredPdfs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Keine PDFs gefunden
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}