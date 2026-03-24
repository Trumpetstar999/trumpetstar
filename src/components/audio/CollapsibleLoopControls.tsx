import { useState } from 'react';
import { Repeat, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { formatTime } from '@/lib/formatTime';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CollapsibleLoopControlsProps {
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
  onToggleLoop: () => void;
  onSetLoopStart: () => void;
  onSetLoopEnd: () => void;
}

export function CollapsibleLoopControls({
  loopEnabled, loopStart, loopEnd, onToggleLoop, onSetLoopStart, onSetLoopEnd,
}: CollapsibleLoopControlsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={`w-full flex items-center justify-between px-4 py-3 min-h-[48px] rounded-xl transition-all duration-200 touch-manipulation select-none ${
            loopEnabled
              ? 'bg-gold/20 border border-gold/40'
              : 'bg-primary/20 hover:bg-primary/30 active:bg-primary/40 border border-transparent'
          }`}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <div className="flex items-center gap-2">
            <Repeat className={`w-5 h-5 ${loopEnabled ? 'text-gold' : 'text-white'}`} />
            <span className="text-sm font-medium">Loop A–B</span>
            {loopEnabled && (
              <span className="text-xs text-gold ml-2">
                {formatTime(loopStart)} – {formatTime(loopEnd)}
              </span>
            )}
          </div>
          <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="pt-3 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-muted-foreground">Loop aktivieren</span>
            <Switch checked={loopEnabled} onCheckedChange={onToggleLoop} className="data-[state=checked]:bg-gold" />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onSetLoopStart}
              className="flex-1 min-h-[48px] bg-primary/20 border-primary/40 hover:bg-primary/40 active:bg-primary/60 touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              Loop-Start ({formatTime(loopStart)})
            </Button>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onSetLoopEnd}
              className="flex-1 min-h-[48px] bg-primary/20 border-primary/40 hover:bg-primary/40 active:bg-primary/60 touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              Loop-Ende ({formatTime(loopEnd)})
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Setze A und B auf die aktuelle Wiedergabeposition
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
