import { JournalEntry as JournalEntryType } from '@/types';
import { Clock, Tag, Video, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JournalEntryProps {
  entry: JournalEntryType;
  onCreateTodo?: () => void;
}

const moodEmojis: Record<JournalEntryType['mood'], string> = {
  great: '🎉',
  good: '😊',
  neutral: '😐',
  tired: '😴',
  frustrated: '😤',
};

const moodLabels: Record<JournalEntryType['mood'], string> = {
  great: 'Super',
  good: 'Gut',
  neutral: 'Okay',
  tired: 'Müde',
  frustrated: 'Frustriert',
};

export function JournalEntryCard({ entry, onCreateTodo }: JournalEntryProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <div className="bg-card rounded-xl p-5 shadow-sm border border-border hover-lift">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">{formatDate(entry.date)}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-2xl">{moodEmojis[entry.mood]}</span>
            <span className="text-lg font-medium text-foreground">{moodLabels[entry.mood]}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground">
            <Clock className="w-4 h-4" />
            <span className="font-medium">{entry.minutes} Min.</span>
          </div>
          
          <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {entry.notes && (
        <p className="text-foreground mb-4">{entry.notes}</p>
      )}
      
      {entry.tags.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Tag className="w-4 h-4 text-muted-foreground" />
          {entry.tags.map((tag) => (
            <span 
              key={tag}
              className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      {entry.linkedVideos.length > 0 && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Video className="w-4 h-4" />
          <span className="text-sm">{entry.linkedVideos.length} verknüpfte Videos</span>
        </div>
      )}
    </div>
  );
}
