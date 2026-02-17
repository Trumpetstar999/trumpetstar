
# Fix Build Error and iOS Safari Pitch Detection

## 1. Fix Build Error (Critical - Blocking)

The `es2020` target breaks the build because `pdfjs-dist` uses top-level `await`. Change the target to `es2022`, which supports top-level await and is compatible with Safari 15.2+ (released Jan 2022).

**File:** `vite.config.ts`
- Change `target: "es2020"` to `target: "es2022"` in both `build` and `optimizeDeps`

## 2. Fix Game Pitch Detection for iOS (`useGamePitchDetection.tsx`)

The existing iOS code is already well-structured. Key improvements:

- **Remove iOS-specific `getUserMedia` constraints** (`channelCount`, `sampleRate`) that Safari may reject -- use only the basic `echoCancellation: false, noiseSuppression: false, autoGainControl: false` for all platforms
- **Remove iOS-specific `AudioContext` options** (`sampleRate: 48000`) -- let Safari choose its native sample rate
- **Add `visibilitychange` listener** to suspend/resume AudioContext when tab is hidden or iPad screen locks
- **Add `onstatechange` listener** on AudioContext to handle iOS re-suspension

## 3. Fix Tuner Pitch Detection for iOS (`usePitchDetection.tsx`)

The tuner hook lacks all iOS handling that the game hook has. Apply similar patterns:

- **Add `webkitAudioContext` fallback** for older Safari
- **Resume AudioContext** after creation (`await ctx.resume()`)
- **Use simple `getUserMedia` constraints** (no advanced options)
- **Add `visibilitychange` handling**
- **Use `audioContext.sampleRate`** (already done, just verify)

## 4. Tuner Popup iOS Compatibility (`TunerPopup.tsx`)

The tuner auto-starts listening via `useEffect` when opened. On iOS this violates the user-gesture requirement. The existing "Aktivieren" button already exists but the `useEffect` tries to start before user taps it.

- **Remove auto-start `useEffect`** -- only start listening when user taps the "Aktivieren" button

---

## Technical Details

### `vite.config.ts`
```text
build.target: "es2020" --> "es2022"
optimizeDeps.esbuildOptions.target: "es2020" --> "es2022"
```

### `useGamePitchDetection.tsx` changes
- Lines 253-258: Remove iOS-specific constraints (`channelCount`, `sampleRate`)
- Lines 277-279: Remove iOS-specific AudioContext options (`sampleRate: 48000`)
- Add `useEffect` for `visibilitychange` event
- Add `onstatechange` handler on AudioContext after creation

### `usePitchDetection.tsx` changes
- Add `webkitAudioContext` fallback
- Add `audioContext.resume()` after creation
- Simplify `getUserMedia` constraints
- Add `visibilitychange` effect

### `TunerPopup.tsx` changes
- Remove the auto-start `useEffect` (lines 22-31) that calls `startListening()` on open
- User must tap "Aktivieren" button to start (already rendered in the UI)
