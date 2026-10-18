import React, { useState, useRef, useEffect } from 'react';

interface AddItemFormProps {
  onAddItem: (name: string) => void;
  suggestions?: string[];
}

export default function AddItemForm({ onAddItem, suggestions = [] }: AddItemFormProps) {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter and limit to top 5 suggestions
  const filteredSuggestions = suggestions.filter(s => 
    s.toLowerCase().includes(inputValue.toLowerCase()) && 
    s.toLowerCase() !== inputValue.toLowerCase()
  ).slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAddItem(inputValue.trim());
      setInputValue('');
      setShowDropdown(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    onAddItem(suggestion);
    setInputValue('');
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full z-30" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        <div className="absolute left-4 text-slate-400 flex items-center justify-center">
          <span className="material-symbols-outlined">add_shopping_cart</span>
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Add new item (e.g. Milk)"
          className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-base font-medium shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
        />
        {inputValue.trim() && (
          <button 
            type="submit" 
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-xl">add</span>
          </button>
        )}
      </form>

      {/* Autocomplete Dropdown */}
      {showDropdown && inputValue.trim() && filteredSuggestions.length > 0 && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-fade-in divide-y divide-slate-100">
          {filteredSuggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-slate-300 text-[20px]">history</span>
              <span className="text-slate-700 font-headline font-semibold text-sm">{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}