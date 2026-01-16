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
  Package
} from 'lucide-react';
import { useState } from 'react';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Nutzer', icon: Users },
  { id: 'levels', label: 'Levels', icon: Layers },
  { id: 'products', label: 'Produkte & Pläne', icon: Package },
  { id: 'classrooms', label: 'Klassenzimmer', icon: Video },
  { id: 'feedback', label: 'Feedback & Chats', icon: MessageSquare },
  { id: 'system', label: 'Einstellungen', icon: Settings },
];

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "h-screen sticky top-0 flex flex-col transition-all duration-200",
        "bg-white border-r border-[#E5E7EB]",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Header */}
      <div className="h-14 px-4 border-b border-[#E5E7EB] flex items-center justify-between">
        {!collapsed && (
          <span className="font-semibold text-sm text-[#111827] tracking-tight">
            Admin
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#F5F7FA] hover:text-[#111827] transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all relative",
                isActive 
                  ? "bg-[#EFF6FF] text-[#3B82F6]" 
                  : "text-[#6B7280] hover:bg-[#F5F7FA] hover:text-[#111827]"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#3B82F6] rounded-r" />
              )}
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span>{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#E5E7EB]">
        {!collapsed && (
          <p className="text-[10px] text-[#9CA3AF] text-center">
            Trumpetstar Admin
          </p>
        )}
      </div>
    </aside>
  );
}
