import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AudioLevel {
  id: string;
  name: string;
}

interface AudioLevelSelectorProps {
  levels: AudioLevel[];
  selectedLevelId: string | null;
  onLevelChange: (levelId: string) => void;
  isLoading?: boolean;
}

export function AudioLevelSelector({ levels, selectedLevelId, onLevelChange, isLoading }: AudioLevelSelectorProps) {
  if (isLoading) {
    return <div className="h-12 bg-muted rounded-lg animate-pulse" />;
  }

  if (levels.length === 0) {
    return (
      <div className="h-12 flex items-center justify-center bg-card rounded-lg text-secondary-white">
        Keine Levels verfügbar
      </div>
    );
  }

  return (
    <Select value={selectedLevelId ?? ''} onValueChange={onLevelChange}>
      <SelectTrigger className="h-12 bg-card border-border text-lg font-medium">
        <SelectValue placeholder="Level auswählen..." />
      </SelectTrigger>
      <SelectContent className="bg-popover border-border">
        {levels.map((level) => (
          <SelectItem key={level.id} value={level.id} className="text-lg cursor-pointer">
            {level.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
