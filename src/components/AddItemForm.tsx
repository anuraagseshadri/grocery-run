import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { STORE_OPTIONS, CATEGORIES, getItemIcon } from '../constants';
import { Icon } from '@iconify/react';

export default function AddItemForm() {
  const [name, setName] = useState('');
  const [store, setStore] = useState(STORE_OPTIONS[0].name);
  const [category, setCategory] = useState(CATEGORIES[0].name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await addDoc(collection(db, 'items'), {
        name: name.trim(),
        store,
        category,
        icon: getItemIcon(name),
        completed: false,
        createdAt: serverTimestamp(),
      });
      setName('');
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add new item (e.g. Milk)"
          className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />
        
        <div className="grid grid-cols-2 gap-2">
          <select 
            value={store} 
            onChange={(e) => setStore(e.target.value)}
            className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-sm"
          >
            {STORE_OPTIONS.map(s => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>

          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-sm"
          >
            {CATEGORIES.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <button 
          type="submit"
          className="w-full bg-primary text-white p-3 rounded-lg font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <Icon icon="mdi:plus" className="w-5 h-5" />
          Add to List
        </button>
      </div>
    </form>
  );
}