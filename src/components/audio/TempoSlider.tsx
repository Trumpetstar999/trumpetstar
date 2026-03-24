import { Slider } from '@/components/ui/slider';

interface TempoSliderProps {
  tempo: number;
  onTempoChange: (tempo: number) => void;
}

export function TempoSlider({ tempo, onTempoChange }: TempoSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Tempo</span>
        <span className="text-sm font-bold text-gold">{tempo}%</span>
      </div>
      <div className="py-2">
        <Slider
          value={[tempo]}
          onValueChange={([value]) => onTempoChange(value)}
          min={40}
          max={120}
          step={1}
          className="w-full touch-manipulation"
        />
      </div>
    </div>
  );
}
