import { useState } from 'react';
import { Settings, ChevronDown } from 'lucide-react';
import { TranspositionSelector, TRANSPOSITION_OPTIONS } from './TranspositionSelector';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SettingsPanelProps {
  transpositionId: string;
  onTranspositionChange: (id: string) => void;
}

export function SettingsPanel({ transpositionId, onTranspositionChange }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = TRANSPOSITION_OPTIONS.find((opt) => opt.id === transpositionId);

  const shortLabel = selectedOption
    ? selectedOption.semitones === 0
      ? 'Bb (Std.)'
      : selectedOption.id === 'trumpet-c' ? 'C'
        : selectedOption.id === 'horn-f' ? 'F'
          : selectedOption.id === 'horn-eb' ? 'Es'
            : 'T.horn'
    : '';

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="relative">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 min-h-[44px] rounded-lg transition-all duration-200 touch-manipulation ${
            isOpen
              ? 'bg-primary/40 text-white'
              : 'bg-primary/20 hover:bg-primary/30 active:bg-primary/40 text-white/80 hover:text-white'
          }`}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          aria-label="Einstellungen öffnen"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          <div className="flex flex-col items-start min-w-0">
            <span className="text-xs sm:text-sm font-medium">Einstell.</span>
            <span className="text-[10px] sm:text-xs text-gold font-semibold truncate max-w-[60px] sm:max-w-none">
              {shortLabel}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="absolute right-0 top-full mt-2 z-50 w-[300px] sm:w-[360px] overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="p-4 rounded-xl border border-border shadow-2xl space-y-3 bg-popover">
          <h3 className="text-sm font-bold text-foreground">Einstellungen</h3>
          <TranspositionSelector selectedId={transpositionId} onTranspositionChange={onTranspositionChange} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
