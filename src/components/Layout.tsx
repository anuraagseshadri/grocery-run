import React from 'react';
import { Logo } from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#E4F6E8] text-slate-900 relative">
      
      {/* HEADER: Solid white with downward shadow */}
      <header className="sticky top-0 z-40 bg-white px-4 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8" /> 
          <h1 className="text-xl font-headline font-bold text-primary tracking-tight">
            Grocery Run
          </h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto min-h-screen">
        {children}
      </main>

      {/* FOOTER NAV: Removed blur, forced solid bg-white, added upward shadow */}
    <nav className="fixed bottom-0 w-full bg-white pb-safe pt-2 px-6 flex justify-around items-center z-50">
        <NavButton 
          icon="list" 
          label="List" 
          isActive={activeTab === 'list'} 
          onClick={() => setActiveTab('list')} 
        />
        <NavButton 
          icon="shopping_cart" 
          label="Cart" 
          isActive={activeTab === 'cart'} 
          onClick={() => setActiveTab('cart')} 
        />
        <NavButton 
          icon="monitoring" 
          label="Habits" 
          isActive={activeTab === 'habits'} 
          onClick={() => setActiveTab('habits')} 
        />
      </nav>
    </div>
  );
}

// Sub-component for the buttons with the Accessibility Patch
function NavButton({ icon, label, isActive, onClick }: { icon: string, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      // 1. Informs screen readers which tab is currently selected
      aria-pressed={isActive} 
      className={`flex flex-col items-center p-2 min-w-[64px] transition-colors ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}
    >
      <span 
        className="material-symbols-outlined" 
        // 2. Tells the screen reader to skip reading the "icon name" (e.g., "list")
        aria-hidden="true" 
        style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
      >
        {icon}
      </span>
      {/* The screen reader only reads this label */}
      <span className="text-xs font-label mt-1">{label}</span>
    </button>
  );
}