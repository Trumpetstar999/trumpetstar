

# Fix iPad Pitch Detection with Proven iOS Safari Audio Unlock Sequence

## Problem
Pitch detection still fails on iPad (iOS Safari) despite previous fixes. The current implementation does not follow the exact unlock sequence iOS Safari requires.

## Root Causes
1. AudioContext is created BEFORE playing the silent unlock buffer
2. `getUserMedia` is called BEFORE the AudioContext is confirmed running
3. The game button uses only `onClick` (not `touchend`, which iOS prefers)
4. The desktop fallback path uses `getByteTimeDomainData` (can return silence on iOS)
5. The mic source is connected through a GainNode, adding unnecessary complexity
6. No on-screen debug overlay to diagnose issues on iPad

## Changes

### 1. `useGamePitchDetection.tsx` -- Rewrite `startListening` with proven sequence

Replace the entire `startListening` function to follow the exact iOS unlock order:

1. Create AudioContext (with `webkitAudioContext` fallback)
2. Play a silent buffer to unlock iOS audio (`createBuffer` -> `createBufferSource` -> `start`)
3. `await audioContext.resume()` if not running
4. ONLY THEN call `getUserMedia` with minimal constraints
5. Verify the audio track is `live`
6. Create `MediaStreamSource` and `AnalyserNode`
7. Connect source to analyser ONLY (NOT to `destination` on the source path)
8. For iOS ScriptProcessor path: connect through ScriptProcessor to destination (outputting silence)
9. Verify data is flowing with a test read

Also:
- Remove the `getByteTimeDomainData` fallback in `analyzeDesktop` (use Float32Array only)
- Remove the GainNode from the pipeline (source -> analyser directly on desktop, source -> scriptProcessor on iOS)
- Add a `startedRef` flag to prevent double initialization

### 2. `usePitchDetection.tsx` (Tuner) -- Same proven sequence

Apply the identical unlock pattern:
1. Create AudioContext
2. Play silent buffer
3. Resume
4. getUserMedia
5. Verify track
6. source -> analyser only (no destination connection)

### 3. `GamePlayPage.tsx` -- Add `touchend` + `click` dual listeners + debug overlay

- Replace `onClick={handleActivateMic}` with a ref-based approach using both `touchend` and `click` event listeners (with `{ once: true }` and a guard flag)
- Add a toggleable debug overlay (bug icon button) showing:
  - AudioContext state + sampleRate
  - Audio track readyState + muted
  - Raw RMS volume
  - Detected frequency (Hz)
  - Frame counter

### 4. `TunerPopup.tsx` -- Add `touchend` support

The "Aktivieren" button already uses `onClick`. Add `onTouchEnd` with a guard flag to ensure it fires on iPad.

---

## Technical Details

### `useGamePitchDetection.tsx`

**startListening rewrite (lines 243-390):**

```text
// NEW unlock sequence:
1. const ACtor = window.AudioContext || window.webkitAudioContext
2. const ctx = new ACtor({ latencyHint: 'playback' })  // iOS only
3. // Play silent buffer to unlock
   const silentBuf = ctx.createBuffer(1, 1, ctx.sampleRate)
   const silentSrc = ctx.createBufferSource()
   silentSrc.buffer = silentBuf
   silentSrc.connect(ctx.destination)
   silentSrc.start(0)
4. if (ctx.state !== 'running') await ctx.resume()
5. // NOW getUserMedia
   stream = await navigator.mediaDevices.getUserMedia({audio:{...}})
6. // Verify track
   const track = stream.getAudioTracks()[0]
   if (!track || track.readyState !== 'live') throw Error(...)
7. const source = ctx.createMediaStreamSource(stream)
8. // iOS: source -> scriptProcessor -> destination (silent output)
   // Desktop: source -> analyser (NO destination)
```

**Remove byte fallback (lines 220-232):**
Delete the `getByteTimeDomainData` fallback block in `analyzeDesktop`. Use only `getFloatTimeDomainData`.

**Remove GainNode (lines 297-304):**
Connect source directly to analyser/scriptProcessor instead of routing through a GainNode.

**Export debug data:**
Add exported refs/state for debug info (rms, frequency, frameCount, audioContext state, track info).

### `usePitchDetection.tsx`

**startListening rewrite (lines 151-197):**
Same silent-buffer-first pattern. Remove source -> destination connection. Source connects only to analyser.

### `GamePlayPage.tsx`

**Dual event listeners (around line 119):**
Replace `onClick={handleActivateMic}` with a `useEffect` + `useRef` approach:
```text
const buttonRef = useRef<HTMLButtonElement>(null)
const handledRef = useRef(false)

useEffect(() => {
  const btn = buttonRef.current
  if (!btn || micActivated) return
  const handler = async (e) => {
    e.preventDefault()
    if (handledRef.current) return
    handledRef.current = true
    await handleActivateMic()
  }
  btn.addEventListener('touchend', handler, { once: true })
  btn.addEventListener('click', handler, { once: true })
  return () => {
    btn.removeEventListener('touchend', handler)
    btn.removeEventListener('click', handler)
  }
}, [micActivated, handleActivateMic])
```

**Debug overlay:**
New component rendered conditionally, toggled by a small bug icon button. Shows AudioContext state, sampleRate, track status, RMS, frequency, and frame count -- pulled from new debug exports on the hook.

### `TunerPopup.tsx`

Add `onTouchEnd` to the Aktivieren button with a guard:
```text
const handledRef = useRef(false)
const handleStart = (e) => {
  e.preventDefault()
  if (handledRef.current) return
  handledRef.current = true
  startListening()
  setTimeout(() => { handledRef.current = false }, 500)
}
// button: onTouchEnd={handleStart} onClick={handleStart}
```

## Files Modified
- `src/hooks/useGamePitchDetection.tsx` -- Proven unlock sequence, remove byte fallback, remove GainNode, export debug data
- `src/hooks/usePitchDetection.tsx` -- Proven unlock sequence, source -> analyser only
- `src/pages/GamePlayPage.tsx` -- Dual touchend/click, debug overlay
- `src/components/tuner/TunerPopup.tsx` -- touchend support

