import { useState } from 'react';
import { AssistantPanel } from './AssistantPanel';
import { cn } from '@/lib/utils';
import toniAvatar from '@/assets/toni-coach.png';

export function AssistantButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-28 right-4 z-40 h-16 w-16 rounded-full shadow-lg',
          'bg-[#25D366] hover:bg-[#1DAF5A]',
          'transition-all duration-300 hover:scale-105',
          'flex items-center justify-center overflow-hidden border-2 border-white',
          isOpen && 'opacity-0 pointer-events-none'
        )}
      >
        <img 
          src={toniAvatar} 
          alt="Toni - Trompeten-Coach" 
          className="h-full w-full object-cover"
        />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Panel */}
      <AssistantPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
