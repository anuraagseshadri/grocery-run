import React, { useState } from 'react';
import { Icon } from '@iconify/react';

interface AddItemFormProps {
  onAddItem: (newItemName: string) => Promise<void> | void;
}

export default function AddItemForm({ onAddItem }: AddItemFormProps) {
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Pass the name to App.tsx which handles duplicate checks, tagging, and Firebase writes
    await onAddItem(name);
    
    // Clear the input field after submission
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add new item (e.g. Milk)"
          className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-800"
        />
        
        <button 
          type="submit"
          disabled={!name.trim()}
          className="w-full bg-[#176a21] text-white p-3 rounded-lg font-bold hover:bg-[#12531a] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon="mdi:plus" className="w-5 h-5" />
          Add to List
        </button>
      </div>
    </form>
  );
}