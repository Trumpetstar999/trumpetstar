import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { LEGAL_COPY } from '@/i18n/legal';
import { LegalLinks } from './LegalLinks';

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const { language } = useLanguage();
  return <div className="ts-light-module ts-system-font min-h-[100dvh] text-ts-ink" lang={language}>
    <header className="ts-gradient px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] text-ts-on">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-5">
        <Link to="/" className="inline-flex min-h-11 items-center gap-1"><ChevronLeft />{LEGAL_COPY[language].home}</Link>
        <h1 className="min-w-0 break-words text-2xl font-bold">{title}</h1>
      </div>
    </header>
    <main className="mx-auto max-w-3xl space-y-7 px-5 py-8 leading-relaxed">{children}</main>
    <footer className="border-t border-ts-ink/15 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"><LegalLinks /></footer>
  </div>;
}