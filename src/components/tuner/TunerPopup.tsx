import { useState, useEffect } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { usePitchDetection } from '@/hooks/usePitchDetection';
import { TunerDial } from './TunerDial';
import { NoteDisplay } from './NoteDisplay';
import { NoteWheel } from './NoteWheel';
import { TunerControls } from './TunerControls';
import { cn } from '@/lib/utils';

interface TunerPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TunerPopup({ isOpen, onClose }: TunerPopupProps) {
  const [referenceA4, setReferenceA4] = useState(440);
  const { isListening, pitchData, error, startListening, stopListening } = usePitchDetection(referenceA4);

  // Auto-start listening when popup opens
  useEffect(() => {
    if (isOpen && !isListening) {
      startListening();
    }
    return () => {
      if (!isOpen) {
        stopListening();
      }
    };
  }, [isOpen, isListening, startListening, stopListening]);

  // Stop listening when popup closes
  useEffect(() => {
    if (!isOpen) {
      stopListening();
    }
  }, [isOpen, stopListening]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={cn(
          "w-[90vw] max-w-[460px] p-0 border-0 overflow-hidden",
          "bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f0f23]",
          "shadow-[0_25px_80px_-15px_rgba(0,0,0,0.8)]",
          "rounded-3xl"
        )}
      >
        <VisuallyHidden>
          <DialogTitle>Bb Trumpet Tuner</DialogTitle>
        </VisuallyHidden>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">Bb Trumpet Tuner</h2>
            <p className="text-sm text-white/50">A = {referenceA4} Hz</p>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          {/* Analog Tuner Dial */}
          <TunerDial cents={pitchData?.cents ?? 0} isActive={isListening && !!pitchData} />

          {/* Note Display */}
          <NoteDisplay 
            note={pitchData?.note ?? '—'} 
            octave={pitchData?.octave ?? 0}
            cents={pitchData?.cents ?? 0}
            frequency={pitchData?.frequency ?? 0}
            isActive={isListening && !!pitchData}
          />

          {/* Note Wheel */}
          <NoteWheel 
            currentNoteIndex={pitchData?.noteIndex ?? -1}
            isActive={isListening && !!pitchData}
          />

          {/* Listening Toggle */}
          <div className="flex justify-center">
            <button
              onClick={handleToggleListening}
              className={cn(
                "flex items-center gap-3 px-6 py-3 rounded-full transition-all",
                "font-medium text-sm",
                isListening 
                  ? "bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30" 
                  : "bg-white/10 text-white/70 border border-white/20 hover:bg-white/20"
              )}
            >
              {isListening ? (
                <>
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  <span>Hört zu...</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-5 h-5" />
                  <span>Mikrofon aktivieren</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Controls */}
        <TunerControls 
          referenceA4={referenceA4}
          onReferenceChange={setReferenceA4}
        />
      </DialogContent>
    </Dialog>
  );
}
