import React from 'react';
import { Logo } from './Logo';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userEmail?: string | null;
}

export function Layout({ children, activeTab, setActiveTab, userEmail }: LayoutProps) {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="min-h-screen bg-[#E4F6E8] text-slate-900 relative">
      
      {/* HEADER: Solid white with downward shadow */}
      <header className="sticky top-0 z-40 bg-white px-4 pt-6 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" /> 
            <h1 className="text-xl font-headline font-bold text-primary tracking-tight">
              Grocery Run
            </h1>
          </div>
          {userEmail && (
            <button 
              onClick={handleSignOut}
              className="text-xs font-medium text-slate-500 hover:text-red-600 transition-colors flex items-center gap-2"
              aria-label="Sign out"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span className="hidden sm:inline">{userEmail.split('@')[0]}</span>
            </button>
          )}
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto min-h-screen">
        {children}
      </main>

      {/* FOOTER NAV */}
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

// Sub-component for the buttons
function NavButton({ icon, label, isActive, onClick }: { icon: string, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      aria-pressed={isActive} 
      className={`flex flex-col items-center p-2 min-w-[64px] transition-colors ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}
    >
      <span 
        className="material-symbols-outlined" 
        aria-hidden="true" 
        style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
      >
        {icon}
      </span>
      <span className="text-xs font-label mt-1">{label}</span>
    </button>
  );
}