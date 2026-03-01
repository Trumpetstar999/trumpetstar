import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DB_NAME = 'trumpetstar-pdf-cache';
const STORE_NAME = 'pdfs';
const DB_VERSION = 2;
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

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

export interface PdfDiagnostics {
  pdfId: string;
  pdfFileUrl: string;
  proxyUrl: string;
  httpStatus: number | null;
  contentType: string | null;
  contentDisposition: string | null;
  corsHeader: string | null;
  fileSize: number | null;
  pdfHeader: string | null;
  workerReachable: boolean | null;
  error: string | null;
  timestamp: number;
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
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(pdfId);

      request.onerror = () => {
        console.error('IndexedDB get error:', request.error);
        resolve(null);
      };
      request.onsuccess = () => {
        const result = request.result as CachedPdf | undefined;
        if (result && result.blob && result.blob.size > 0) {
          // Check if cache entry is still valid (within 30 days)
          const age = Date.now() - (result.cachedAt || 0);
          if (age > CACHE_MAX_AGE_MS) {
            console.log('Cache entry expired for PDF:', pdfId);
            resolve(null);
            return;
          }
          console.log('Cache hit for PDF:', pdfId, 'blob size:', result.blob.size, 'age:', Math.round(age / 86400000) + 'd');
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

// Validate that a blob is a valid PDF by checking size and magic bytes
async function isValidPdfBlob(blob: Blob): Promise<boolean> {
  if (!blob || blob.size < 100) {
    console.log('Blob too small to be valid PDF:', blob?.size);
    return false;
  }

  try {
    // Check PDF magic bytes: %PDF- = 0x25 0x50 0x44 0x46 0x2D
    const headerSlice = blob.slice(0, 8);
    const arrayBuffer = await headerSlice.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Allow for optional BOM before %PDF-
    const startsAtZero = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
    const startsAtThree = bytes[3] === 0x25 && bytes[4] === 0x50 && bytes[5] === 0x44 && bytes[6] === 0x46; // after BOM

    const isValid = startsAtZero || startsAtThree;
    console.log('PDF validation result:', isValid, 'size:', blob.size, 'bytes:', Array.from(bytes.slice(0, 5)));
    return isValid;
  } catch (e) {
    console.error('Error validating PDF blob:', e);
    // If validation itself fails, trust the blob if it's large enough
    return blob.size > 10000;
  }
}

// Check if PDF.js worker is reachable
async function checkWorkerReachable(): Promise<boolean> {
  try {
    // Check local worker file
    const response = await fetch('/pdf.worker.min.mjs', {
      method: 'HEAD',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function usePdfCache() {
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [diagnostics, setDiagnostics] = useState<PdfDiagnostics | null>(null);

  // Run diagnostics for a PDF
  const runDiagnostics = useCallback(async (pdfId: string, pdfFileUrl: string): Promise<PdfDiagnostics> => {
    const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pdf-proxy?docId=${pdfId}`;
    
    const diag: PdfDiagnostics = {
      pdfId,
      pdfFileUrl: pdfFileUrl.substring(0, 80) + '...',
      proxyUrl: proxyUrl.substring(0, 80) + '...',
      httpStatus: null,
      contentType: null,
      contentDisposition: null,
      corsHeader: null,
      fileSize: null,
      pdfHeader: null,
      workerReachable: null,
      error: null,
      timestamp: Date.now(),
    };

    try {
      // Check worker
      diag.workerReachable = await checkWorkerReachable();

      // Test proxy endpoint with debug mode
      const debugResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pdf-proxy?docId=${pdfId}&debug=1`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      diag.httpStatus = debugResponse.status;
      diag.contentType = debugResponse.headers.get('content-type');
      diag.corsHeader = debugResponse.headers.get('access-control-allow-origin');

      if (debugResponse.ok) {
        const debugData = await debugResponse.json();
        diag.fileSize = debugData.fileSize || null;
        diag.pdfHeader = debugData.pdfHeader || null;
        diag.contentType = debugData.contentType || diag.contentType;
      } else {
        const errorData = await debugResponse.json().catch(() => ({}));
        diag.error = errorData.error || `HTTP ${debugResponse.status}`;
      }
    } catch (e) {
      diag.error = String(e);
    }

    setDiagnostics(diag);
    return diag;
  }, []);

  const getPdfUrl = useCallback(async (pdfId: string, pdfFileUrl: string, useProxy = true): Promise<string | null> => {
    console.log('getPdfUrl called for:', pdfId, 'useProxy:', useProxy);
    
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
      let downloadUrl: string;
      
      if (useProxy) {
        // Use the proxy endpoint to get a signed URL
        const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pdf-proxy?docId=${pdfId}`;
        console.log('Getting signed URL from proxy:', proxyUrl);
        
        // Get auth token for proxy requests
        const session = await supabase.auth.getSession();
        const authToken = session.data.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        
        const proxyResponse = await fetch(proxyUrl, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });
        
        if (!proxyResponse.ok) {
          const errorData = await proxyResponse.json().catch(() => ({}));
          console.error('Proxy request failed:', proxyResponse.status, errorData);
          
          // Fallback to direct URL approach
          console.log('Proxy failed, trying direct URL fallback...');
          setDownloadProgress(null);
          return getPdfUrl(pdfId, pdfFileUrl, false);
        }
        
        const proxyData = await proxyResponse.json();
        
        if (!proxyData.signedUrl) {
          console.error('Proxy did not return signed URL:', proxyData);
          setDownloadProgress(null);
          return getPdfUrl(pdfId, pdfFileUrl, false);
        }
        
        downloadUrl = proxyData.signedUrl;
        console.log('Got signed URL from proxy');
      } else {
        // Fallback to direct signed URL approach
        let filePath = '';
        const decodedUrl = decodeURIComponent(pdfFileUrl);
        
        if (decodedUrl.includes('/pdf-documents/')) {
          const urlParts = decodedUrl.split('/pdf-documents/');
          filePath = urlParts[urlParts.length - 1];
          if (filePath.includes('?')) {
            filePath = filePath.split('?')[0];
          }
        }

        if (!filePath) {
          console.error('Could not extract file path from URL:', pdfFileUrl);
          setDownloadProgress(null);
          return null;
        }

        const { data: signedData, error: signError } = await supabase.storage
          .from('pdf-documents')
          .createSignedUrl(filePath, 3600);

        if (signError || !signedData?.signedUrl) {
          console.error('Failed to get signed URL:', signError);
          setDownloadProgress(null);
          return null;
        }

        downloadUrl = signedData.signedUrl;
      }

      console.log('Starting download from signed URL...');

      // Download the PDF directly from the signed URL (no auth needed)
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Download failed:', response.status, errorText);
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
        } else {
          // If no content-length, show indeterminate progress
          setDownloadProgress({ pdfId, progress: Math.min(received / 1000000 * 100, 95), isDownloading: true });
        }
      }

      // Combine chunks into blob
      const blob = new Blob(chunks as BlobPart[], { type: 'application/pdf' });
      
      console.log('Download complete, blob size:', blob.size);
      
      // Validate downloaded blob
      const isValid = await isValidPdfBlob(blob);
      if (!isValid) {
        console.error('Downloaded blob is not a valid PDF');
        
        // If proxy failed validation, try direct URL
        if (useProxy) {
          console.log('Proxy returned invalid PDF, trying direct URL fallback...');
          setDownloadProgress(null);
          return getPdfUrl(pdfId, pdfFileUrl, false);
        }
        
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
      
      // If proxy failed, try direct URL as fallback
      if (useProxy) {
        console.log('Proxy error, trying direct URL fallback...');
        setDownloadProgress(null);
        return getPdfUrl(pdfId, pdfFileUrl, false);
      }
      
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
    runDiagnostics,
    diagnostics,
  };
}
