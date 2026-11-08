import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  Video, 
  Settings,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Package,
  Music,
  FileText,
  ToggleRight,
  CreditCard,
  Music2,
  Mail,
  Star,
  Target,
  GitBranch,
  Search,
  Inbox,
  BookOpen,
  Truck,
  Receipt,
  Headphones,
  QrCode,
  Bell
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { adminDashboardCopy, adminMenuCopy } from '@/i18n/admin-dashboard';
import trumpetstarLogo from '@/assets/trumpetstar-logo.png';

interface AdminSidebarProps {
  mobile?: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Nutzer', icon: Users },
  { id: 'leads', label: 'Leads & CRM', icon: Target },
  { id: 'marketing', label: 'E-Mail Automationen', icon: GitBranch },
  { id: 'seo', label: 'SEO Center', icon: Search },
  { id: 'mailbox', label: 'Postfach', icon: Inbox },
  { id: 'knowledge', label: 'Wissensdatenbank', icon: BookOpen },
  { id: 'shipping', label: 'Versand', icon: Truck },
  { id: 'invoices', label: 'Rechnungen', icon: Receipt },
  { id: 'levels', label: 'Levels', icon: Layers },
  { id: 'pdfs', label: 'PDFs / Noten', icon: FileText },
  { id: 'musicxml', label: 'MusicXML', icon: Music },
  { id: 'products', label: 'Produkte & Pläne', icon: Package },
  { id: 'digistore24', label: 'Digistore24', icon: CreditCard },
  { id: 'beats', label: 'Drum Beats', icon: Music2 },
  { id: 'audioplayer', label: 'Audio Player', icon: Headphones },
  { id: 'qrcodes', label: 'QR-Codes', icon: QrCode },
  { id: 'assistant', label: 'KI-Assistent', icon: MessageSquare },
  { id: 'classrooms', label: 'Klassenzimmer', icon: Video },
  { id: 'feedback', label: 'Feedback & Chats', icon: MessageSquare },
  { id: 'emails', label: 'E-Mail Templates', icon: Mail },
  { id: 'reviews', label: 'Google Reviews', icon: Star },
  { id: 'homecontent', label: 'Neuigkeiten & Shop', icon: Bell },
  { id: 'features', label: 'Feature Flags', icon: ToggleRight },
  { id: 'system', label: 'Einstellungen', icon: Settings },
];

export function AdminSidebar({ activeTab, onTabChange, mobile = false }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { language } = useLanguage();
  const t = adminDashboardCopy[language];
  const [unreadEmails, setUnreadEmails] = useState(0);
  const [pendingShipments, setPendingShipments] = useState(0);
  useEffect(() => {
    let live = true;
    async function fetchCounts() {
      const [email, shipping] = await Promise.all([
        supabase.from('mailbox_emails').select('id', { count: 'exact', head: true }).eq('is_read', false).eq('folder', 'inbox'),
        supabase.from('digistore24_shipments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      if (!live) return;
      if (!email.error) setUnreadEmails(email.count ?? 0);
      if (!shipping.error) setPendingShipments(shipping.count ?? 0);
    }
    fetchCounts();
    const interval = window.setInterval(fetchCounts, 60000);
    return () => { live = false; window.clearInterval(interval); };
  }, []);
  const compact = collapsed && !mobile;
  const badges: Record<string, number> = { mailbox: unreadEmails, shipping: pendingShipments };
  return <aside className={cn('admin-sidebar flex flex-col shrink-0', mobile ? 'h-full w-full' : 'h-dvh sticky top-0', compact ? 'w-[72px]' : 'w-64')}>
    <div className="flex items-center gap-3 h-16 px-5 shrink-0 admin-sidebar-brand"><img src={trumpetstarLogo} alt="Trumpetstar" className="w-8 h-8 object-contain"/>{!compact && <div><p className="font-semibold text-sm">Trumpetstar</p><p className="text-xs admin-sidebar-muted">Admin</p></div>}</div>
    <nav aria-label="Admin" className="flex-1 min-h-0 overflow-y-auto py-4 px-3 space-y-1">{menuItems.map((item,i) => { const Icon = item.icon; const label = adminMenuCopy[language][i]; return <Button variant="ghost" key={item.id} title={compact ? label : undefined} aria-current={activeTab === item.id ? 'page' : undefined} onClick={() => onTabChange(item.id)} className={cn('admin-nav-item w-full h-auto min-h-11 justify-start gap-3 text-left', activeTab === item.id && 'admin-nav-active',compact && 'justify-center px-2')}><Icon className="w-5 h-5 shrink-0"/>{!compact && <><span className="flex-1 min-w-0 truncate">{label}</span>{badges[item.id] > 0 && <span className="admin-nav-badge text-xs px-1.5 rounded-full">{badges[item.id]}</span>}</>}</Button>; })}</nav>
    {!mobile && <div className="p-3 admin-sidebar-brand"><Button variant="ghost" className="admin-nav-item w-full" title={compact ? t.expand : t.collapse} onClick={() => setCollapsed(v => !v)}>{compact ? <ChevronRight className="w-4 h-4"/> : <><ChevronLeft className="w-4 h-4 mr-2"/>{t.collapse}</>}</Button></div>}
  </aside>;
}
