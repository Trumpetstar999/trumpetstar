import { useEffect, useState } from "react";
import { preloadAll, totalAssetCount, loadedAssetCount } from "@/game/sprites";

export interface PreloadState {
  ready: boolean;
  loaded: number;
  total: number;
  progress: number; // 0..1
  failed: string[];
  hasErrors: boolean;
  retry: () => void;
}

export function useAssetPreload(): PreloadState {
  // Keep the initial render deterministic for SSR hydration; real browser
  // loading progress is reported from the effect after mount.
  const [loaded, setLoaded] = useState(0);
  const [total, setTotal] = useState(() => totalAssetCount());
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setReady(false);
    setFailed([]);
    setTotal(totalAssetCount());
    setLoaded(0);

    preloadAll((l, t, f) => {
      if (!alive) return;
      setLoaded(l);
      setTotal(t);
      setFailed([...f]);
    })
      .then((res) => {
        if (!alive) return;
        setFailed(res.failed);
        setReady(true);
        if (res.failed.length > 0) {
          // eslint-disable-next-line no-console
          console.warn(
            `[sprites] ${res.failed.length}/${res.total} Bilder konnten nicht geladen werden:`,
            res.failed,
          );
        }
      })
      .catch((err) => {
        if (!alive) return;
        // eslint-disable-next-line no-console
        console.error("[sprites] preloadAll abgebrochen:", err);
        setReady(true);
      });

    return () => {
      alive = false;
    };
  }, [nonce]);

  return {
    ready,
    loaded,
    total,
    progress: total === 0 ? 1 : loaded / total,
    failed,
    hasErrors: failed.length > 0,
    retry: () => setNonce((n) => n + 1),
  };
}
