import { ReactNode, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
}

/** Floating iOS-style bottom sheet with grabber and dimmed backdrop. */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-ts-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="ts-system-font ts-light-module fixed z-[61] left-2 right-2 mx-auto max-w-[560px] rounded-[36px] text-ts-ink p-6 pt-3 shadow-2xl"
            style={{ bottom: 'calc(8px + env(safe-area-inset-bottom))' }}
            initial={reduced ? { opacity: 0 } : { y: '110%' }}
            animate={reduced ? { opacity: 1 } : { y: 0 }}
            exit={reduced ? { opacity: 0 } : { y: '110%' }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-ts-muted/30" />
            <h3 className="text-xl font-extrabold mb-2">{title}</h3>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
