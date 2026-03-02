import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// Copy the correct PDF.js worker to public/ so versions always match
function copyPdfWorker() {
  return {
    name: 'copy-pdf-worker',
    buildStart() {
      const workerSrc = path.resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
      const workerDest = path.resolve(__dirname, 'public/pdf.worker.min.mjs');
      if (fs.existsSync(workerSrc)) {
        fs.copyFileSync(workerSrc, workerDest);
        console.log('✓ PDF.js worker copied to public/');
      }
    },
    configureServer(server: any) {
      const workerSrc = path.resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
      const workerDest = path.resolve(__dirname, 'public/pdf.worker.min.mjs');
      if (fs.existsSync(workerSrc)) {
        fs.copyFileSync(workerSrc, workerDest);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), copyPdfWorker(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2022",
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2022",
    },
  },
}));
