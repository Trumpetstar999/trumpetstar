export interface PracticeSession {
  id: string;
  owner_user_id: string;
  name: string;
  break_enabled: boolean;
  break_seconds_default: number;
  is_public: boolean;
  share_slug: string | null;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
}

export interface PracticeSessionSection {
  id: string;
  session_id: string;
  title: string;
  section_key: string;
  order_index: number;
  created_at: string;
}

export interface PracticeSessionItem {
  id: string;
  session_id: string;
  section_id: string | null;
  order_index: number;
  item_type: 'vimeo_video' | 'pdf' | 'pause';
  ref_id: string | null;
  title_cache: string | null;
  duration_mode: 'until_end' | 'timer';
  duration_seconds: number | null;
  created_at: string;
}

export interface PracticeSessionShare {
  id: string;
  session_id: string;
  shared_by_user_id: string;
  shared_with_user_id: string | null;
  share_link: string | null;
  created_at: string;
}

export const DEFAULT_SECTIONS = [
  { title: 'Buzzing', section_key: 'buzzing' },
  { title: 'Einspielen', section_key: 'warmup' },
  { title: 'Zungenübungen', section_key: 'tongue' },
  { title: 'Höhe', section_key: 'range' },
  { title: 'Technik', section_key: 'technique' },
  { title: 'Lieder', section_key: 'songs' },
] as const;

export interface SessionWithDetails extends PracticeSession {
  sections: (PracticeSessionSection & { items: PracticeSessionItem[] })[];
  itemCount: number;
  estimatedDuration: number;
}

// Flat item for the player queue
export interface PlayerQueueItem {
  item: PracticeSessionItem;
  sectionTitle: string;
  globalIndex: number;
}
