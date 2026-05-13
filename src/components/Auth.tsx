import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'sonner';

export function Auth() {
  const [loading, setLoading] = useState(false);

  // Auto-check if a silent session already exists
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
         // App is ready for guest login
      }
    };
    checkSession();
  }, []);

  const handleGuestLogin = async () => {
    setLoading(true);
    
    // Supabase Anonymous Auth - Generates a silent UUID tied to the device
    const { error } = await supabase.auth.signInAnonymously();
    
    if (error) {
      toast.error("Failed to initialize your local workspace.");
      setLoading(false);
    }
    // Note: If successful, your existing onAuthStateChange listener in App.tsx 
    // will automatically detect the new silent user and load the main app.
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f2f9ea] p-6 relative overflow-hidden antialiased">
      {/* Decorative Organic Blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#9df197]/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#70b5ff]/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

      <div className="z-10 flex flex-col items-center text-center space-y-6 max-w-sm w-full">
        {/* Brand Icon */}
        <div className="bg-[#ebf3e3] p-4 rounded-full shadow-sm mb-2">
          <span className="material-symbols-outlined text-5xl text-[#176a21]">eco</span>
        </div>

        {/* Typography from the new Design System */}
        <div className="space-y-2">
          <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-4xl text-[#176a21] tracking-tight">
            Grocery Run
          </h1>
          <p className="font-['Be_Vietnam_Pro'] text-[#575e52] text-lg">
            Tap, Shop, Done.
          </p>
        </div>

        {/* Frictionless Action Button */}
        <button
          onClick={handleGuestLogin}
          disabled={loading}
          className="mt-8 w-full bg-gradient-to-r from-[#176a21] to-[#025d16] text-white font-['Plus_Jakarta_Sans'] font-bold text-lg py-4 rounded-xl shadow-[0_24px_48px_-12px_rgba(42,49,39,0.15)] hover:scale-95 active:scale-95 transition-transform duration-200 flex justify-center items-center gap-2"
        >
          {loading ? (
            <span className="font-['Be_Vietnam_Pro']">Preparing Workspace...</span>
          ) : (
            <>
              Start Shopping
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}