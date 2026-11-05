import React, { useState, useRef } from 'react';

interface SwipeableTipCardProps {
  storageKey?: string;
}

export function SwipeableTipCard({ 
  storageKey = 'grocery_run_dismissed_edit_tip' 
}: SwipeableTipCardProps) {
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem(storageKey) === 'true';
  });

  const [dragOffset, setDragOffset] = useState(0);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const touchStartX = useRef<number | null>(null);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    localStorage.setItem(storageKey, 'true');
    setTimeout(() => {
      setIsDismissed(true);
    }, 200);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    // Allow dragging left or right
    setDragOffset(diff);
  };

  const onTouchEnd = () => {
    if (Math.abs(dragOffset) > 75) {
      // Swiped past threshold -> trigger fling dismissal
      handleDismiss();
    } else {
      // Released early -> snap back to center
      setDragOffset(0);
    }
    touchStartX.current = null;
  };

  // Calculate dynamic opacity as user drags (fades out as it moves)
  const dragOpacity = Math.max(0.2, 1 - Math.abs(dragOffset) / 250);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        transform: isAnimatingOut 
          ? `translateX(${dragOffset > 0 ? 300 : -300}px)` 
          : `translateX(${dragOffset}px)`,
        opacity: isAnimatingOut ? 0 : dragOpacity,
        transition: touchStartX.current === null ? 'transform 0.2s ease-out, opacity 0.2s ease-out' : 'none',
      }}
      className="relative my-3 p-3.5 bg-emerald-50/90 border border-emerald-200/60 rounded-2xl shadow-xs flex items-center justify-between gap-3 touch-pan-y select-none"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
          <span className="material-symbols-outlined text-[18px]">
            touch_app
          </span>
        </div>
        <p className="text-xs text-slate-700 leading-snug">
          <span className="font-semibold text-emerald-900">Pro tip:</span> Tap any item on your list to change its store, category, or tracking preference.
        </p>
      </div>

      {/* Manual Dismiss Button for Desktop / Tapping */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss tip"
        className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-emerald-100/50 transition-colors shrink-0"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
}