import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDailyUsage } from "@/hooks/useDailyUsage";
import { DailyLimitOverlay } from "@/components/premium/DailyLimitOverlay";

/* Happy Beginners laeuft als eigenstaendige Anwendung unter
 * /public/trompete/. Sie bringt ihr eigenes HTML, ihre eigenen Skripte
 * und ihre eigenen Daten mit — darum wird sie hier als Rahmen
 * eingebunden und nicht nachgebaut. So bleiben relative Pfade
 * (data/toene.json, img/…) richtig und das Spiel bleibt in einem Stueck. */
export default function HappyBeginnersPlayPage() {
  const navigate = useNavigate();
  const { recordGameStart, isLoading } = useDailyUsage();
  const [allowed, setAllowed] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const claimed = useRef(false);

  // Opening the game counts as one game start (shared free daily quota).
  useEffect(() => {
    if (isLoading || claimed.current) return;
    claimed.current = true;
    void recordGameStart().then(ok => ok ? setAllowed(true) : setLimitOpen(true));
  }, [isLoading, recordGameStart]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "#FDF8EE" }}>
      {allowed && <iframe
        src="/trompete/index.html"
        title="Happy Beginners"
        allow="microphone; autoplay; fullscreen"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
      />}
      <DailyLimitOverlay open={limitOpen} type="game" onClose={() => { setLimitOpen(false); navigate("/games"); }} />
      <button
        onClick={() => navigate("/games")}
        style={{
          position: "absolute",
          top: "8px",
          left: "10px",
          zIndex: 100,
          fontSize: "12px",
          lineHeight: 1,
          color: "#3A332B",
          opacity: 0.55,
          padding: "6px 10px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.72)",
        }}
      >
        ← Spielauswahl
      </button>
    </div>
  );
}
