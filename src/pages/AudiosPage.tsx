import { AudioPlayer } from '@/components/audio/AudioPlayer';

export function AudiosPage() {
  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100dvh - 140px)' }}>
      <AudioPlayer />
    </div>
  );
}
