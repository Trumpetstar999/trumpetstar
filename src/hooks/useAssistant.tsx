import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useMembership } from './useMembership';
import { useToast } from './use-toast';
import { useQuery } from '@tanstack/react-query';

export type AssistantMode = 'platform' | 'technique' | 'mental' | 'repertoire' | 'mixed';
export type AssistantLanguage = 'auto' | 'de' | 'en';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  feedback?: 'positive' | 'negative';
}

interface AssistantState {
  messages: Message[];
  isLoading: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  mode: AssistantMode;
  language: AssistantLanguage;
  readAloud: boolean;
  conversationId: string | null;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assistant-chat`;
const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;
const STT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-stt`;

// Detect language from text
function detectLanguage(text: string): 'de' | 'en' {
  const germanWords = ['ich', 'und', 'der', 'die', 'das', 'ist', 'nicht', 'ein', 'eine', 'wie', 'was', 'kann', 'mit', 'für', 'auf', 'haben', 'werden', 'bei', 'nach', 'über'];
  const words = text.toLowerCase().split(/\s+/);
  const germanCount = words.filter(w => germanWords.includes(w)).length;
  return germanCount >= 2 ? 'de' : 'en';
}

export function useAssistant() {
  const { user } = useAuth();
  const { planKey } = useMembership();
  const { toast } = useToast();

  // Fetch user's display name from profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });
  
  const [state, setState] = useState<AssistantState>({
    messages: [],
    isLoading: false,
    isListening: false,
    isSpeaking: false,
    mode: 'mixed',
    language: 'auto',
    readAloud: false,
    conversationId: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const setMode = useCallback((mode: AssistantMode) => {
    setState(prev => ({ ...prev, mode }));
  }, []);

  const setLanguage = useCallback((language: AssistantLanguage) => {
    setState(prev => ({ ...prev, language }));
  }, []);

  const setReadAloud = useCallback((readAloud: boolean) => {
    setState(prev => ({ ...prev, readAloud }));
    if (!readAloud && audioRef.current) {
      audioRef.current.pause();
      setState(prev => ({ ...prev, isSpeaking: false }));
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.isLoading) return;

    // Detect language if auto
    const detectedLang = state.language === 'auto' ? detectLanguage(content) : state.language;

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }));

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // Build messages for API
      const apiMessages = state.messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
      apiMessages.push({ role: 'user', content: content.trim() });

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          mode: state.mode,
          language: detectedLang,
          userPlanKey: planKey || 'FREE',
          userName: profile?.display_name || '',
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      // Stream the response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantMessageId = crypto.randomUUID();

      // Add placeholder assistant message
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        }],
      }));

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process SSE lines
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setState(prev => ({
                ...prev,
                messages: prev.messages.map(m =>
                  m.id === assistantMessageId ? { ...m, content: assistantContent } : m
                ),
              }));
            }
          } catch {
            // Incomplete JSON, will be completed in next chunk
          }
        }
      }

      setState(prev => ({ ...prev, isLoading: false }));

      // Read aloud if enabled
      if (state.readAloud && assistantContent) {
        speakText(assistantContent, detectedLang);
      }

    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      
      console.error('[useAssistant] Error:', error);
      toast({
        title: 'Fehler',
        description: (error as Error).message || 'Beim Verarbeiten ist ein Fehler aufgetreten.',
        variant: 'destructive',
      });
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.messages, state.mode, state.language, state.isLoading, state.readAloud, planKey, profile?.display_name, toast]);

  const speakText = useCallback(async (text: string, language: 'de' | 'en') => {
    try {
      setState(prev => ({ ...prev, isSpeaking: true }));

      const response = await fetch(TTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text, language }),
      });

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setState(prev => ({ ...prev, isSpeaking: false }));
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        setState(prev => ({ ...prev, isSpeaking: false }));
        URL.revokeObjectURL(audioUrl);
      };
      
      await audioRef.current.play();
    } catch (error) {
      console.error('[useAssistant] TTS Error:', error);
      setState(prev => ({ ...prev, isSpeaking: false }));
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setState(prev => ({ ...prev, isSpeaking: false }));
  }, []);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        if (audioChunksRef.current.length === 0) return;

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const response = await fetch(STT_URL, {
            method: 'POST',
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`STT request failed: ${response.status}`);
          }

          const result = await response.json();
          if (result.text) {
            sendMessage(result.text);
          }
        } catch (error) {
          console.error('[useAssistant] STT Error:', error);
          toast({
            title: 'Spracherkennung fehlgeschlagen',
            description: 'Die Aufnahme konnte nicht verarbeitet werden.',
            variant: 'destructive',
          });
        }
      };

      mediaRecorder.start();
      setState(prev => ({ ...prev, isListening: true }));
    } catch (error) {
      console.error('[useAssistant] Microphone Error:', error);
      toast({
        title: 'Mikrofon nicht verfügbar',
        description: 'Bitte erlaube den Zugriff auf das Mikrofon.',
        variant: 'destructive',
      });
    }
  }, [sendMessage, toast]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setState(prev => ({ ...prev, isListening: false }));
  }, []);

  const provideFeedback = useCallback(async (messageId: string, feedback: 'positive' | 'negative') => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m =>
        m.id === messageId ? { ...m, feedback } : m
      ),
    }));

    // Save feedback to database
    if (user && state.conversationId) {
      try {
        await supabase
          .from('assistant_messages')
          .update({ feedback })
          .eq('id', messageId);
      } catch (error) {
        console.error('[useAssistant] Feedback save error:', error);
      }
    }
  }, [user, state.conversationId]);

  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      conversationId: null,
    }));
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    isListening: state.isListening,
    isSpeaking: state.isSpeaking,
    mode: state.mode,
    language: state.language,
    readAloud: state.readAloud,
    setMode,
    setLanguage,
    setReadAloud,
    sendMessage,
    speakText,
    stopSpeaking,
    startListening,
    stopListening,
    provideFeedback,
    clearMessages,
  };
}
