import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KEYS, load, save } from '@/lib/toneforce/storage';
import { useAudioInput } from '@/hooks/toneforce/useAudioInput';
import { usePitchDetection } from '@/hooks/toneforce/usePitchDetection';
import { useChordSettings } from '@/hooks/toneforce/useChordSettings';
import { useAppSettings } from '@/hooks/toneforce/useLocalProgress';
import { useAssetPreload } from '@/hooks/toneforce/useAssetPreload';
import { pcMatches, instrumentSemitones } from '@/lib/toneforce/notes';
import { getDifficultyProfile } from '@/lib/toneforce/difficulty';
import { GAME_H, GAME_W, PLAYER } from '@/game/toneforce/constants';
import { LEVELS } from '@/game/toneforce/levels';
import { spawnBoss, spawnEnemy } from '@/game/toneforce/spawner';
import { aabb, circleHit } from '@/game/toneforce/collision';
import {
  drawBackground, drawEnemy, drawPlayer, drawPowerup, drawProjectile, makeStars,
} from '@/game/toneforce/renderer';
import {
  drawParticles, spawnExplosion, spawnPlayerHit, updateParticles, particlesRef,
} from '@/game/toneforce/effects';
import type { Enemy, Player, Powerup, Projectile } from '@/game/toneforce/types';
import { StabilityBar } from '@/components/game/toneforce/StabilityBar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTfT } from '@/i18n/toneforce';

type Phase = 'ready' | 'playing' | 'level_complete' | 'game_over' | 'won';

