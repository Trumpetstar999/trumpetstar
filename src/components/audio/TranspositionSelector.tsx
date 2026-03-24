import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface TranspositionOption {
  id: string;
  label: string;
  semitones: number;
}

export const TRANSPOSITION_OPTIONS: TranspositionOption[] = [
  { id: 'concert', label: 'Trompete in Bb (STANDARD)', semitones: 0 },
  { id: 'trumpet-c', label: 'Trompete in C', semitones: 2 },
  { id: 'horn-f', label: 'Horn in F', semitones: -5 },
  { id: 'horn-eb', label: 'Horn in Es', semitones: -7 },
  { id: 'tenorhorn', label: 'Tenorhorn', semitones: -12 },
];

interface TranspositionSelectorProps {
  selectedId: string;
  onTranspositionChange: (id: string) => void;
}

export function TranspositionSelector({ selectedId, onTranspositionChange }: TranspositionSelectorProps) {
  const selectedOption = TRANSPOSITION_OPTIONS.find((opt) => opt.id === selectedId);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">Transposition</span>
        {selectedOption && (
          <span className="text-xs font-bold text-gold truncate">{selectedOption.label}</span>
        )}
      </div>
      <Select value={selectedId} onValueChange={onTranspositionChange}>
        <SelectTrigger className="w-full border-border text-sm text-left bg-white/10">
          <SelectValue placeholder="Transposition wählen" />
        </SelectTrigger>
        <SelectContent className="border-border z-[100]">
          {TRANSPOSITION_OPTIONS.map((option) => (
            <SelectItem key={option.id} value={option.id} className="cursor-pointer">
              <span className="font-medium">{option.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
