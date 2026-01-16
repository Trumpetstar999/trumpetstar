import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Bug
} from 'lucide-react';
import { PdfDiagnostics } from '@/hooks/usePdfCache';
import { cn } from '@/lib/utils';

interface PdfDebugPanelProps {
  diagnostics: PdfDiagnostics | null;
  onRunDiagnostics: () => void;
  onRetry: () => void;
  isLoading: boolean;
}

export function PdfDebugPanel({ diagnostics, onRunDiagnostics, onRetry, isLoading }: PdfDebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (value: boolean | null | string | number) => {
    if (value === null) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    if (value === true || (typeof value === 'number' && value >= 200 && value < 300)) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusColor = (value: boolean | null | string | number) => {
    if (value === null) return 'bg-yellow-500/20 text-yellow-300';
    if (value === true || (typeof value === 'number' && value >= 200 && value < 300)) {
      return 'bg-green-500/20 text-green-300';
    }
    return 'bg-red-500/20 text-red-300';
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[200] glass rounded-xl overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-reward-gold" />
          <span className="text-white font-medium text-sm">PDF Debug</span>
          {diagnostics && (
            <Badge 
              variant="outline" 
              className={cn("text-xs", diagnostics.error ? 'border-red-500 text-red-400' : 'border-green-500 text-green-400')}
            >
              {diagnostics.error ? 'Error' : 'OK'}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-white/60" />
        ) : (
          <ChevronUp className="w-4 h-4 text-white/60" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-3">
          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onRunDiagnostics}
              disabled={isLoading}
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Bug className="w-4 h-4 mr-2" />
              )}
              Diagnose
            </Button>
            <Button 
              size="sm" 
              onClick={onRetry}
              disabled={isLoading}
              className="flex-1 bg-reward-gold text-black hover:bg-reward-gold/90"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>

          {/* Diagnostics Results */}
          {diagnostics && (
            <div className="space-y-2 text-sm">
              {/* PDF URL */}
              <div className="flex items-start gap-2">
                <span className="text-white/60 w-20 shrink-0">PDF URL:</span>
                <span className="text-white/80 break-all text-xs font-mono">
                  {diagnostics.pdfFileUrl}
                </span>
              </div>

              {/* HTTP Status */}
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnostics.httpStatus)}
                <span className="text-white/60 w-20 shrink-0">HTTP:</span>
                <Badge className={cn("text-xs", getStatusColor(diagnostics.httpStatus))}>
                  {diagnostics.httpStatus || 'N/A'}
                </Badge>
              </div>

              {/* Content-Type */}
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnostics.contentType === 'application/pdf')}
                <span className="text-white/60 w-20 shrink-0">Type:</span>
                <span className="text-white/80 text-xs font-mono">
                  {diagnostics.contentType || 'N/A'}
                </span>
              </div>

              {/* CORS */}
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnostics.corsHeader === '*' || diagnostics.corsHeader?.includes('trumpetstar'))}
                <span className="text-white/60 w-20 shrink-0">CORS:</span>
                <span className="text-white/80 text-xs font-mono">
                  {diagnostics.corsHeader || 'N/A'}
                </span>
              </div>

              {/* File Size */}
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnostics.fileSize && diagnostics.fileSize > 1000)}
                <span className="text-white/60 w-20 shrink-0">Size:</span>
                <span className="text-white/80 text-xs">
                  {diagnostics.fileSize ? `${(diagnostics.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                </span>
              </div>

              {/* PDF Header */}
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnostics.pdfHeader?.startsWith('%PDF-'))}
                <span className="text-white/60 w-20 shrink-0">Header:</span>
                <span className="text-white/80 text-xs font-mono">
                  {diagnostics.pdfHeader || 'N/A'}
                </span>
              </div>

              {/* Worker */}
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnostics.workerReachable)}
                <span className="text-white/60 w-20 shrink-0">Worker:</span>
                <Badge className={cn("text-xs", getStatusColor(diagnostics.workerReachable))}>
                  {diagnostics.workerReachable === null ? 'N/A' : diagnostics.workerReachable ? 'Reachable' : 'Not Reachable'}
                </Badge>
              </div>

              {/* Error */}
              {diagnostics.error && (
                <div className="mt-2 p-2 rounded bg-red-500/20 border border-red-500/40">
                  <span className="text-red-300 text-xs break-all">
                    {diagnostics.error}
                  </span>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-white/40 text-xs pt-2 border-t border-white/10">
                Last check: {new Date(diagnostics.timestamp).toLocaleTimeString()}
              </div>
            </div>
          )}

          {!diagnostics && (
            <p className="text-white/60 text-sm text-center py-4">
              Klicke auf "Diagnose" um PDF-Probleme zu analysieren
            </p>
          )}
        </div>
      )}
    </div>
  );
}
