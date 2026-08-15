import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { getItemIcon } from '../constants';

interface AddFormProps {
  onAddItem: (name: string) => void;
}

const QUICK_ITEMS = ['Milk', 'Eggs', 'Bread', 'Bananas'];

export function AddForm({ onAddItem }: AddFormProps) {
  const [input, setInput] = useState('');
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onAddItem(input);
      setInput('');
    }
  };

  const handleQuickAdd = (item: string) => {
    onAddItem(item);
    setJustAdded(item);
    setTimeout(() => setJustAdded(null), 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-2">
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add an item..."
          className="w-full p-4 pr-12 rounded-2xl border border-primary/10 bg-white focus:border-primary focus:ring-0 outline-none transition-all shadow-[0_2px_10px_-4px_rgba(23,106,33,0.05)] text-slate-800 font-medium"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:bg-slate-200 transition-all shadow-md active:scale-95"
        >
          <span className="material-symbols-outlined font-bold">add</span>
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {QUICK_ITEMS.map(item => {
          const isAdded = justAdded === item;
          return (
            <button
              key={`quick-${item}`}
              type="button"
              onClick={() => handleQuickAdd(item)}
              className="whitespace-nowrap flex items-center gap-1.5 px-4 py-2 bg-transparent rounded-full border border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-sm font-bold text-slate-700"
            >
              <Icon icon={getItemIcon(item)} className="text-lg" />
              {item}
              <span 
                className={`material-symbols-outlined text-[14px] ml-0.5 transition-colors duration-200 ${
                  isAdded ? 'text-green-600' : 'text-slate-400'
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