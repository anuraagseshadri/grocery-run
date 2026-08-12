import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { Mail, Lock, Loader2, Sparkles, Chrome } from 'lucide-react';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
    }
    setLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Account created! Welcome to Grocery Run.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Welcome back!");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f2f9ea] p-6 relative overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#9df197]/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#70b5ff]/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

      <div className="z-10 flex flex-col items-center text-center space-y-6 max-w-sm w-full">
        {/* Brand Icon */}
        <div className="bg-[#ebf3e3] p-4 rounded-full shadow-sm mb-2">
          <span className="material-symbols-outlined text-5xl text-[#176a21]">eco</span>
        </div>

        <div className="space-y-2">
          <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-4xl text-[#176a21] tracking-tight">
            Grocery Run
          </h1>
          <p className="font-['Be_Vietnam_Pro'] text-[#575e52] text-lg">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-[#176a21] text-slate-700 font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
        >
          <Chrome className="w-5 h-5 text-red-500" />
          Continue with Google
        </button>

        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#f2f9ea] px-2 text-slate-500">Or use email</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleAuth} className="w-full space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
            <input 
              type="email" 
              placeholder="Email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-[#176a21] outline-none transition-all bg-white"
              required 
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-[#176a21] outline-none transition-all bg-white"
              required 
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-[#176a21] hover:bg-[#0f4d15] text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm font-medium text-[#575e52] hover:text-[#176a21] transition-colors"
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}