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
      
      request.onerror = () => {
        console.error('IndexedDB get error:', request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        const result = request.result as CachedPdf | undefined;
        if (result && result.blob && result.blob.size > 0) {
          console.log('Cache entry found for PDF:', pdfId, 'blob size:', result.blob.size);
          resolve(result);
        } else {
          console.log('Cache miss for PDF:', pdfId);
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.error('getCachedPdf error:', error);
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
      request.onsuccess = () => {
        console.log('PDF cached successfully:', pdfId);
        resolve();
      };
    });
  } catch (error) {
    console.error('Failed to cache PDF:', error);
  }
}

async function clearCacheEntry(pdfId: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(pdfId);
      request.onsuccess = () => {
        console.log('Cleared cache entry for:', pdfId);
        resolve();
      };
      request.onerror = () => {
        console.error('Failed to clear cache:', request.error);
        resolve();
      };
    });
  } catch (error) {
    console.error('Failed to clear cache entry:', error);
  }
}

// Validate that a blob is a valid PDF by reading its header bytes
async function isValidPdfBlob(blob: Blob): Promise<boolean> {
  if (!blob || blob.size < 1000) {
    console.log('Blob too small to be valid PDF:', blob?.size);
    return false;
  }
  
  try {
    // Read first 5 bytes to check PDF magic number
    const headerSlice = blob.slice(0, 5);
    const arrayBuffer = await headerSlice.arrayBuffer();
    const header = new TextDecoder().decode(arrayBuffer);
    const isValid = header.startsWith('%PDF-');
    console.log('PDF validation result:', isValid, 'header:', header);
    return isValid;
  } catch (e) {
    console.error('Error validating PDF blob:', e);
    return false;
  }
}

export function usePdfCache() {
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

  const getPdfUrl = useCallback(async (pdfId: string, pdfFileUrl: string): Promise<string | null> => {
    console.log('getPdfUrl called for:', pdfId);
    
    // Check cache first
    const cached = await getCachedPdf(pdfId);
    
    if (cached) {
      // Validate the cached blob is a real PDF
      const isValid = await isValidPdfBlob(cached.blob);
      
      if (isValid) {
        console.log('Valid PDF found in cache:', pdfId);
        const blobUrl = URL.createObjectURL(cached.blob);
        console.log('Created blob URL from cache:', blobUrl);
        return blobUrl;
      } else {
        console.log('Cached blob is invalid, clearing cache for:', pdfId);
        await clearCacheEntry(pdfId);
      }
    }

    // Start download with progress
    console.log('Starting fresh download for PDF:', pdfId);
    setDownloadProgress({ pdfId, progress: 0, isDownloading: true });

    try {
      // Extract file path from URL - handle both public and signed URL formats
      let filePath = '';
      
      // Decode the URL first to handle encoded characters
      const decodedUrl = decodeURIComponent(pdfFileUrl);
      
      // Format: .../pdf-documents/filename.pdf
      if (decodedUrl.includes('/pdf-documents/')) {
        const urlParts = decodedUrl.split('/pdf-documents/');
        filePath = urlParts[urlParts.length - 1];
        // Remove any query params
        if (filePath.includes('?')) {
          filePath = filePath.split('?')[0];
        }
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
        throw new Error(`Download failed with status: ${response.status}`);
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
      
      // Validate downloaded blob
      const isValid = await isValidPdfBlob(blob);
      if (!isValid) {
        console.error('Downloaded blob is not a valid PDF');
        setDownloadProgress(null);
        return null;
      }
      
      // Cache the PDF
      await savePdfToCache(pdfId, blob);
      
      setDownloadProgress({ pdfId, progress: 100, isDownloading: false });
      
      // Small delay to show 100%
      await new Promise(resolve => setTimeout(resolve, 300));
      setDownloadProgress(null);
      
      const blobUrl = URL.createObjectURL(blob);
      console.log('Created blob URL from download:', blobUrl);
      
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
        console.log('Cleared cache for:', pdfId);
      } else {
        store.clear();
        console.log('Cleared entire PDF cache');
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }, []);

  const isCached = useCallback(async (pdfId: string): Promise<boolean> => {
    const cached = await getCachedPdf(pdfId);
    if (!cached) return false;
    return await isValidPdfBlob(cached.blob);
  }, []);

  return {
    getPdfUrl,
    downloadProgress,
    clearCache,
    isCached,
  };
}
