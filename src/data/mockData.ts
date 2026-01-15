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

export const mockJournalEntries: JournalEntry[] = [
  {
    id: 'journal-1',
    date: '2025-01-15',
    minutes: 45,
    mood: 'great',
    notes: 'Heute lief es richtig gut! Die C-Dur Tonleiter sitzt jetzt perfekt.',
    tags: ['Tonleitern', 'Fortschritt'],
    linkedVideos: ['video-7'],
  },
  {
    id: 'journal-2',
    date: '2025-01-14',
    minutes: 30,
    mood: 'good',
    notes: 'Warm-up Routine abgeschlossen. Muss noch an der Atmung arbeiten.',
    tags: ['Warm-up', 'Atmung'],
    linkedVideos: ['video-5', 'video-3'],
  },
  {
    id: 'journal-3',
    date: '2025-01-13',
    minutes: 20,
    mood: 'tired',
    notes: 'Nur kurz geübt heute, war etwas müde.',
    tags: ['Kurzsession'],
    linkedVideos: [],
  },
];

export const mockTodos: Todo[] = [
  {
    id: 'todo-1',
    title: 'G-Dur Tonleiter 10x durchspielen',
    notes: 'Langsam starten, Tempo steigern',
    dueDate: '2025-01-16',
    priority: 'high',
    completed: false,
  },
  {
    id: 'todo-2',
    title: 'Atemübung morgens und abends',
    priority: 'medium',
    completed: false,
  },
  {
    id: 'todo-3',
    title: 'Level 1 Videos nochmal anschauen',
    priority: 'low',
    completed: true,
  },
];

export const mockStats: UserStats = {
  todayStars: 5,
  weekStars: 23,
  monthStars: 87,
  totalStars: 342,
  streak: 7,
  todayMinutes: 45,
  weekMinutes: 210,
};

export const mockActivities: DayActivity[] = [
  { date: '2025-01-15', stars: 5, videosWatched: ['video-1', 'video-7'], minutesPracticed: 45 },
  { date: '2025-01-14', stars: 3, videosWatched: ['video-5'], minutesPracticed: 30 },
  { date: '2025-01-13', stars: 2, videosWatched: ['video-2'], minutesPracticed: 20 },
  { date: '2025-01-12', stars: 4, videosWatched: ['video-8', 'video-9'], minutesPracticed: 40 },
  { date: '2025-01-11', stars: 3, videosWatched: ['video-3'], minutesPracticed: 35 },
  { date: '2025-01-10', stars: 2, videosWatched: ['video-6'], minutesPracticed: 25 },
  { date: '2025-01-09', stars: 4, videosWatched: ['video-1', 'video-2'], minutesPracticed: 50 },
];
