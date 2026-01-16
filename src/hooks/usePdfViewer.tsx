import { createContext, useContext, useState, ReactNode } from 'react';

interface PdfViewerContextType {
  isPdfViewerOpen: boolean;
  setIsPdfViewerOpen: (value: boolean) => void;
}

const PdfViewerContext = createContext<PdfViewerContextType | null>(null);

export function PdfViewerProvider({ children }: { children: ReactNode }) {
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);

  return (
    <PdfViewerContext.Provider value={{ isPdfViewerOpen, setIsPdfViewerOpen }}>
      {children}
    </PdfViewerContext.Provider>
  );
}

export function usePdfViewer() {
  const context = useContext(PdfViewerContext);
  if (!context) {
    throw new Error('usePdfViewer must be used within a PdfViewerProvider');
  }
  return context;
}
