import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider } from 'firebase/auth';
import { toast } from 'sonner';
import { Mail, Lock, Loader2 } from 'lucide-react';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success("Welcome!");
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      if (error.code === 'auth/popup-blocked') {
        toast.error("Popup was blocked. Please allow popups for this site.");
      } else if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, do nothing
      } else {
        toast.error(error.message || "Failed to sign in with Google");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate passwords match on sign-up
    if (isSignUp && password !== confirmPassword) {
      toast.error("Passwords do not match. Please try again.");
      setLoading(false);
      return;
    }

    // Validate password length
    if (isSignUp && password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }
    
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Account created! Welcome aboard.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Welcome back!");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      
      // User-friendly error messages
      let errorMessage = "Authentication failed. Please try again.";
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = "Incorrect email or password. Please try again.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email. Please sign up.";
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Please sign in.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Use at least 6 characters.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E4F6E8] p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-headline font-bold text-primary tracking-tight">
            Grocery Run
          </h2>
          <p className="text-slate-500 mt-2">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3.5 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.766 12.2764c0-.9172-.079-1.7863-.2228-2.6149H12v4.9397h6.6076a5.623 5.623 0 0 1-2.4409 3.6908v3.048h3.9507c2.3045-2.1198 3.6486-5.2416 3.6486-9.0636z"/>
            <path fill="#34A853" d="M12 24c3.2996 0 6.0606-1.0916 8.0759-2.962l-3.9507-3.048c-1.0916.7324-2.4906 1.1669-4.1252 1.1669-3.1676 0-5.8528-2.137-6.8124-5.0096H1.0989v3.1488C3.0945 21.2368 7.2896 24 12 24z"/>
            <path fill="#FBBC05" d="M5.1872 14.1473a7.292 7.292 0 0 1 0-4.2946V6.7039H1.0989a11.997 11.997 0 0 0 0 10.5922l4.0883-3.1488z"/>
            <path fill="#EA4335" d="M12 4.8431c1.7863 0 3.3898.6152 4.6478 1.8117l3.488-3.488C17.9952 1.146 0 12 0 0 7.2896 0 3.0945 2.7633 1.0989 6.7039l4.0883 3.1488c.9596-2.8726 3.6448-5.0096 6.8124-5.0096z"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-slate-400">or</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              required 
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              required 
            />
          </div>
          
          {/* Confirm Password Field (Sign-up only) */}
          {isSignUp && (
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input 
                type="password" 
                placeholder="Confirm Password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                required 
              />
            </div>
          )}
          
          <button 
            disabled={loading}
            className="w-full py-3.5 bg-primary text-white rounded-xl font-bold shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full mt-6 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}