export default function ToneForcePlayPage() {
  const t = useTfT();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { chord } = useChordSettings();
  const { status, start, analyserRef, ctxRef } = useAudioInput();
  const { settings } = useAppSettings();
  const pitch = usePitchDetection(analyserRef, ctxRef, status === 'active', instrumentSemitones(settings.instrument));
  const profile = getDifficultyProfile(settings.difficulty);
  const profileRef = useRef(profile);
  useEffect(() => { profileRef.current = profile; }, [profile]);
  const assets = useAssetPreload();
  const [submitting, setSubmitting] = useState(false);

  const [phase, setPhase] = useState<Phase>('ready');
  const [levelIdx, setLevelIdx] = useState(0);
  const [hudScore, setHudScore] = useState(0);
  const [hudLives, setHudLives] = useState(PLAYER.startLives);
  const [demoMode, setDemoMode] = useState(false);
  const [pendingScore, setPendingScore] = useState<{ score: number; level: number } | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  useEffect(() => { setPlayerName(load(KEYS.playerName, '')); }, []);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const playerRef = useRef<Player>({
    x: GAME_W / 2, y: GAME_H - 80, w: PLAYER.width, h: PLAYER.height,
    lives: PLAYER.startLives, shieldUntil: 0, fireReadyAt: 0,
    moveDir: 0, moveUntil: 0,
  });
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const powerupsRef = useRef<Powerup[]>([]);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const lastActionTimeRef = useRef<Record<string, number>>({});
  const bossSpawnedRef = useRef(false);
  const starsRef = useRef(makeStars());
  const hitFxRef = useRef<{ flash: number; shake: number; playerHit: number }>({ flash: 0, shake: 0, playerHit: 0 });
  const demoKeysRef = useRef<{ left: boolean; right: boolean; fire: boolean }>({ left: false, right: false, fire: false });
  const phaseRef = useRef<Phase>('ready');
  const levelIdxRef = useRef(0);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { levelIdxRef.current = levelIdx; }, [levelIdx]);

  const pitchRef = useRef(pitch);
  useEffect(() => { pitchRef.current = pitch; }, [pitch]);

  function bumpCleanNote() {
    scoreRef.current += 5;
    setHudScore(scoreRef.current);
  }

  function fire() {
    const p = playerRef.current;
    const now = performance.now();
    if (now < p.fireReadyAt) return;
    p.fireReadyAt = now + PLAYER.fireCooldown;
    projectilesRef.current.push({
      id: Date.now() + Math.random(),
      x: p.x, y: p.y - p.h / 2,
      vy: -10, w: 7, h: 22,
    });
  }

  function triggerAction(noteName: string) {
    const p = playerRef.current;
    const now = performance.now();
    if (pcMatches(noteName, chord.left)) { p.moveDir = -1; p.moveUntil = now + PLAYER.moveDuration; bumpCleanNote(); }
    else if (pcMatches(noteName, chord.right)) { p.moveDir = 1; p.moveUntil = now + PLAYER.moveDuration; bumpCleanNote(); }
    else if (pcMatches(noteName, chord.fire)) { fire(); bumpCleanNote(); }
  }

  // Pitch action emitter — debounced
  useEffect(() => {
    if (phase !== 'playing') return;
    if (!pitch.note || pitch.stable < profile.stabilityRequired) return;
    if (Math.abs(pitch.cents) > profile.centTolerance) return;
    const now = performance.now();
    const last = lastActionTimeRef.current[pitch.note] ?? 0;
    if (now - last < profile.actionDebounceMs) return;
    lastActionTimeRef.current[pitch.note] = now;
    triggerAction(pitch.note);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pitch.note, pitch.stable, pitch.cents, phase, chord, profile.stabilityRequired, profile.centTolerance, profile.actionDebounceMs]);

  // Demo keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { demoKeysRef.current.left = true; setDemoMode(true); }
      else if (e.key === 'ArrowRight') { demoKeysRef.current.right = true; setDemoMode(true); }
      else if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); demoKeysRef.current.fire = true; setDemoMode(true); }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') demoKeysRef.current.left = false;
      else if (e.key === 'ArrowRight') demoKeysRef.current.right = false;
      else if (e.key === ' ' || e.code === 'Space') demoKeysRef.current.fire = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  function resetGame(toLevel = 0) {
    playerRef.current = {
      x: GAME_W / 2, y: GAME_H - 80, w: PLAYER.width, h: PLAYER.height,
      lives: PLAYER.startLives, shieldUntil: 0, fireReadyAt: 0,
      moveDir: 0, moveUntil: 0,
    };
    enemiesRef.current = [];
    projectilesRef.current = [];
    powerupsRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    comboRef.current = 0;
    lastSpawnRef.current = 0;
    bossSpawnedRef.current = false;
    setHudScore(0);
    setHudLives(PLAYER.startLives);
    setLevelIdx(toLevel);
  }

  function startPlaying() {
    resetGame(0);
    setPhase('playing');
  }

  function finishRun(end: 'game_over' | 'won') {
    setPhase(end);
    setPendingScore({ score: scoreRef.current, level: levelIdxRef.current + 1 });
    setNameError(null);
  }

  function nextLevel() {
    const next = levelIdxRef.current + 1;
    if (next >= LEVELS.length) {
      finishRun('won');
      return;
    }
    enemiesRef.current = [];
    projectilesRef.current = [];
    powerupsRef.current = [];
    bossSpawnedRef.current = false;
    setLevelIdx(next);
    setPhase('playing');
  }

  async function submitScore() {
    const name = playerName.trim().slice(0, 20);
    if (!name) { setNameError(t('game.nameRequired')); return; }
    if (!/^[\p{L}\p{N} _.\-]{1,20}$/u.test(name)) {
      setNameError(t('game.nameInvalid'));
      return;
    }
    if (!pendingScore || !user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('toneforce_highscores').insert({
        user_id: user.id,
        player_name: name,
        score: pendingScore.score,
        level_reached: pendingScore.level,
        difficulty: settings.difficulty,
        instrument: settings.instrument,
      });
      if (error) throw error;
      save(KEYS.playerName, name);
      setPendingScore(null);
    } catch {
      setNameError(t('highscores.loadError'));
    } finally {
      setSubmitting(false);
    }
  }

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(40, now - prev);
      prev = now;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const cssW = canvas.clientWidth || window.innerWidth;
      const cssH = canvas.clientHeight || window.innerHeight;
      const bw = Math.round(cssW * dpr);
      const bh = Math.round(cssH * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      const scale = Math.min(bw / GAME_W, bh / GAME_H);
      const offsetX = (bw - GAME_W * scale) / 2;
      const offsetY = (bh - GAME_H * scale) / 2;
      const sh = hitFxRef.current.shake;
      const shakeX = sh > 0 ? (Math.random() - 0.5) * sh * scale : 0;
      const shakeY = sh > 0 ? (Math.random() - 0.5) * sh * scale : 0;
      ctx.setTransform(scale, 0, 0, scale, offsetX + shakeX, offsetY + shakeY);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'low';

      const level = LEVELS[levelIdxRef.current];
      drawBackground(ctx, starsRef.current, dt, level.boss ? 'bg_boss' : 'bg_space');

      if (phaseRef.current === 'playing') {
        const p = playerRef.current;

        if (demoKeysRef.current.left) { p.moveDir = -1; p.moveUntil = now + 60; }
        if (demoKeysRef.current.right) { p.moveDir = 1; p.moveUntil = now + 60; }
        if (demoKeysRef.current.fire) fire();

        const livePitch = pitchRef.current;
        const sustainedMin = profileRef.current.sustainedStability;
        const sustainedCents = profileRef.current.centTolerance;
        if (livePitch.note && livePitch.stable >= sustainedMin && Math.abs(livePitch.cents) <= sustainedCents) {
          if (pcMatches(livePitch.note, chord.left)) { p.moveDir = -1; p.moveUntil = now + 80; }
          else if (pcMatches(livePitch.note, chord.right)) { p.moveDir = 1; p.moveUntil = now + 80; }
        }

        if (now > p.moveUntil) p.moveDir = 0;
        p.x += p.moveDir * PLAYER.speed;
        if (p.x < p.w / 2) p.x = p.w / 2;
        if (p.x > GAME_W - p.w / 2) p.x = GAME_W - p.w / 2;

        if (level.boss && !bossSpawnedRef.current && scoreRef.current >= level.targetScore - 200) {
          enemiesRef.current.push(spawnBoss(level));
          bossSpawnedRef.current = true;
        }
        if (!bossSpawnedRef.current && now - lastSpawnRef.current > level.enemySpawnRate) {
          enemiesRef.current.push(spawnEnemy(level));
          lastSpawnRef.current = now;
          if (Math.random() < 0.08) {
            powerupsRef.current.push({
              id: Date.now() + Math.random(),
              x: 30 + Math.random() * (GAME_W - 60), y: -10, vy: 1.2,
              kind: Math.random() < 0.5 ? 'shield' : 'extra_life',
            });
          }
        }

        for (const pr of projectilesRef.current) { pr.y += pr.vy; if (pr.vx) pr.x += pr.vx; }
        projectilesRef.current = projectilesRef.current.filter(
          (pr) => pr.y > -20 && pr.y < GAME_H + 20 && pr.x > -40 && pr.x < GAME_W + 40,
        );

        for (const e of enemiesRef.current) {
          e.y += e.vy;
          if (e.kind === 'boss') {
            e.x += e.vx;
            if (e.x < e.w / 2 || e.x > GAME_W - e.w / 2) e.vx *= -1;
          }
          if (e.kind === 'wrong_note' && levelIdxRef.current >= 1 && !e.hasFired && e.y > 40 && e.y < GAME_H - 120) {
            if (e.nextFireAt === undefined) e.nextFireAt = now + 1400 + Math.random() * 1400;
            if (now >= e.nextFireAt) {
              projectilesRef.current.push({
                id: Date.now() + Math.random(),
                x: e.x, y: e.y + e.h / 2,
                vy: 6, w: 10, h: 28, hostile: true,
              });
              e.hasFired = true;
            }
          }
          if (e.kind === 'boss') {
            if (e.nextFireAt === undefined) e.nextFireAt = now + 2000;
            if (now >= e.nextFireAt) {
              projectilesRef.current.push({
                id: Date.now() + Math.random(),
                x: e.x, y: e.y + e.h / 2,
                vy: 6.5, w: 10, h: 28, hostile: true,
              });
              e.nextFireAt = now + 2000;
            }
            if (e.nextSpawnAt === undefined) e.nextSpawnAt = now + 7000;
            if (now >= e.nextSpawnAt) {
              const lvl = LEVELS[levelIdxRef.current];
              for (let i = -1; i <= 1; i++) {
                enemiesRef.current.push({
                  id: Date.now() + Math.random() + i,
                  x: e.x + i * 50,
                  y: e.y + e.h / 2 + 10,
                  w: 88, h: 88,
                  vx: 0,
                  vy: lvl.enemySpeed + 0.6,
                  hp: 1, kind: 'wrong_note', points: 10,
                });
              }
              e.nextSpawnAt = now + 7000;
            }
          }
        }

        for (const pr of projectilesRef.current) {
          if (pr.hostile) continue;
          for (const e of enemiesRef.current) {
            if (e.hp <= 0) continue;
            const hit = e.kind === 'wrong_note'
              ? circleHit(e.x, e.y, e.w * 0.46, pr.x, pr.y, pr.w, pr.h)
              : aabb(pr.x, pr.y, pr.w, pr.h, e.x, e.y, e.w, e.h);
            if (hit) {
              e.hp -= 1;
              pr.y = -999;
              hitFxRef.current.flash = Math.max(hitFxRef.current.flash, e.hp <= 0 ? 0.32 : 0.16);
              hitFxRef.current.shake = Math.max(hitFxRef.current.shake, e.hp <= 0 ? 5 : 2.5);
              if (e.hp <= 0) {
                spawnExplosion(e.x, e.y, e.w);
                scoreRef.current += e.points;
                comboRef.current += 1;
                if (comboRef.current === 5) scoreRef.current += 25;
                if (comboRef.current === 10) scoreRef.current += 50;
                setHudScore(scoreRef.current);
              }
              break;
            }
          }
        }

        for (const pr of projectilesRef.current) {
          if (!pr.hostile) continue;
          if (aabb(pr.x, pr.y, pr.w, pr.h, p.x, p.y, p.w, p.h)) {
            pr.y = GAME_H + 999;
            if (now > p.shieldUntil) {
              p.lives -= 1;
              setHudLives(p.lives);
              comboRef.current = 0;
              p.shieldUntil = now + 1500;
              spawnPlayerHit(p.x, p.y, Math.max(p.w, p.h) * 1.1);
              hitFxRef.current.playerHit = 0.55;
              hitFxRef.current.shake = Math.max(hitFxRef.current.shake, 9);
              if (p.lives <= 0) { finishRun('game_over'); break; }
            }
          }
        }
        enemiesRef.current = enemiesRef.current.filter((e) => e.hp > 0 && e.y < GAME_H + 40);
        projectilesRef.current = projectilesRef.current.filter((pr) => pr.y > -20 && pr.y < GAME_H + 20);

        for (const pu of powerupsRef.current) pu.y += pu.vy;
        powerupsRef.current = powerupsRef.current.filter((pu) => {
          if (aabb(pu.x, pu.y, 24, 24, p.x, p.y, p.w, p.h)) {
            scoreRef.current += 20;
            if (pu.kind === 'shield') p.shieldUntil = now + PLAYER.shieldDuration;
            else { p.lives = Math.min(5, p.lives + 1); setHudLives(p.lives); }
            setHudScore(scoreRef.current);
            return false;
          }
          return pu.y < GAME_H + 20;
        });

        for (const e of enemiesRef.current) {
          if (aabb(e.x, e.y, e.w, e.h, p.x, p.y, p.w, p.h)) {
            if (now > p.shieldUntil) {
              p.lives -= 1;
              setHudLives(p.lives);
              comboRef.current = 0;
              p.shieldUntil = now + 1500;
              spawnPlayerHit(p.x, p.y, Math.max(p.w, p.h) * 1.1);
              hitFxRef.current.playerHit = 0.55;
              hitFxRef.current.shake = Math.max(hitFxRef.current.shake, 9);
              if (p.lives <= 0) { finishRun('game_over'); break; }
            }
            e.hp = 0;
            spawnExplosion(e.x, e.y, e.w);
          }
        }

        if (scoreRef.current >= level.targetScore && enemiesRef.current.every((e) => e.kind !== 'boss')) {
          setPhase('level_complete');
        }
      }

      updateParticles(dt);

      for (const pu of powerupsRef.current) drawPowerup(ctx, pu, now);
      for (const pr of projectilesRef.current) drawProjectile(ctx, pr, now);
      for (const e of enemiesRef.current) drawEnemy(ctx, e, now);
      drawPlayer(ctx, playerRef.current, now);
      drawParticles(ctx);

      if (hitFxRef.current.flash > 0.005) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgba(255, 235, 190, ${hitFxRef.current.flash})`;
        ctx.fillRect(0, 0, GAME_W, GAME_H);
        ctx.restore();
        hitFxRef.current.flash *= Math.pow(1e-10, dt / 1000);
      } else {
        hitFxRef.current.flash = 0;
      }
      if (hitFxRef.current.playerHit > 0.005) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        const a = hitFxRef.current.playerHit;
        const grad = ctx.createRadialGradient(GAME_W / 2, GAME_H / 2, GAME_H * 0.15, GAME_W / 2, GAME_H / 2, GAME_H * 0.75);
        grad.addColorStop(0, `rgba(255, 80, 80, ${a * 0.15})`);
        grad.addColorStop(1, `rgba(255, 30, 40, ${a * 0.85})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, GAME_W, GAME_H);
        ctx.restore();
        hitFxRef.current.playerHit *= Math.pow(1e-4, dt / 1000);
      } else {
        hitFxRef.current.playerHit = 0;
      }
      if (hitFxRef.current.shake > 0.05) {
        hitFxRef.current.shake *= Math.pow(1e-6, dt / 1000);
      } else {
        hitFxRef.current.shake = 0;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chord]);

  const level = LEVELS[levelIdx];

  return (
    <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,#3a1b7a_0%,#0c0524_70%)] text-white overflow-hidden">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 px-3 py-2 flex items-center justify-between text-sm bg-black/40 backdrop-blur-sm border-b border-white/10">
        <button onClick={() => navigate('/app?tab=game')} className="text-white/70 text-xs hover:text-white">
          {t('common.menu')}
        </button>
        <div className="flex items-center gap-3 text-xs">
          <span><b className="text-[#ffcc33]">{hudScore}</b> / {level.targetScore}</span>
          <span className="hidden sm:inline">{t('game.level')} {level.id} · {level.name}</span>
          <span className="text-white/80">🎺 {settings.instrument}</span>
          <span>{'❤️'.repeat(Math.max(0, hudLives))}</span>
        </div>
        <div className="text-xs text-white/60">
          {demoMode ? t('game.demoStatus') : status === 'active' ? t('game.micActive') : t('game.noInput')}
        </div>
      </div>

      {/* Canvas */}
      <div className="absolute inset-0">
        <div className="relative w-full h-full">
          <canvas ref={canvasRef} className="block w-full h-full bg-black" />

          {!assets.ready && (
            <Overlay>
              <h3 className="text-xl font-bold mb-3">{t('game.loadingSprites')}</h3>
              <div className="w-56 h-3 rounded-full bg-white/10 overflow-hidden border border-white/20">
                <div
                  className="h-full bg-gradient-to-r from-[#ffcc33] to-[#ff8a1f] transition-all duration-150"
                  style={{ width: `${Math.round(assets.progress * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-white/60">
                {t('game.loadingImages', { loaded: assets.loaded, total: assets.total })}
              </p>
            </Overlay>
          )}

          {assets.ready && assets.hasErrors && phase === 'ready' && (
            <div className="absolute top-2 left-2 right-2 rounded-lg bg-[#ff3b4d]/15 border border-[#ff3b4d]/50 text-[#ffd0d6] text-xs px-3 py-2 z-10">
              <div className="font-semibold mb-1">
                {t('game.spritesMissing', { failed: assets.failed.length, total: assets.total })}
              </div>
              <div className="text-[10px] opacity-80 mb-1 break-all">
                {assets.failed.slice(0, 4).join(', ')}
                {assets.failed.length > 4 ? ` … +${assets.failed.length - 4}` : ''}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="opacity-70">{t('game.fallback')}</span>
                <button
                  onClick={assets.retry}
                  className="rounded-md bg-white/10 hover:bg-white/20 px-2 py-1 text-[11px] font-medium"
                >
                  {t('game.reload')}
                </button>
              </div>
            </div>
          )}

          {assets.ready && phase === 'ready' && (
            <Overlay>
              <h3 className="text-2xl font-bold mb-2">{t('game.ready')}</h3>
              <p className="text-sm text-white/70 mb-4 text-center px-4">
                {t('game.chordLabel')}{' '}
                <b className="text-[#ffcc33]">{chord.left} – {chord.fire} – {chord.right}</b>
              </p>
              <div className="space-y-2 w-full max-w-xs">
                {status !== 'active' && (
                  <button
                    onClick={async () => { await start(); }}
                    className="w-full rounded-xl bg-gradient-to-r from-[#ff8a1f] to-[#ff3b4d] py-3 font-semibold"
                  >
                    {t('game.activateMic')}
                  </button>
                )}
                <button onClick={startPlaying} className="w-full rounded-xl bg-[#ffcc33] text-[#0c0524] py-3 font-bold">
                  {t('game.start')}
                </button>
                <p className="text-xs text-white/50 text-center">{t('game.demoHint')}</p>
              </div>
            </Overlay>
          )}

          {phase === 'level_complete' && (
            <Overlay>
              <h3 className="text-2xl font-bold mb-2">{t('game.levelComplete')}</h3>
              <p className="text-white/70 mb-4">{t('game.score')} <b className="text-[#ffcc33]">{hudScore}</b></p>
              <button onClick={nextLevel} className="rounded-xl bg-[#ffcc33] text-[#0c0524] px-6 py-3 font-bold">
                {t('game.nextLevel')}
              </button>
            </Overlay>
          )}

          {(phase === 'game_over' || phase === 'won') && (
            <Overlay>
              <div className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#1b0f3a]/95 to-[#0c0524]/95 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] px-6 py-6">
                {phase === 'won' ? (
                  <>
                    <div className="text-4xl mb-1">🏆</div>
                    <h3 className="text-2xl font-black text-[#ffcc33] tracking-wide">{t('game.won')}</h3>
                  </>
                ) : (
                  <h3 className="text-2xl font-black text-[#ff3b4d] tracking-wide">{t('game.gameOver')}</h3>
                )}

                <div className="mt-3 flex items-center justify-center gap-4 text-sm text-white/70">
                  <span>{t('game.score')} <b className="text-[#ffcc33] text-base">{hudScore}</b></span>
                  <span className="text-white/30">·</span>
                  <span>{t('game.level')} <b className="text-white">{pendingScore?.level ?? levelIdx + 1}</b></span>
                </div>

                {pendingScore ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); submitScore(); }}
                    className="mt-5 flex flex-col gap-3"
                  >
                    <label className="text-xs text-white/60 text-left">{t('game.nameLabel')}</label>
                    <input
                      autoFocus
                      type="text"
                      inputMode="text"
                      maxLength={20}
                      placeholder={t('game.namePlaceholder')}
                      value={playerName}
                      onChange={(e) => { setPlayerName(e.target.value); setNameError(null); }}
                      className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-[#ffcc33]"
                    />
                    {nameError && <p className="text-xs text-[#ff3b4d] text-left">{nameError}</p>}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 rounded-xl bg-[#ffcc33] text-[#0c0524] px-4 py-2 font-bold hover:brightness-110 transition disabled:opacity-60"
                      >
                        {submitting ? t('common.loading') : t('game.save')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingScore(null)}
                        className="rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-sm hover:bg-white/15 transition"
                      >
                        {t('game.skip')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() => { resetGame(0); setPhase('ready'); }}
                      className="flex-1 rounded-xl bg-white/10 border border-white/20 px-4 py-3 hover:bg-white/15 transition"
                    >
                      {t('game.restart')}
                    </button>
                    <button
                      onClick={() => navigate('/app?tab=game&tf=highscores')}
                      className="flex-1 rounded-xl bg-[#ffcc33] text-[#0c0524] px-4 py-3 font-bold hover:brightness-110 transition"
                    >
                      {t('game.highscores')}
                    </button>
                  </div>
                )}
              </div>
            </Overlay>
          )}
        </div>
      </div>

      {/* Bottom Pitch HUD */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-3 py-2 bg-black/40 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs text-white/70 mb-1">
            <span>{t('game.tone')} <b className="text-white">{pitch.note ?? '—'}</b></span>
            <span>{pitch.freq > 0 ? `${pitch.freq.toFixed(0)} Hz` : ''}</span>
          </div>
          <StabilityBar value={pitch.stable} />
        </div>
      </div>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center px-4">
      {children}
    </div>
  );
}
