import { AudioPlayer } from '@/components/audio/AudioPlayer';

export function AudiosPage() {
  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 64px - 96px)' }}>
      <AudioPlayer />
    </div>
  );
}
