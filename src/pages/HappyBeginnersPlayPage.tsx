import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SKRIPTE = [
  "js/audio/dsp.js",
  "js/audio/tracker.js",
  "js/audio/motor.js",
  "js/generator.js",
  "js/bewertung.js",
  "js/fortschritt.js",
  "js/render/noten.js",
  "js/render/griff.js",
  "js/ui/rueckmeldung.js",
  "js/ui/tempo.js",
  "js/ui/level1.js",
  "js/ui/level2.js",
  "js/ui/auswahl.js",
  "js/ui/eltern.js",
  "js/app.js",
];

export default function HappyBeginnersPlayPage() {
  const navigate = useNavigate();
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/trompete/css/stil.css';
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, []);

  useEffect(() => {
    let abgebrochen = false;
    const geladen: HTMLScriptElement[] = [];

    function laden(pfad: string) {
      return new Promise<void>((auf, ab) => {
        const s = document.createElement("script");
        s.src = "/trompete/" + pfad;
        s.async = false;
        s.onload = () => auf();
        s.onerror = () => ab(new Error(pfad));
        document.head.appendChild(s);
        geladen.push(s);
      });
    }

    (async () => {
      for (const pfad of SKRIPTE) {
        if (abgebrochen) return;
        await laden(pfad);
      }
      const start = (window as unknown as { TrompeteStart?: () => void }).TrompeteStart;
      if (!abgebrochen && start) start();
    })().catch(() => {});

    return () => {
      abgebrochen = true;
      geladen.forEach((s) => s.remove());
    };
  }, []);

  return (
    <div id="app" style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#FDF8EE' }}>
      <button
        onClick={() => navigate('/app', { state: { activeTab: 'game', game: 'happybeginners' } })}
        style={{ position: 'absolute', top: 10, left: 12, zIndex: 100, fontSize: 13, color: '#3A332B', opacity: 0.6 }}
      >
        ← Spielauswahl
      </button>
      {/* ============ Bildschirm 1: Level-Auswahl ============ */}
      <section id="auswahl" className="bildschirm" hidden>
        <button id="elternknopf" aria-label="Einstellungen für Eltern">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <g className="zaehne">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((w) => (
                <rect
                  key={w}
                  x="44"
                  y="4"
                  width="12"
                  height="20"
                  rx="4"
                  transform={w ? `rotate(${w} 50 50)` : undefined}
                />
              ))}
            </g>
            <circle className="scheibe" cx="50" cy="50" r="27" />
            <circle className="loch" cx="50" cy="50" r="11" />
          </svg>
        </button>

        <div className="karten">
          {[
            { level: "1", label: "Einzelne Töne" },
            { level: "2a", label: "Zwei Takte" },
            { level: "2b", label: "Vier Takte" },
          ].map((k) => (
            <button key={k.level} className="karte" data-level={k.level} aria-label={k.label}>
              <span className="karte-punkte" />
              <span className="karte-bild">
                <svg className="karte-noten" aria-hidden="true" />
              </span>
              <span className="karte-tier">
                <img src="/trompete/img/vogel-froh.png" alt="" aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ============ Bildschirm 2: Übung ============ */}
      <section id="uebung" className="bildschirm" hidden>
        <div id="leiste">
          <button id="haus" aria-label="Zurück">
            <img src="/trompete/img/haus.png" alt="" aria-hidden="true" />
          </button>

          <button id="spielknopf" aria-label="Los">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <polygon className="ikon-play" points="37,25 79,50 37,75" />
              <rect className="ikon-stop" x="31" y="31" width="38" height="38" rx="6" />
            </svg>
          </button>

          <div id="modi" aria-hidden="true">
            <button id="modus-mit" aria-label="Mitspielen">
              <span className="modus-bild">
                <img src="/trompete/img/trompete-ganz.png" alt="" aria-hidden="true" />
                <svg className="klang" viewBox="0 0 40 40" aria-hidden="true">
                  <ellipse cx="14" cy="30" rx="8" ry="6.4" transform="rotate(-18 14 30)" />
                  <rect x="19" y="7" width="4" height="24" rx="2" />
                  <path className="welle" d="M28 8c5 4 5 12 0 16" />
                </svg>
              </span>
            </button>
            <button id="modus-solo" aria-label="Alleine spielen">
              <span className="modus-bild">
                <img src="/trompete/img/trompete-ganz.png" alt="" aria-hidden="true" />
              </span>
            </button>
          </div>

          <div id="punkte" aria-hidden="true">
            <span className="punkt" />
            <span className="punkt" />
            <span className="punkt" />
            <span className="punkt" />
          </div>
        </div>

        <div id="notenfeld">
          <svg id="noten" aria-hidden="true" />
        </div>

        <div id="rechts">
          <div id="tierfeld" aria-hidden="true">
            <img id="tierbild" src="" alt="" />
          </div>
          <div id="grifffeld">
            <svg id="griff" aria-hidden="true" />
          </div>
        </div>

        <div id="tempofeld" aria-hidden="true">
          <img
            className="tempo-tier"
            id="schildkroete"
            src="/trompete/img/schildkroete.png"
            alt=""
          />
          <div id="tempobahn">
            <div id="tempospur" />
            <div id="tempogriff" />
          </div>
          <img className="tempo-tier" id="hase" src="/trompete/img/hase.png" alt="" />
        </div>

        <div id="buehne" aria-hidden="true" />
      </section>

      {/* ============ Eltern-Bereich ============ */}
      <section id="eltern" className="bildschirm" hidden>
        <div className="eltern-blatt">
          <h1>Eltern</h1>

          <h2>Trefferquoten</h2>
          <table id="eltern-quoten">
            <tbody />
          </table>

          <h2>Startton</h2>
          <div id="eltern-startton" className="knopfreihe">
            <button data-start="c1">c1 – dann nach oben</button>
            <button data-start="g1">g1 – dann nach unten</button>
          </div>
          <p className="hinweis">
            Der erste Ton, mit dem das Kind anfängt. Von c1 aus geht es Ton für Ton nach oben, von
            g1 aus Ton für Ton nach unten (und danach weiter über g1 hinaus). Ein Wechsel setzt den
            Tonumfang wieder auf den neuen Startton zurück; die Trefferquoten bleiben erhalten.
          </p>

          <h2>Tonumfang</h2>

          <p className="hinweis">
            Jeder Ton lässt sich einzeln an- und abschalten. Solange hier von Hand gewählt ist,
            schaltet die App keine Töne mehr selbst dazu.
          </p>
          <div id="eltern-vorrat" className="tonwahl" />
          <div className="knopfreihe">
            <button id="eltern-automatik">Wieder automatisch</button>
          </div>
          <p className="hinweis" id="eltern-vorrat-hinweis" />

          <h2>Stimmung der Trompete</h2>
          <div id="eltern-stimmung" className="knopfreihe">
            <button data-art="B">B-Trompete</button>
            <button data-art="C">C-Trompete</button>
          </div>
          <p className="hinweis">
            Die B-Trompete klingt eine große Sekunde tiefer als notiert, die C-Trompete klingt wie
            notiert. Die Griffe und das Notenbild bleiben in beiden Fällen gleich — nur die
            Frequenzen, auf die das Mikrofon hört, verschieben sich. Falsche Einstellung heißt: es
            wird nichts erkannt.
          </p>

          <h2>Mikrofon</h2>
          <div id="eltern-mikro">
            <div className="mikro-zeile">
              <span>Erkannter Ton</span>
              <b id="mikro-ton">–</b>
            </div>
            <div className="mikro-zeile">
              <span>Frequenz</span>
              <b id="mikro-hz">–</b>
            </div>
            <div className="mikro-zeile">
              <span>Abweichung</span>
              <b id="mikro-cent">–</b>
            </div>
            <div className="mikro-zeile">
              <span>Pegel</span>
              <b id="mikro-db">–</b>
            </div>
            <div className="mikro-zeile">
              <span>Rauschschwelle</span>
              <b id="mikro-gate">–</b>
            </div>
            <div className="mikro-zeile">
              <span>Analyseweg</span>
              <b id="mikro-weg">–</b>
            </div>
            <div id="mikro-balken">
              <i />
            </div>
          </div>

          <h2>Fortschritt</h2>
          <button id="eltern-reset" className="warnknopf">
            Fortschritt zurücksetzen
          </button>

          <button id="eltern-zu" className="schliessen">
            Zurück zur App
          </button>
        </div>
      </section>

      {/* ============ Startgeste / Mikrofonhinweis ============ */}
      <section id="tor" className="bildschirm">
        <button id="torknopf" aria-label="Los">
          <img src="/trompete/img/vogel-froh.png" alt="" aria-hidden="true" />
        </button>
      </section>

      <section id="safarihinweis" className="bildschirm" hidden>
        <div className="hinweisbild">
          <img src="/trompete/img/safari-hinweis.svg" alt="" aria-hidden="true" />
        </div>
      </section>

      {/* ============ Hochformat: wortlos ums Drehen bitten ============ */}
      <div id="drehbitte" aria-hidden="true">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <rect
            x="62"
            y="18"
            width="76"
            height="164"
            rx="12"
            fill="#FFFFFF"
            stroke="#3A332B"
            strokeWidth="6"
          />
          <rect x="72" y="32" width="56" height="136" rx="4" fill="#F3E9D6" />
          <circle cx="100" cy="175" r="4" fill="#C8BBA4" />
          <path d="M150 70a58 58 0 0 1 0 60" fill="none" stroke="#FF8A3D" strokeWidth="8" strokeLinecap="round" />
          <path
            d="M141 122l10 12 12-9"
            fill="none"
            stroke="#FF8A3D"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
