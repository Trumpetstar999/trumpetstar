import { useState, useRef, useCallback, useEffect } from 'react';

export interface VideoRecorderState {
  isRecording: boolean;
  isStarting: boolean;
  isStopping: boolean;
  duration: number;
  error: string | null;
  hasPermission: boolean | null;
}

export interface VideoRecorderResult {
  blob: Blob;
  duration: number;
}

export function useVideoRecorder() {
  const [state, setState] = useState<VideoRecorderState>({
    isRecording: false,
    isStarting: false,
    isStopping: false,
    duration: 0,
    error: null,
    hasPermission: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const resolveRecordingRef = useRef<((result: VideoRecorderResult) => void) | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    chunksRef.current = [];
  }, []);

  // Check camera permission
  const checkPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Try to access camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });
      
      // Immediately stop - we just needed to check
      stream.getTracks().forEach(track => track.stop());
      
      setState(prev => ({ ...prev, hasPermission: true, error: null }));
      return true;
    } catch (err) {
      console.error('Permission check failed:', err);
      const errorMessage = err instanceof Error && err.name === 'NotAllowedError'
        ? 'Kamera- und Mikrofonzugriff wurde verweigert.'
        : 'Kamera oder Mikrofon nicht verfügbar.';
      
      setState(prev => ({ 
        ...prev, 
        hasPermission: false, 
        error: errorMessage 
      }));
      return false;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async (): Promise<boolean> => {
    // Prevent double-start
    if (state.isRecording || state.isStarting) {
      return false;
    }

    setState(prev => ({ ...prev, isStarting: true, error: null }));

    try {
      // Get camera + microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // Determine best MIME type for iOS/Android/Web
      const mimeTypes = [
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error('Kein unterstütztes Videoformat gefunden.');
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedMimeType });
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        
        if (resolveRecordingRef.current) {
          resolveRecordingRef.current({ blob, duration });
          resolveRecordingRef.current = null;
        }

        cleanup();
        setState(prev => ({ 
          ...prev, 
          isRecording: false, 
          isStopping: false,
          duration: 0 
        }));
      };

      mediaRecorder.onerror = () => {
        setState(prev => ({ 
          ...prev, 
          error: 'Aufnahme fehlgeschlagen.',
          isRecording: false,
          isStarting: false,
          isStopping: false,
        }));
        cleanup();
      };

      // Start recording with 1 second timeslice for reliable data capture
      mediaRecorder.start(1000);
      startTimeRef.current = Date.now();

      // Start duration timer
      timerRef.current = setInterval(() => {
        setState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);

      setState(prev => ({ 
        ...prev, 
        isRecording: true, 
        isStarting: false,
        hasPermission: true,
        duration: 0,
      }));

      return true;
    } catch (err) {
      console.error('Failed to start recording:', err);
      
      let errorMessage = 'Aufnahme konnte nicht gestartet werden.';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Kamera- und Mikrofonzugriff wurde verweigert. Bitte erlaube den Zugriff in den Einstellungen.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'Keine Kamera oder Mikrofon gefunden.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Kamera wird von einer anderen App verwendet.';
        }
      }

      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isStarting: false,
        hasPermission: false,
      }));
      
      cleanup();
      return false;
    }
  }, [state.isRecording, state.isStarting, cleanup]);

  // Stop recording and return the blob
  const stopRecording = useCallback((): Promise<VideoRecorderResult | null> => {
    return new Promise((resolve) => {
      if (!state.isRecording || !mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      setState(prev => ({ ...prev, isStopping: true }));
      resolveRecordingRef.current = resolve;

      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('Error stopping recording:', err);
        cleanup();
        setState(prev => ({ 
          ...prev, 
          isRecording: false, 
          isStopping: false,
          error: 'Fehler beim Stoppen der Aufnahme.' 
        }));
        resolve(null);
      }
    });
  }, [state.isRecording, cleanup]);

  // Cancel recording without saving
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        // Ignore errors during cancel
      }
    }
    cleanup();
    setState({
      isRecording: false,
      isStarting: false,
      isStopping: false,
      duration: 0,
      error: null,
      hasPermission: state.hasPermission,
    });
  }, [state.isRecording, state.hasPermission, cleanup]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    ...state,
    startRecording,
    stopRecording,
    cancelRecording,
    checkPermission,
    clearError,
  };
}
