import { AudioPlayer } from '@/components/audio/AudioPlayer';

export function AudiosPage() {
  return (
    <div className="flex flex-col overflow-hidden h-[calc(100dvh-136px-env(safe-area-inset-top))] min-h-[500px]">
      <AudioPlayer />
    </div>
  );
}
