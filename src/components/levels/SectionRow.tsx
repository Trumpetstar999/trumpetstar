import { Section, Video } from '@/types';
import { VideoCard } from './VideoCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';

interface SectionRowProps {
  section: Section;
  onVideoClick: (video: Video) => void;
}

export function SectionRow({ section, onVideoClick }: SectionRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 600;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="py-4">
      <div className="flex items-center justify-between px-6 mb-4">
        <h3 className="text-xl font-semibold text-foreground">{section.title}</h3>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="p-2 rounded-full bg-secondary text-secondary-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="p-2 rounded-full bg-secondary text-secondary-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="scroll-row px-6"
      >
        {section.videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onClick={() => onVideoClick(video)}
          />
        ))}
      </div>
    </div>
  );
}
