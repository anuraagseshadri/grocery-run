import React, { useState } from 'react';
import { Logo } from './Logo';
import { auth } from '../firebase';
import { signOut, deleteUser } from 'firebase/auth';
import { toast } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userEmail?: string | null;
  cartCount?: number;
}

export function Layout({ children, activeTab, setActiveTab, userEmail, cartCount = 0 }: LayoutProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) return;
    
    const confirmed = window.confirm(
      "Are you sure you want to completely delete your account? This action cannot be undone and will permanently remove your access."
    );
    
    if (confirmed) {
      try {
        await deleteUser(auth.currentUser);
        toast.success("Account deleted successfully.");
      } catch (error: any) {
        if (error.code === 'auth/requires-recent-login') {
          toast.error("Security check: Please sign out and sign back in to verify your identity before deleting your account.");
        } else {
          toast.error("Failed to delete account. Please try again.");
        }
      }
    }
  };

  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : '?';

  return (
    <div className="min-h-screen bg-[#E4F6E8] text-slate-900 relative">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white px-4 pt-6 pb-4 border-b border-slate-100/50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" /> 
            <h1 className="text-xl font-headline font-bold text-primary tracking-tight">
              Grocery Run
            </h1>
          </div>
          {userEmail && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="User menu"
              >
                {userInitial}
              </button>
              
              {/* Menu dropdown */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 flex flex-col">
                    <p className="text-xs text-slate-500 mb-2 truncate px-2 pt-1">{userEmail}</p>
                    
                    <button 
                      type="button"
                      onClick={() => {
                        handleSignOut();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-2 py-2.5 rounded-lg transition-colors flex items-center gap-2.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Sign out
                    </button>

                    <div className="h-px w-full bg-slate-100 my-1"></div>
                    
                    <button 
                      type="button"
                      onClick={() => {
                        handleDeleteAccount();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-2.5 rounded-lg transition-colors flex items-center gap-2.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                      Delete account
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="px-4 pt-6 pb-32 max-w-2xl mx-auto min-h-screen">
        {children}
      </main>

      {/* FOOTER NAVIGATION */}
      <nav 
        aria-label="Main Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 h-[72px] bg-white border-t border-[#F1F5F9] shadow-[0_-4px_12px_rgba(0,0,0,0.03)] flex items-center justify-around px-4 pb-[max(8px,env(safe-area-inset-bottom))]"
      >
        <NavButton 
          icon="list" 
          label="List" 
          isActive={activeTab === 'list'} 
          onClick={() => setActiveTab('list')} 
        />
        <NavButton 
          icon="shopping_cart" 
          label="Cart" 
          badgeCount={cartCount}
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

// SPEC-COMPLIANT NAV BUTTON SUB-COMPONENT
function NavButton({ 
  icon, 
  label, 
  isActive, 
  badgeCount = 0, 
  onClick 
}: { 
  icon: string; 
  label: string; 
  isActive: boolean; 
  badgeCount?: number; 
  onClick: () => void; 
}) {
  return (
    <button 
      type="button"
      onClick={onClick} 
      aria-label={`${label} tab`}
      aria-current={isActive ? 'page' : undefined} 
      className={`relative flex flex-col items-center justify-center w-[72px] h-[54px] rounded-2xl transition-all duration-200 select-none ${
        isActive 
          ? 'bg-[#DCFCE7] text-[#15803D] border border-emerald-600/15' 
          : 'bg-transparent text-[#64748B] hover:text-slate-800 active:scale-95'
      }`}
    >
      <div className="relative flex items-center justify-center">
        <span 
          className="material-symbols-outlined text-[22px] leading-none" 
          aria-hidden="true" 
          style={{ 
            fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400" 
          }}
        >
          {icon}
        </span>
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-2.5 min-w-[17px] h-[17px] px-1 bg-[#15803D] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white shadow-xs">
            {badgeCount}
          </span>
        )}
      </div>
      <span 
        className={`text-[11px] leading-[14px] mt-[3px] ${
          isActive ? 'font-semibold text-[#15803D]' : 'font-medium text-[#64748B]'
        }`}
      >
        {label}
      </span>
    </button>
  );
}