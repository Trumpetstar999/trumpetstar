import { cn } from '@/lib/utils';
import { Lock, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PlanKey, PLAN_DISPLAY_NAMES } from '@/types/plans';

interface PdfBookCardProps {
  id: string;
  title: string;
  description: string | null;
  pageCount: number;
  planRequired: PlanKey;
  hasAccess: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  isCached: boolean;
  coverImageUrl?: string | null;
  onClick: () => void;
}

export function PdfBookCard({
  id,
  title,
  description,
  pageCount,
  planRequired,
  hasAccess,
  isDownloading,
  downloadProgress,
  isCached,
  coverImageUrl,
  onClick,
}: PdfBookCardProps) {
  // Generate a consistent color based on title
  const colorIndex = title.charCodeAt(0) % 5;
  const bookColors = [
    'from-blue-600 to-blue-800',
    'from-emerald-600 to-emerald-800',
    'from-amber-600 to-amber-800',
    'from-rose-600 to-rose-800',
    'from-purple-600 to-purple-800',
  ];
  const spineColor = bookColors[colorIndex];

  return (
    <button
      onClick={onClick}
      disabled={isDownloading}
      className={cn(
        'group relative flex flex-col items-center transition-all duration-300',
        'hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        !hasAccess && 'opacity-70',
        isDownloading && 'pointer-events-none'
      )}
    >
      {/* Book Container */}
      <div className="relative w-32 md:w-40">
        {/* Book Shadow */}
        <div className="absolute -bottom-2 left-2 right-2 h-4 bg-black/30 blur-md rounded-full" />
        
        {/* Book */}
        <div className="relative">
          {/* Book Spine */}
          <div className={cn(
            'absolute left-0 top-0 bottom-0 w-3 rounded-l-sm bg-gradient-to-r',
            spineColor,
            'shadow-inner'
          )} />
          
          {/* Book Cover */}
          <div className={cn(
            'relative ml-2 aspect-[3/4] rounded-r-md rounded-l-sm overflow-hidden',
            'bg-gradient-to-br shadow-lg',
            !coverImageUrl && spineColor,
            'transform perspective-1000',
            'group-hover:shadow-xl group-hover:shadow-primary/20'
          )}>
            {/* Cover Image or Default Design */}
            {coverImageUrl ? (
              <img 
                src={coverImageUrl} 
                alt={title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              /* Default Cover Design */
              <div className="absolute inset-0 p-4 flex flex-col">
                {/* Decorative top bar */}
                <div className="h-1 w-full bg-white/20 rounded-full mb-3" />
                
                {/* Title */}
                <div className="flex-1 flex items-center justify-center">
                  <h3 className="text-white font-bold text-sm md:text-base text-center leading-tight line-clamp-3 px-1">
                    {title}
                  </h3>
                </div>
                
                {/* Bottom info */}
                <div className="mt-auto">
                  <div className="h-px w-full bg-white/20 mb-2" />
                  <p className="text-white/60 text-[10px] text-center">
                    {pageCount} Seiten
                  </p>
                </div>
              </div>
            )}

            {/* Lock Overlay */}
            {!hasAccess && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]">
                <Lock className="w-8 h-8 text-white/80" />
              </div>
            )}

            {/* Download Progress Overlay */}
            {isDownloading && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-reward-gold animate-spin" />
                <div className="w-4/5">
                  <Progress value={downloadProgress} className="h-2" />
                </div>
                <span className="text-white text-xs font-medium">{downloadProgress}%</span>
              </div>
            )}

            {/* Cached Indicator */}
            {isCached && hasAccess && !isDownloading && (
              <div className="absolute top-2 right-2">
                <CheckCircle2 className="w-5 h-5 text-green-400 drop-shadow-md" />
              </div>
            )}

            {/* Not Cached Indicator */}
            {!isCached && hasAccess && !isDownloading && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Download className="w-5 h-5 text-white/60" />
              </div>
            )}
          </div>
          
          {/* Book Pages Effect */}
          <div className="absolute right-0 top-1 bottom-1 w-1 bg-gradient-to-r from-gray-200 to-gray-100 rounded-r-sm" />
          <div className="absolute right-0.5 top-2 bottom-2 w-0.5 bg-gray-100/50" />
        </div>
      </div>

      {/* Plan Badge */}
      {planRequired !== 'FREE' && (
        <Badge 
          variant={hasAccess ? 'secondary' : 'outline'}
          className="mt-3 text-[10px] px-2"
        >
          {PLAN_DISPLAY_NAMES[planRequired]}
        </Badge>
      )}

      {/* Title below (for accessibility) */}
      <span className="sr-only">{title}</span>
    </button>
  );
}
