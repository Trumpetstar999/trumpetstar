import type { ReactNode } from 'react';

interface Props {
  onClick: () => void;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  subtitle?: string;
}

export function MenuButton({ onClick, children, variant = 'secondary', subtitle }: Props) {
  const isPrimary = variant === 'primary';

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group relative block w-full overflow-hidden rounded-xl text-left',
        'px-4 py-3 transition-all duration-200 ease-out active:translate-y-px',
        isPrimary
          ? 'bg-gradient-to-r from-[#ff8a1f] via-[#ff5a2e] to-[#ff3b4d] ring-1 ring-[#ffb86b]/40 shadow-[0_6px_20px_-6px_rgba(255,90,46,0.65)]'
          : 'bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/25',
      ].join(' ')}
    >
      <span
        className={[
          'absolute left-0 top-2 bottom-2 w-[3px] rounded-r-sm transition-all duration-300',
          isPrimary
            ? 'bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.7)]'
            : 'bg-[#ffcc33]/0 group-hover:bg-[#ffcc33] group-hover:shadow-[0_0_10px_rgba(255,204,51,0.7)]',
        ].join(' ')}
      />

      <div className="relative flex items-center gap-3">
        <div className="min-w-0 flex-1 leading-tight">
          <div className={`text-sm font-bold tracking-wide truncate ${isPrimary ? 'text-white' : 'text-white/95'}`}>
            {children}
          </div>
          {subtitle && (
            <div
              className={[
                'text-[10px] uppercase tracking-[0.22em] truncate transition-colors',
                isPrimary ? 'text-white/85' : 'text-white/45 group-hover:text-white/70',
              ].join(' ')}
            >
              {subtitle}
            </div>
          )}
        </div>
        <span
          className={[
            'ml-1 text-xs transition-all duration-300 group-hover:translate-x-1',
            isPrimary ? 'text-white/90' : 'text-white/30 group-hover:text-[#ffcc33]',
          ].join(' ')}
        >
          ▸
        </span>
      </div>
    </button>
  );
}
