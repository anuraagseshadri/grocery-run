// Inside src/components/AddForm.tsx
import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { getItemIcon } from '../constants';

interface AddFormProps {
  onAddItem: (name: string) => void;
}

const QUICK_ITEMS = ['Milk', 'Eggs', 'Bread', 'Bananas'];

export function AddForm({ onAddItem }: AddFormProps) {
  const [input, setInput] = useState('');
  // 1. Upgrade to a Set to support concurrent active button states
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onAddItem(input);
      setInput('');
    }
  };

  const handleQuickAdd = (item: string) => {
    onAddItem(item);
    
    // 2. Add item to the active Set
    setAddedItems(prev => new Set(prev).add(item));
    
    // 3. Remove only this specific item after timeout
    setTimeout(() => {
      setAddedItems(prev => {
        const next = new Set(prev);
        next.delete(item);
        return next;
      });
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-2">
      {/* ... text input remains unchanged ... */}
      
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {QUICK_ITEMS.map(item => {
          // 4. Check if this specific item is in the active Set
          const isAdded = addedItems.has(item);
          return (
            <button
              key={`quick-${item}`}
              type="button"
              onClick={() => handleQuickAdd(item)}
              disabled={isAdded} // Prevent duplicate rapid taps
              className={`whitespace-nowrap flex items-center gap-1.5 px-4 py-2 rounded-full border transition-all text-sm font-bold ${
                isAdded 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                  : 'bg-transparent border-primary/20 hover:border-primary/50 text-slate-700'
              }`}
            >
              <Icon icon={getItemIcon(item)} className="text-lg" />
              {item}
              <span className={`material-symbols-outlined text-[14px] ml-0.5 transition-colors duration-200 ${
                  isAdded ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {isAdded ? 'check' : 'add'}
              </span>
            </button>
          );
        })}
      </div>
    </form>
  );
}