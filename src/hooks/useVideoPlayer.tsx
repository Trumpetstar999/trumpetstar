import { createContext, useContext, useState, ReactNode } from 'react';

interface VideoPlayerContextType {
  isVideoPlaying: boolean;
  setIsVideoPlaying: (playing: boolean) => void;
}

const VideoPlayerContext = createContext<VideoPlayerContextType | undefined>(undefined);

export function VideoPlayerProvider({ children }: { children: ReactNode }) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  return (
    <VideoPlayerContext.Provider value={{ isVideoPlaying, setIsVideoPlaying }}>
      {children}
    </VideoPlayerContext.Provider>
  );
}

export function useVideoPlayer() {
  const context = useContext(VideoPlayerContext);
  if (context === undefined) {
    throw new Error('useVideoPlayer must be used within a VideoPlayerProvider');
  }
  return context;
}
