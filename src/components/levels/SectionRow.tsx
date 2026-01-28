import { Section, Video } from '@/types';
import { VideoCard } from './VideoCard';

// Extended video type with localization
interface LocalizedVideo extends Video {
  title_en?: string | null;
  title_es?: string | null;
}

interface LocalizedSection extends Omit<Section, 'videos'> {
  videos: LocalizedVideo[];
}

interface SectionRowProps {
  section: LocalizedSection;
  onVideoClick: (video: LocalizedVideo) => void;
  sectionIndex?: number;
}

export function SectionRow({ section, onVideoClick, sectionIndex = 0 }: SectionRowProps) {
  return (
    <div 
      className="py-4 opacity-0 animate-fade-in"
      style={{ animationDelay: `${sectionIndex * 100}ms`, animationFillMode: 'forwards' }}
    >
      <div className="px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {section.videos.map((video, videoIndex) => (
          <VideoCard
            key={video.id}
            video={video}
            onClick={() => onVideoClick(video)}
            index={videoIndex}
          />
        ))}
      </div>
    </div>
  );
}
