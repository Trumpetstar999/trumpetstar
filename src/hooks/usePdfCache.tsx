import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DB_NAME = 'trumpetstar-pdf-cache';
const STORE_NAME = 'pdfs';
const DB_VERSION = 1;

interface CachedPdf {
  id: string;
  blob: Blob;
  cachedAt: number;
}

interface DownloadProgress {
  pdfId: string;
  progress: number; // 0-100
  isDownloading: boolean;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

async function getCachedPdf(pdfId: string): Promise<CachedPdf | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(pdfId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch {
    return null;
  }
}

async function savePdfToCache(pdfId: string, blob: Blob): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({
        id: pdfId,
        blob,
        cachedAt: Date.now(),
      });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('Failed to cache PDF:', error);
  }
}

export function usePdfCache() {
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

  const getPdfUrl = useCallback(async (pdfId: string, pdfFileUrl: string): Promise<string | null> => {
    // Check cache first
    const cached = await getCachedPdf(pdfId);
    if (cached) {
      console.log('PDF loaded from cache:', pdfId);
      return URL.createObjectURL(cached.blob);
    }

    // Start download with progress
    setDownloadProgress({ pdfId, progress: 0, isDownloading: true });

    try {
      // Extract file path from URL - handle both public and signed URL formats
      let filePath = '';
      
      // Format: .../pdf-documents/filename.pdf
      if (pdfFileUrl.includes('/pdf-documents/')) {
        const urlParts = pdfFileUrl.split('/pdf-documents/');
        filePath = urlParts[urlParts.length - 1];
      }

      if (!filePath) {
        console.error('Could not extract file path from URL:', pdfFileUrl);
        setDownloadProgress(null);
        return null;
      }

      console.log('Getting signed URL for file path:', filePath);

      const { data: signedData, error: signError } = await supabase.storage
        .from('pdf-documents')
        .createSignedUrl(filePath, 3600);

      if (signError || !signedData?.signedUrl) {
        console.error('Failed to get signed URL:', signError);
        setDownloadProgress(null);
        return null;
      }

      console.log('Got signed URL, starting download...');

      // Download with progress tracking
      const response = await fetch(signedData.signedUrl);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        received += value.length;
        
        if (total > 0) {
          const progress = Math.round((received / total) * 100);
          setDownloadProgress({ pdfId, progress, isDownloading: true });
        }
      }

      // Combine chunks into blob
      const blob = new Blob(chunks as BlobPart[], { type: 'application/pdf' });
      
      console.log('Download complete, blob size:', blob.size);
      
      // Cache the PDF
      await savePdfToCache(pdfId, blob);
      
      setDownloadProgress({ pdfId, progress: 100, isDownloading: false });
      
      // Small delay to show 100%
      await new Promise(resolve => setTimeout(resolve, 300));
      setDownloadProgress(null);
      
      const blobUrl = URL.createObjectURL(blob);
      console.log('Created blob URL:', blobUrl);
      
      return blobUrl;
    } catch (error) {
      console.error('Failed to download PDF:', error);
      setDownloadProgress(null);
      return null;
    }
  }, []);

  const clearCache = useCallback(async (pdfId?: string) => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      if (pdfId) {
        store.delete(pdfId);
      } else {
        store.clear();
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }, []);

  const isCached = useCallback(async (pdfId: string): Promise<boolean> => {
    const cached = await getCachedPdf(pdfId);
    return cached !== null;
  }, []);

  return {
    getPdfUrl,
    downloadProgress,
    clearCache,
    isCached,
  };
}
