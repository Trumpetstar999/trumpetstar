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
  const { isListening, pitchData, smoothedCents, error, startListening, stopListening } = usePitchDetection(referenceA4);

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
          "w-[90vw] max-w-[420px] p-0 border-0 overflow-hidden"
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
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div>
            <h2 
              className="text-lg font-bold italic"
              style={{ color: '#e8dcc8', fontFamily: 'serif' }}
            >
              Bb Trumpet Tuner
            </h2>
            <p 
              className="text-xs"
              style={{ color: '#a08060' }}
            >
              A = {referenceA4} Hz
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-80"
            style={{
              background: 'linear-gradient(180deg, #5c4535 0%, #4a3728 100%)',
              border: '1px solid #6d5545',
              color: '#c4a882'
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content */}
        <div className="px-4 py-4 space-y-4">
          {/* Error Message */}
          {error && (
            <div 
              className="p-3 rounded-lg text-sm text-center"
              style={{
                background: 'rgba(200,50,50,0.2)',
                border: '1px solid rgba(200,50,50,0.3)',
                color: '#ff8888'
              }}
            >
              {error}
            </div>
          )}

          {/* Analog Tuner Dial - use smoothed cents */}
          <TunerDial cents={smoothedCents} isActive={isListening && !!pitchData} />

          {/* Note Display */}
          <NoteDisplay 
            note={pitchData?.note ?? '—'} 
            octave={pitchData?.octave ?? 0}
            cents={smoothedCents}
            frequency={pitchData?.frequency ?? 0}
            isActive={isListening && !!pitchData}
          />

          {/* Note Wheel */}
          <NoteWheel 
            currentNoteIndex={pitchData?.noteIndex ?? -1}
            isActive={isListening && !!pitchData}
          />

          {/* Listening Toggle */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleToggleListening}
              className="flex items-center gap-2 px-5 py-2 rounded-full transition-all"
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
                  <span className="text-sm font-medium">Hört zu...</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span className="text-sm font-medium">Aktivieren</span>
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
