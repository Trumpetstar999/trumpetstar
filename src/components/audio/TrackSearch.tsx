import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface TrackSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function TrackSearch({ value, onChange }: TrackSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        placeholder="Titel suchen..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-9 bg-primary/10 border-primary/30 focus:border-gold placeholder:text-muted-foreground/60"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-primary/20 transition-colors touch-manipulation"
          aria-label="Suche löschen"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
