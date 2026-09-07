import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export function Toast({ message, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 6000); // Automatically dismisses after 6 seconds
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  // Determine toast style based on message content
  const isSuccess = message.toLowerCase().includes('moved') || 
                    message.toLowerCase().includes('added') ||
                    message.toLowerCase().includes('complete');
  
  const isError = message.toLowerCase().includes('failed') || 
                  message.toLowerCase().includes('error');

  const bgColor = isSuccess 
    ? 'bg-emerald-500' 
    : isError 
      ? 'bg-red-500' 
      : 'bg-slate-800';

  return (
    // Positioned safely above your bottom navigation bar
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-none">
      <div className={`${bgColor} text-white px-6 py-3 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.3)] flex items-center gap-3 whitespace-nowrap`}>
        <span className="material-symbols-outlined text-sm">{isSuccess ? 'check_circle' : isError ? 'error' : 'info'}</span>
        <span className="font-label text-sm font-medium tracking-wide">{message}</span>
      </div>
    </div>
  );
}