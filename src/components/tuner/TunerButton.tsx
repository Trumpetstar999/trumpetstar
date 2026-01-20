import { useState } from 'react';
import { Activity } from 'lucide-react';
import { TunerPopup } from './TunerPopup';
import { cn } from '@/lib/utils';

export function TunerButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
          "bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30",
          "text-white/80 hover:text-white text-sm font-medium",
          "hover:shadow-lg hover:shadow-white/5"
        )}
      >
        <Activity className="w-4 h-4" />
        <span className="hidden sm:inline">Tuner</span>
      </button>
      
      <TunerPopup isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
