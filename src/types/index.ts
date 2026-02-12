// Core types for the music learning app

// Legacy - use PlanKey from types/plans.ts for new code
export type MembershipPlan = 'FREE' | 'PLAN_A' | 'PLAN_B';

// Re-export new plan types
export { type PlanKey, PLAN_RANKS, PLAN_DISPLAY_NAMES, canAccessPlan } from './plans';

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: number; // in seconds
  vimeoId: string;
  vimeoPlayerUrl?: string;
  completions: number;
}

export interface Section {
  id: string;
  title: string;
  videos: Video[];
}

export interface Level {
  id: string;
  title: string;
  showcaseId: string;
  sections: Section[];
  totalStars: number;
  requiredPlan?: MembershipPlan; // Defaults to FREE if not set
}

export interface JournalEntry {
  id: string;
  date: string;
  minutes: number;
  mood: 'great' | 'good' | 'neutral' | 'tired' | 'frustrated';
  notes: string;
  tags: string[];
  linkedVideos: string[];
}

export interface Todo {
  id: string;
  title: string;
  notes?: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  createdFrom?: string; // journal entry id
}

export interface Recording {
  id: string;
  title?: string;
  url: string;
  thumbnail: string;
  createdAt: string;
  duration: number;
  sharedWith: string[];
}

export interface Friend {
  id: string;
  displayName: string;
  avatar?: string;
  status: 'pending' | 'accepted';
}

export interface Classroom {
  id: string;
  title?: string;
  hostId: string;
  participants: string[];
  maxParticipants: 6;
  visibility: 'invite-only' | 'friends' | 'link-only';
  scheduledAt?: string;
  isLive: boolean;
  recordingEnabled: boolean;
}

export interface UserStats {
  todayStars: number;
  weekStars: number;
  monthStars: number;
  totalStars: number;
  streak: number;
  todayMinutes: number;
  weekMinutes: number;
}

export interface DayActivity {
  date: string;
  stars: number;
  videosWatched: string[];
  minutesPracticed: number;
}

export type TabId = 'levels' | 'pdfs' | 'musicxml' | 'practice' | 'recordings' | 'game' | 'chats' | 'classroom' | 'profile' | 'metronome';
