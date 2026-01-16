import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { TabId } from '@/types';

interface TabNavigationContextType {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  navigateToTab: (tab: TabId) => void;
}

const TabNavigationContext = createContext<TabNavigationContextType | undefined>(undefined);

export function TabNavigationProvider({ 
  children,
  activeTab,
  onTabChange,
}: { 
  children: ReactNode;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  const navigateToTab = useCallback((tab: TabId) => {
    onTabChange(tab);
  }, [onTabChange]);

  return (
    <TabNavigationContext.Provider
      value={{
        activeTab,
        setActiveTab: onTabChange,
        navigateToTab,
      }}
    >
      {children}
    </TabNavigationContext.Provider>
  );
}

export function useTabNavigation() {
  const context = useContext(TabNavigationContext);
  if (context === undefined) {
    throw new Error('useTabNavigation must be used within a TabNavigationProvider');
  }
  return context;
}
