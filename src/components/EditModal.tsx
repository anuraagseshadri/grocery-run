import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { CATEGORY_OPTIONS, STORE_OPTIONS, getCategoryBgColor, getItemIcon } from '../constants';

interface EditModalProps {
  item: { id: string; name: string; store: string; category: string; icon: string };
  onClose: () => void;
  onSave: (id: string, updates: any) => Promise<void> | void;
  onForget: (name: string) => Promise<void> | void;
}

export function EditModal({ item, onClose, onSave, onForget }: EditModalProps) {
  const [name, setName] = useState(item.name);
  const [store, setStore] = useState(item.store);
  const [category, setCategory] = useState(item.category);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Edit Item</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Item Name</label>
            <input 
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 mb-2 block">Store</label>
            <div className="grid grid-cols-2 gap-2">
              {STORE_OPTIONS.map((s) => (
                <button
                  key={s.name}
                  onClick={() => setStore(s.name)}
                  className={`p-3 rounded-xl border transition-all text-xs font-bold ${
                    store === s.name ? s.color : 'bg-gray-50 text-gray-400 border-gray-200'
                  }`}
                >
                  {s.logo}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-gray-500 block">Category</label>
              <button 
                onClick={() => onForget(item.name)}
                className="text-[10px] font-bold text-blue-600 hover:underline"
              >
                Reset to Default
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setCategory(cat.name)}
                  className={`flex flex-col items-center p-2 rounded-xl border text-[10px] font-bold transition-all ${
                    category === cat.name ? getCategoryBgColor(cat.name) : 'bg-gray-50 text-gray-400 border-gray-200'
                  }`}
                >
                  <Icon icon={cat.icon} className="text-lg mb-1" />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => onSave(item.id, { name, store, category })}
            className="mt-4 w-full bg-green-800 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-green-900"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}