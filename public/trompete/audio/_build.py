"""Saubere Trompetentoene per additiver Resynthese.

Aus der Aufnahme (src.wav) wird pro Ton nur das Klangfarben-Profil
(Amplituden der Teiltoene) gemessen. Der Ton selbst wird danach
mathematisch neu erzeugt: exakte Tonhoehe, absolut stabile Phase,
keine Schleifennaht, kein Gurgeln, kein Pumpen.
"""
import numpy as np, wave, subprocess, os, json

sr = 44100
w = wave.open('/tmp/hbaudio/src.wav')
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768.0

notes = {'c1': (1.00, 233.08), 'd1': (13.00, 261.63), 'e1': (25.01, 293.66),
         'f1': (37.01, 311.13), 'g1': (49.02, 349.23), 'a1': (61.02, 392.00),
         'h1': (77.02, 440.00), 'c2': (84.99, 466.16), 'd2': (97.01, 523.25)}

NH = 24          # Teiltoene
TOTAL = 3.2
OUT = '/tmp/hbaudio/out3'


def profil(name):
    """Amplituden der Teiltoene aus dem ruhigsten Teil der Aufnahme."""
    on, f0 = notes[name]
    seg = x[int((on + 0.6) * sr): int((on + 1.4) * sr)]
    seg = seg - seg.mean()
    n = len(seg)
    win = np.hanning(n)
    F = np.abs(np.fft.rfft(seg * win, n * 2))
    frq = np.fft.rfftfreq(n * 2, 1 / sr)
    amp = []
    for h in range(1, NH + 1):
        f = f0 * h
        if f > sr / 2 * 0.9:
            amp.append(0.0)
            continue
        m = (frq > f - 12) & (frq < f + 12)
        amp.append(float(F[m].max()) if m.any() else 0.0)
    amp = np.array(amp)
    return amp / (amp[0] + 1e-12)


def ton(f0, amp, variant):
    n = int(TOTAL * sr)
    t = np.arange(n) / sr
    cents = {1: 0.0, 2: 2.0, 3: -1.5}[variant]
    f0 = f0 * 2 ** (cents / 1200.0)

    # Anblasen: Tonhoehe zieht minimal hoch, Obertoene kommen leicht spaeter
    att = 0.055 + 0.005 * variant
    bend = np.exp(-t / 0.045) * -0.010            # ~ -17 Cent am Anfang
    phase = 2 * np.pi * f0 * (t + np.cumsum(bend) / sr)

    hell = np.clip((t / (att * 1.8)), 0, 1)       # Obertoene fahren ein
    y = np.zeros(n)
    rng = np.random.default_rng(1000 + variant)
    for h in range(1, NH + 1):
        a = amp[h - 1]
        if a < 1e-4 or f0 * h > 18000:
            continue
        ph = rng.uniform(0, 2 * np.pi) if h > 1 else 0.0
        ein = 1.0 if h == 1 else hell ** (0.6 + 0.35 * h)
        y += a * ein * np.sin(phase * h + ph)

    # Huellkurve: kurzes An, ganz leichtes Atmen, weicher Ausklang
    env = np.clip(t / att, 0, 1) ** 1.4
    rel = 0.26
    k = int(rel * sr)
    env[-k:] *= np.linspace(1, 0, k) ** 1.6
    atem = 1 + 0.012 * np.sin(2 * np.pi * (4.6 + 0.3 * variant) * t + variant)
    y *= env * atem

    # sanfter Luftanteil beim Ansatz
    luft = rng.normal(0, 1, n) * np.exp(-t / 0.05) * 0.02
    y += luft * env

    y /= np.max(np.abs(y)) + 1e-12
    return (y * 0.82).astype(np.float32)


def farbe(amp, art):
    a = amp.copy()
    h = np.arange(1, NH + 1)
    if art == 'brillant':
        a = a * (1 + 0.55 * np.clip((h - 2) / 6, 0, 1.4))
    elif art == 'gedaempft':
        a = a * np.exp(-(h - 1) / 3.2)
        a[0] *= 0.75
    return a / (a.max() + 1e-12) * (amp.max())


def schreib(y, pfad):
    raw = pfad + '.f32'
    y.tofile(raw)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'f32le', '-ar', str(sr),
                    '-ac', '1', '-i', raw, '-c:a', 'aac', '-b:a', '128k', pfad],
                   check=True)
    os.remove(raw)


for d in ['', 'brillant', 'gedaempft']:
    os.makedirs(os.path.join(OUT, d), exist_ok=True)

loops = {}
for name, (on, f0) in notes.items():
    p = profil(name)
    for art, sub in [('warm', ''), ('brillant', 'brillant'), ('gedaempft', 'gedaempft')]:
        a = farbe(p, art)
        for v in (1, 2, 3):
            y = ton(f0, a, v)
            schreib(y, os.path.join(OUT, sub, 'ton_%s_%d.m4a' % (name, v)))
    # Schleifenpunkte: ganze Perioden mitten im gehaltenen Teil
    per = 1.0 / f0
    st = 0.60
    ln = round(1.5 / per) * per
    for v in (1, 2, 3):
        loops['ton_%s_%d' % (name, v)] = {'start': round(st, 5), 'end': round(st + ln, 5)}

# Belohnung: kleine Fanfare c-e-g-c
fan = np.zeros(int(1.6 * sr))
pf = profil('g1')
for i, f in enumerate([349.23, 440.00, 523.25, 698.46]):
    seg = ton(f, farbe(pf, 'warm'), 1)[:int(0.55 * sr)].astype(np.float64)
    seg *= np.minimum(1, np.linspace(1.0, 0.0, len(seg)) * 3)
    o = int(i * 0.17 * sr)
    fan[o:o + len(seg)] += seg * (0.55 if i < 3 else 1.0)
fan /= np.max(np.abs(fan)) + 1e-12
schreib((fan * 0.85).astype(np.float32), os.path.join(OUT, 'lob.m4a'))

json.dump(loops, open(os.path.join(OUT, 'loops.json'), 'w'), indent=1)
print('fertig', len(loops))
