import { Level, JournalEntry, Todo, UserStats, DayActivity } from '@/types';

export const mockLevels: Level[] = [
  {
    id: 'level-1',
    title: 'Grundlagen',
    showcaseId: '8414886',
    totalStars: 12,
    sections: [
      {
        id: 'section-1-1',
        title: 'Alle Videos',
        videos: [
          {
            id: 'video-1',
            title: 'Erste Töne auf der Trompete',
            thumbnail: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&h=225&fit=crop',
            duration: 245,
            vimeoId: '123456',
            completions: 3,
          },
          {
            id: 'video-2',
            title: 'Die richtige Haltung',
            thumbnail: 'https://images.unsplash.com/photo-1514119412350-e174d90d280e?w=400&h=225&fit=crop',
            duration: 312,
            vimeoId: '123457',
            completions: 2,
          },
          {
            id: 'video-3',
            title: 'Atemtechnik für Anfänger',
            thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=225&fit=crop',
            duration: 428,
            vimeoId: '123458',
            completions: 1,
          },
          {
            id: 'video-4',
            title: 'Lippenübungen Basics',
            thumbnail: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=225&fit=crop',
            duration: 189,
            vimeoId: '123459',
            completions: 0,
          },
        ],
      },
      {
        id: 'section-1-2',
        title: 'Warm-Up Übungen',
        videos: [
          {
            id: 'video-5',
            title: 'Tägliches Warm-Up',
            thumbnail: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=225&fit=crop',
            duration: 356,
            vimeoId: '123460',
            completions: 4,
          },
          {
            id: 'video-6',
            title: 'Buzzing Übungen',
            thumbnail: 'https://images.unsplash.com/photo-1458560871784-56d23406c091?w=400&h=225&fit=crop',
            duration: 278,
            vimeoId: '123461',
            completions: 2,
          },
        ],
      },
    ],
  },
  {
    id: 'level-2',
    title: 'Tonleitern',
    showcaseId: '8414887',
    totalStars: 8,
    sections: [
      {
        id: 'section-2-1',
        title: 'Alle Videos',
        videos: [
          {
            id: 'video-7',
            title: 'C-Dur Tonleiter',
            thumbnail: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=225&fit=crop',
            duration: 298,
            vimeoId: '123462',
            completions: 3,
          },
          {
            id: 'video-8',
            title: 'G-Dur Tonleiter',
            thumbnail: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&h=225&fit=crop',
            duration: 312,
            vimeoId: '123463',
            completions: 2,
          },
          {
            id: 'video-9',
            title: 'F-Dur Tonleiter',
            thumbnail: 'https://images.unsplash.com/photo-1514119412350-e174d90d280e?w=400&h=225&fit=crop',
            duration: 287,
            vimeoId: '123464',
            completions: 2,
          },
          {
            id: 'video-10',
            title: 'Chromatische Tonleiter',
            thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=225&fit=crop',
            duration: 445,
            vimeoId: '123465',
            completions: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'level-3',
    title: 'Artikulation',
    showcaseId: '8414888',
    totalStars: 5,
    sections: [
      {
        id: 'section-3-1',
        title: 'Alle Videos',
        videos: [
          {
            id: 'video-11',
            title: 'Legato Spielen',
            thumbnail: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=225&fit=crop',
            duration: 356,
            vimeoId: '123466',
            completions: 2,
          },
          {
            id: 'video-12',
            title: 'Staccato Technik',
            thumbnail: 'https://images.unsplash.com/photo-1458560871784-56d23406c091?w=400&h=225&fit=crop',
            duration: 298,
            vimeoId: '123467',
            completions: 2,
          },
          {
            id: 'video-13',
            title: 'Akzente und Dynamik',
            thumbnail: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=225&fit=crop',
            duration: 412,
            vimeoId: '123468',
            completions: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'level-4',
    title: 'Melodien',
    showcaseId: '8414889',
    totalStars: 0,
    sections: [
      {
        id: 'section-4-1',
        title: 'Alle Videos',
        videos: [
          {
            id: 'video-14',
            title: 'Erste einfache Melodie',
            thumbnail: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&h=225&fit=crop',
            duration: 523,
            vimeoId: '123469',
            completions: 0,
          },
          {
            id: 'video-15',
            title: 'Volkslieder für Anfänger',
            thumbnail: 'https://images.unsplash.com/photo-514119412350-e174d90d280e?w=400&h=225&fit=crop',
            duration: 478,
            vimeoId: '123470',
            completions: 0,
          },
        ],
      },
    ],
  },
];

// Example data removed: only real user entries are shown.
export const mockJournalEntries: JournalEntry[] = [
];

// Example data removed: only real user entries are shown.
export const mockTodos: Todo[] = [
];

export const mockStats: UserStats = {
  todayStars: 0,
  weekStars: 0,
  monthStars: 0,
  totalStars: 0,
  streak: 0,
  todayMinutes: 0,
  weekMinutes: 0,
};

// Example data removed: only real user entries are shown.
export const mockActivities: DayActivity[] = [
];
