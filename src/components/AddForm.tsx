import React, { useState } from 'react';

// We define the "cable" that will connect this form to the main app
interface AddFormProps {
  onAddItem: (name: string, category: string) => void;
}

export function AddForm({ onAddItem }: AddFormProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!inputValue.trim()) return;
    
    // Send the typed item out to the main app!
    onAddItem(inputValue.trim(), 'Freshly Added');
    setInputValue(''); 
  };

  const handleChipClick = (suggestion: string) => {
    // Send the clicked chip out to the main app!
    onAddItem(suggestion, 'Quick Add');
  };

  const suggestions = ['Eggs', 'Milk', 'Sourdough Bread', 'Paper Towels', 'Avocados'];

  return (
    <div className="w-full flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="relative w-full">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Add an item..."
          className="w-full bg-surface-container-highest text-on-surface placeholder:text-on-surface-variant font-body px-6 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-primary shadow-inner transition-all"
        />
        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 flex items-center justify-center">
           <span className="material-symbols-outlined text-xl">keyboard_return</span>
        </div>
      </form>

      <div className="flex overflow-x-auto pb-2 gap-2 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {suggestions.map((item) => (
          <button
            key={item}
            onClick={() => handleChipClick(item)}
            className="whitespace-nowrap px-4 py-2 bg-surface-container-low text-primary-dim font-label text-sm rounded-full border border-outline-variant/30 hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm"
          >
            + {item}
          </button>
        ))}
      </div>
    </div>
  );
}