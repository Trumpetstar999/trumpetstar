import { useState, useEffect, useRef } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { usePitchDetection } from '@/hooks/usePitchDetection';
import { TunerDial } from './TunerDial';
import { NoteWheel } from './NoteWheel';
import { TunerControls } from './TunerControls';
import { cn } from '@/lib/utils';

interface TunerPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TunerPopup({ isOpen, onClose }: TunerPopupProps) {
  const [referenceA4, setReferenceA4] = useState(440);
  const { isListening, pitchData, smoothedCents, error, startListening, stopListening } = usePitchDetection(referenceA4);

  // Stop listening when popup closes (no auto-start — iOS requires user gesture)
  useEffect(() => {
    if (!isOpen) {
      stopListening();
    }
  }, [isOpen, stopListening]);

  // Guard for dual touchend + click
  const handledRef = useRef(false);

  const handleToggleListening = (e?: React.TouchEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isListening) {
      stopListening();
      handledRef.current = false;
    } else {
      if (handledRef.current) return;
      handledRef.current = true;
      startListening();
      setTimeout(() => { handledRef.current = false; }, 500);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={cn(
          "w-[90vw] max-w-[380px] p-0 border-0 overflow-hidden"
        )}
        style={{
          background: 'linear-gradient(180deg, #5c4535 0%, #4a3728 50%, #3d2d22 100%)',
          boxShadow: '0 25px 80px -15px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)',
          borderRadius: '16px',
          border: '3px solid #6d5545'
        }}
      >
        <VisuallyHidden>
          <DialogTitle>Bb Trumpet Tuner</DialogTitle>
        </VisuallyHidden>
        
        {/* Header */}
        <div 
          className="flex items-center justify-between px-4 py-2"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div>
            <h2 
              className="text-base font-bold italic"
              style={{ color: '#e8dcc8', fontFamily: 'serif' }}
            >
              Bb Trumpet Tuner
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: '#a08060' }}>
              A={referenceA4}Hz
            </span>
            <button 
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:opacity-80"
              style={{
                background: 'linear-gradient(180deg, #5c4535 0%, #4a3728 100%)',
                border: '1px solid #6d5545',
                color: '#c4a882'
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-3 py-3 space-y-3">
          {error && (
            <div 
              className="p-2 rounded-lg text-xs text-center"
              style={{
                background: 'rgba(200,50,50,0.2)',
                border: '1px solid rgba(200,50,50,0.3)',
                color: '#ff8888'
              }}
            >
              {error}
            </div>
          )}

          <TunerDial 
            cents={smoothedCents} 
            isActive={isListening && !!pitchData}
            note={pitchData?.note ?? '—'}
            octave={pitchData?.octave ?? 0}
          />

          <NoteWheel 
            currentNoteIndex={pitchData?.noteIndex ?? -1}
            isActive={isListening && !!pitchData}
          />

          {/* Listening Toggle – dual touchend + click for iPad */}
          <div className="flex justify-center">
            <button
              onTouchEnd={handleToggleListening}
              onClick={handleToggleListening}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full transition-all"
              style={{
                background: isListening 
                  ? 'linear-gradient(180deg, #2a5530 0%, #1a3320 100%)'
                  : 'linear-gradient(180deg, #5c4535 0%, #4a3728 100%)',
                border: isListening 
                  ? '1px solid #3a7540'
                  : '1px solid #6d5545',
                color: isListening ? '#88dd88' : '#c4a882',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}
            >
              {isListening ? (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span className="text-xs font-medium">Hört zu...</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span className="text-xs font-medium">Aktivieren</span>
                </>
              )}
            </button>
          </div>
        </div>

        <TunerControls 
          referenceA4={referenceA4}
          onReferenceChange={setReferenceA4}
        />
      </DialogContent>
    </Dialog>
  );
}
