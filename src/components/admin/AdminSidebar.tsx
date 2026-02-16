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
  Mail
} from 'lucide-react';
import { useState } from 'react';
import trumpetstarLogo from '@/assets/trumpetstar-logo.png';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Nutzer', icon: Users },
  { id: 'levels', label: 'Levels', icon: Layers },
  { id: 'pdfs', label: 'PDFs / Noten', icon: FileText },
  { id: 'musicxml', label: 'MusicXML', icon: Music },
  { id: 'products', label: 'Produkte & Pläne', icon: Package },
  { id: 'digistore24', label: 'Digistore24', icon: CreditCard },
  { id: 'beats', label: 'Drum Beats', icon: Music2 },
  { id: 'assistant', label: 'KI-Assistent', icon: MessageSquare },
  { id: 'classrooms', label: 'Klassenzimmer', icon: Video },
  { id: 'feedback', label: 'Feedback & Chats', icon: MessageSquare },
  { id: 'emails', label: 'E-Mail Templates', icon: Mail },
  { id: 'features', label: 'Feature Flags', icon: ToggleRight },
  { id: 'system', label: 'Einstellungen', icon: Settings },
];

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "h-screen sticky top-0 flex flex-col transition-all duration-300 ease-out",
        collapsed ? "w-[72px]" : "w-64"
      )}
      style={{
        background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
      }}
    >
      {/* Logo & Brand */}
      <div className={cn(
        "flex items-center gap-3 border-b border-white/[0.08] transition-all duration-300",
        collapsed ? "h-16 px-4 justify-center" : "h-16 px-5"
      )}>
        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
          <img 
            src={trumpetstarLogo} 
            alt="Trumpetstar" 
            className="w-7 h-7 object-contain"
          />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-white font-semibold text-sm tracking-tight">
              Trumpetstar
            </span>
            <span className="text-white/40 text-[10px] font-medium uppercase tracking-wider">
              Admin
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 relative group",
                collapsed ? "px-3 py-3 justify-center" : "px-3 py-2.5",
                isActive 
                  ? "bg-blue-500/15 text-white" 
                  : "text-white/60 hover:bg-white/[0.06] hover:text-white/90"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full" />
              )}
              
              <Icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-colors",
                isActive ? "text-blue-400" : "text-white/50 group-hover:text-white/70"
              )} />
              
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-white/[0.08]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-all",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-medium">Einklappen</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
