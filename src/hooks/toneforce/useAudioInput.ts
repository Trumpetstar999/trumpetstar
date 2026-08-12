import { useCallback, useEffect, useRef, useState } from "react";

export type MicStatus = "idle" | "requesting" | "active" | "denied" | "error";

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
}

export function useAudioInput() {
  const [status, setStatus] = useState<MicStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    if (typeof window === "undefined") return;
    setStatus("requesting");
    setError(null);
    try {
      const ios = isIOS();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          // iOS Safari delivers very low input levels without AGC — enable only there.
          autoGainControl: ios,
          channelCount: 1,
          sampleRate: 48000,
        } as MediaTrackConstraints,
      });
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      // iOS starts the AudioContext suspended until a user gesture resumes it.
      if (ctx.state === "suspended") {
        try { await ctx.resume(); } catch { /* ignore */ }
      }
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0;
      src.connect(analyser);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      streamRef.current = stream;
      setStatus("active");
    } catch (e) {
      const err = e as Error;
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") setStatus("denied");
      else setStatus("error");
      setError(err.message);
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close();
    streamRef.current = null;
    ctxRef.current = null;
    analyserRef.current = null;
    setStatus("idle");
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { status, error, start, stop, analyserRef, ctxRef };
}
