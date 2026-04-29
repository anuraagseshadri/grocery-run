import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface AddItemFormProps {
  onAddItem: (name: string, category?: string, store?: string) => void;
  categories: string[];
  stores: string[];
}

export function AddItemForm({ onAddItem, categories, stores }: AddItemFormProps) {
  const [name, setName] = useState('');
  // Default to the first store in the preset array (e.g., 'Costco')
  const [selectedStore, setSelectedStore] = useState(stores[0] || 'Unassigned');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    // Pass the name, leave category undefined (auto-categorize), and pass the selected store
    onAddItem(name, undefined, selectedStore);
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add item..."
        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
      />
      <select
        value={selectedStore}
        onChange={(e) => setSelectedStore(e.target.value)}
        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
      >
        {stores.map(store => (
          <option key={store} value={store}>{store}</option>
        ))}
      </select>
      <button 
        type="submit" 
        disabled={!name.trim()}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl shadow-sm transition-colors flex items-center justify-center"
      >
        <Plus className="w-5 h-5" />
      </button>
    </form>
  );
}