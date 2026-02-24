import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import trumpetstarLogo from '@/assets/trumpetstar-logo.png';

interface SEOPageLayoutProps {
  children: ReactNode;
}

export function SEOPageLayout({ children }: SEOPageLayoutProps) {
  return (
    <div className="min-h-screen">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={trumpetstarLogo} alt="Trumpetstar" className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" asChild>
              <Link to="/trompete-lernen">Lernen</Link>
            </Button>
            <Button size="sm" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" asChild>
              <Link to="/pricing">Preise</Link>
            </Button>
            <Button size="sm" className="bg-white/15 hover:bg-white/25 text-white border border-white/20" asChild>
              <Link to="/login">Anmelden</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <img src={trumpetstarLogo} alt="Trumpetstar" className="h-6 w-auto mb-3" />
              <p className="text-sm text-white/60">
                Trompete lernen mit der Star-Methode – Buch, Videos und App für alle Altersgruppen.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Lernen</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><Link to="/trompete-lernen" className="hover:text-white transition-colors">Trompete lernen</Link></li>
                <li><Link to="/trompete-lernen-kinder" className="hover:text-white transition-colors">Für Kinder</Link></li>
                <li><Link to="/trompete-lernen-erwachsene" className="hover:text-white transition-colors">Für Erwachsene</Link></li>
                <li><Link to="/trompete-ansatz-atmung" className="hover:text-white transition-colors">Ansatz & Atmung</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Hilfe</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><Link to="/trompete-erster-ton" className="hover:text-white transition-colors">Erster Ton</Link></li>
                <li><Link to="/hilfe-kein-ton" className="hover:text-white transition-colors">Kein Ton? Hilfe!</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Preise</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-xs text-white/40">
            © {new Date().getFullYear()} Trumpetstar. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>
    </div>
  );
}
