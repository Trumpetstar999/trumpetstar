import { useState } from 'react';
import { Music2, AudioLines } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { ToeneUebung, MelodieUebung } from '@/trompete';

const COPY = {
  de: { tones: 'Töne', melody: 'Melodien' },
  en: { tones: 'Notes', melody: 'Melodies' },
  es: { tones: 'Notas', melody: 'Melodías' },
  sl: { tones: 'Toni', melody: 'Melodije' },
};

export default function BeginnerFeedback() {
  const { language } = useLanguage();
  const [exercise, setExercise] = useState<'tones' | 'melody'>('tones');
  const c = COPY[language];
  return <section className="min-w-0 space-y-4">
    <div className="flex flex-wrap gap-2" role="tablist">
      <Button role="tab" aria-selected={exercise === 'tones'} variant={exercise === 'tones' ? 'default' : 'outline'} onClick={() => setExercise('tones')}><AudioLines />{c.tones}</Button>
      <Button role="tab" aria-selected={exercise === 'melody'} variant={exercise === 'melody' ? 'default' : 'outline'} onClick={() => setExercise('melody')}><Music2 />{c.melody}</Button>
    </div>
    {exercise === 'tones' ? <ToeneUebung key={`tones:${language}`} sprache={language} /> : <MelodieUebung key={`melody:${language}`} sprache={language} />}
  </section>;
}