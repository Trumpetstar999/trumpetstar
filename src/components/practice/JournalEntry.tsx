import { JournalEntry as JournalEntryType } from '@/types';
import { Clock, Tag, Video, MoreVertical, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JournalEntryProps {
  entry: JournalEntryType;
  onCreateTodo?: () => void;
}

const moodConfig: Record<JournalEntryType['mood'], { emoji: string; label: string; bgColor: string }> = {
  great: { emoji: '🎉', label: 'Super', bgColor: 'bg-green-500/20' },
  good: { emoji: '😊', label: 'Gut', bgColor: 'bg-primary/20' },
  neutral: { emoji: '😐', label: 'Okay', bgColor: 'bg-muted/50' },
  tired: { emoji: '😴', label: 'Müde', bgColor: 'bg-orange-500/20' },
  frustrated: { emoji: '😤', label: 'Frustriert', bgColor: 'bg-accent/20' },
};

export function JournalEntryCard({ entry, onCreateTodo }: JournalEntryProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Heute';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Gestern';
    }
    
    return date.toLocaleDateString('de-DE', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const mood = moodConfig[entry.mood];

  return (
    <div className="group bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Mood Badge */}
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
            mood.bgColor
          )}>
            {mood.emoji}
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">{formatDate(entry.date)}</p>
            <p className="font-medium text-foreground">{mood.label}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Duration Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary">
            <Clock className="w-4 h-4" />
            <span className="font-semibold text-sm">{entry.minutes} Min.</span>
          </div>
          
          <button className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground transition-all">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Notes */}
      {entry.notes && (
        <p className="text-foreground/90 text-sm leading-relaxed mb-3 line-clamp-2">
          {entry.notes}
        </p>
      )}
      
      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {entry.tags.slice(0, 3).map((tag) => (
                <span 
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
              {entry.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{entry.tags.length - 3}
                </span>
              )}
            </div>
          )}
          
          {/* Linked Videos */}
          {entry.linkedVideos.length > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Video className="w-3.5 h-3.5" />
              <span>{entry.linkedVideos.length} Videos</span>
            </div>
          )}
        </div>
        
        {/* View Details Arrow */}
        <button className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
