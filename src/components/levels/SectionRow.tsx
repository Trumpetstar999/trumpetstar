import { Section, Video } from '@/types';
import { VideoCard } from './VideoCard';

interface SectionRowProps {
  section: Section;
  onVideoClick: (video: Video) => void;
}

export function SectionRow({ section, onVideoClick }: SectionRowProps) {
  return (
    <div className="py-4">
      <div className="px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
