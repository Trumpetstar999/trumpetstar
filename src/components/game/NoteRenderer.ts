import { midiToStaffPosition, getLedgerLines, NOTE_NAMES_SHARP } from './constants';
import type { GameNote, Particle } from '@/hooks/useGameLoop';

const GOLD = '#FFCC00';
const GOLD_GLOW = 'rgba(255, 204, 0, 0.4)';
const RED = 'rgba(230, 57, 70, 0.8)';
const LINE_COLOR = 'rgba(255, 204, 0, 0.6)';

// Background image
let bgImage: HTMLImageElement | null = null;
let bgLoaded = false;
const bgImg = new Image();
bgImg.src = '/images/game-background.png?v=' + Date.now();
bgImg.onload = () => { bgImage = bgImg; bgLoaded = true; };

// Treble clef SVG path (simplified)
const TREBLE_CLEF_SCALE = 0.035;

export function renderGame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  notes: GameNote[],
  particles: Particle[],
  _time: number
) {
  ctx.clearRect(0, 0, width, height);

  // Background image
  if (bgLoaded && bgImage) {
    ctx.drawImage(bgImage, 0, 0, width, height);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'hsl(222, 86%, 20%)');
    grad.addColorStop(0.5, 'hsl(218, 88%, 35%)');
    grad.addColorStop(1, 'hsl(212, 100%, 45%)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // Staff area
  const staffTop = height * 0.35;
  const staffHeight = height * 0.3;
  const lineSpacing = staffHeight / 4;
  const staffCenterY = staffTop + staffHeight / 2;
  const clefX = width * 0.08;

  // Draw 5 staff lines
  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = GOLD_GLOW;
  ctx.shadowBlur = 4;
  for (let i = 0; i < 5; i++) {
    const y = staffTop + i * lineSpacing;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // Draw treble clef — sized to span from just above top line to just below bottom line
  ctx.save();
  const clefFontSize = staffHeight * 1.8;
  ctx.font = `${clefFontSize}px serif`;
  ctx.fillStyle = GOLD;
  ctx.shadowColor = GOLD_GLOW;
  ctx.shadowBlur = 10;
  ctx.textBaseline = 'middle';
  // The unicode glyph's visual center sits a bit high, nudge down to align curl on G line
  ctx.fillText('𝄞', clefX - clefFontSize * 0.32 + 50, staffCenterY + lineSpacing * 0.25 - 10);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Helper: staff position to Y coordinate
  // staffPos: 0=B4 (middle line), each unit = half lineSpacing
  // Staff lines: E4(-4), G4(-2), B4(0), D5(2), F5(4) — diatonic positions
  const posToY = (staffPos: number) => {
    return staffCenterY - staffPos * (lineSpacing / 2);
  };

  // Draw notes
  const noteRadius = lineSpacing * 0.4;
  for (const note of notes) {
    if (note.x < -0.05 || note.x > 1.15) continue;
    
    const x = clefX + (width - clefX) * note.x;
    const staffPos = midiToStaffPosition(note.midi);
    const y = posToY(staffPos);

    // Ledger lines
    const ledgers = getLedgerLines(staffPos);
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = 1;
    for (const lp of ledgers) {
      const ly = posToY(lp);
      ctx.beginPath();
      ctx.moveTo(x - noteRadius * 1.8, ly);
      ctx.lineTo(x + noteRadius * 1.8, ly);
      ctx.stroke();
    }

    if (note.hit && note.hitTime) {
      // Hit animation: expanding golden halo
      const elapsed = (performance.now() - note.hitTime) / 500;
      const alpha = Math.max(0, 1 - elapsed);
      const scale = 1 + elapsed * 2;
      ctx.beginPath();
      ctx.arc(x, y, noteRadius * scale, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 204, 0, ${alpha * 0.5})`;
      ctx.fill();
    } else if (note.missed) {
      // Missed: red transparent
      ctx.beginPath();
      ctx.ellipse(x, y, noteRadius * 1.2, noteRadius, 0, 0, Math.PI * 2);
      ctx.fillStyle = RED;
      ctx.fill();
    } else {
      // Active note
      ctx.beginPath();
      ctx.ellipse(x, y, noteRadius * 1.2, noteRadius, -0.2, 0, Math.PI * 2);
      ctx.fillStyle = GOLD;
      ctx.shadowColor = GOLD_GLOW;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Stem
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (staffPos >= 0) {
        // Stem down
        ctx.moveTo(x - noteRadius * 1.1, y);
        ctx.lineTo(x - noteRadius * 1.1, y + lineSpacing * 2.5);
      } else {
        // Stem up
        ctx.moveTo(x + noteRadius * 1.1, y);
        ctx.lineTo(x + noteRadius * 1.1, y - lineSpacing * 2.5);
      }
      ctx.stroke();

      // Accidental (if sharp/flat)
      const noteInOctave = note.midi % 12;
      const isSharp = [1, 3, 6, 8, 10].includes(noteInOctave);
      if (isSharp) {
        ctx.font = `${lineSpacing * 0.9}px serif`;
        ctx.fillStyle = GOLD;
        ctx.textBaseline = 'middle';
        ctx.fillText('♯', x - noteRadius * 2.8, y);
      }
    }
  }

  // Draw particles
  for (const p of particles) {
    const px = clefX + (width - clefX) * p.x;
    const py = height * p.y;
    ctx.beginPath();
    ctx.arc(px, py, p.size * p.life, 0, Math.PI * 2);
    ctx.fillStyle = p.color.replace(')', `, ${p.life})`).replace('hsl(', 'hsla(');
    ctx.fill();
  }

  // Miss zone indicator (subtle line at clef)
  ctx.strokeStyle = 'rgba(230, 57, 70, 0.2)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 8]);
  ctx.beginPath();
  ctx.moveTo(clefX + (width - clefX) * 0.08, staffTop - 20);
  ctx.lineTo(clefX + (width - clefX) * 0.08, staffTop + staffHeight + 20);
  ctx.stroke();
  ctx.setLineDash([]);
}
