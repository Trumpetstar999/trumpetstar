import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Recording {
  id: string;
  title: string;
  url: string;
  storage_path: string;
  thumbnail?: string;
  createdAt: string;
  duration: number;
}

export function useRecordings() {
  const { user } = useAuth();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecordings = useCallback(async () => {
    if (!user) {
      setRecordings([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_recordings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get signed URLs for each recording (private access)
      const recordingsWithUrls = await Promise.all(
        (data || []).map(async (rec) => {
          const { data: urlData, error: urlError } = await supabase.storage
            .from('recordings')
            .createSignedUrl(rec.storage_path, 3600); // 1 hour expiry

          if (urlError) {
            console.error('Error creating signed URL:', urlError);
          }

          return {
            id: rec.id,
            title: rec.title || 'Unbenannte Aufnahme',
            url: urlData?.signedUrl || '',
            storage_path: rec.storage_path,
            createdAt: rec.created_at,
            duration: rec.duration_seconds || 0,
          };
        })
      );

      setRecordings(recordingsWithUrls);
    } catch (error) {
      console.error('Error fetching recordings:', error);
      toast.error('Fehler beim Laden der Aufnahmen');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveRecording = useCallback(async (recording: { title: string; blob: Blob; duration: number }) => {
    if (!user) {
      toast.error('Du musst eingeloggt sein, um Aufnahmen zu speichern');
      return null;
    }

    try {
      // Determine file extension based on blob type
      const blobType = recording.blob.type || 'video/webm';
      const extension = blobType.includes('mp4') ? 'mp4' : 'webm';
      const fileName = `${Date.now()}.${extension}`;
      const storagePath = `${user.id}/${fileName}`;

      console.log('Uploading recording:', { storagePath, blobType, size: recording.blob.size });

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(storagePath, recording.blob, {
          contentType: blobType,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Save metadata to database
      const { data, error: dbError } = await supabase
        .from('user_recordings')
        .insert({
          user_id: user.id,
          title: recording.title,
          storage_path: storagePath,
          duration_seconds: recording.duration,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Get signed URL (private access)
      const { data: urlData } = await supabase.storage
        .from('recordings')
        .createSignedUrl(storagePath, 3600); // 1 hour expiry

      const newRecording: Recording = {
        id: data.id,
        title: data.title || 'Unbenannte Aufnahme',
        url: urlData?.signedUrl || '',
        storage_path: storagePath,
        createdAt: data.created_at,
        duration: data.duration_seconds || 0,
      };

      setRecordings(prev => [newRecording, ...prev]);
      toast.success('Aufnahme gespeichert!');
      return newRecording;
    } catch (error) {
      console.error('Error saving recording:', error);
      toast.error('Fehler beim Speichern der Aufnahme');
      return null;
    }
  }, [user]);

  const deleteRecording = useCallback(async (id: string) => {
    const recording = recordings.find(r => r.id === id);
    if (!recording) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('recordings')
        .remove([recording.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('user_recordings')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      setRecordings(prev => prev.filter(r => r.id !== id));
      toast.success('Aufnahme gelöscht');
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast.error('Fehler beim Löschen der Aufnahme');
    }
  }, [recordings]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  return {
    recordings,
    loading,
    saveRecording,
    deleteRecording,
    refetch: fetchRecordings,
  };
}
