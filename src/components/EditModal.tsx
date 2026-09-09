import React, { useState } from 'react';
import { GroceryItem } from '../app/types';
import { STORE_OPTIONS, CATEGORIES } from '../constants';
import { Icon } from '@iconify/react';

interface EditModalProps {
  item: GroceryItem;
  onClose: () => void;
  onSave: (id: string, updates: Partial<GroceryItem>) => void;
  onForget: (name: string) => void;
}

const getCategoryIcon = (categoryName: string) => {
  const iconMap: Record<string, string> = {
    'Produce': 'fluent-emoji-flat:leafy-green',
    'Bakery': 'fluent-emoji-flat:croissant',
    'Meat & Seafood': 'fluent-emoji-flat:cut-of-meat', 
    'Dairy & Eggs': 'fluent-emoji-flat:egg', 
    'Rice & Wheat': 'fluent-emoji-flat:sheaf-of-rice', 
    'Pasta & Noodles': 'fluent-emoji-flat:spaghetti',  
    'Breakfast & Cereal': 'fluent-emoji-flat:bowl-with-spoon',
    'Cooking Essentials': 'fluent-emoji-flat:salt',
    'Dessert & Snacks': 'fluent-emoji-flat:cookie',
    'Beverages': 'fluent-emoji-flat:tropical-drink', 
    'Drinks & Beverages': 'fluent-emoji-flat:tropical-drink',
    'Frozen': 'fluent-emoji-flat:snowflake',
    'Household & Cleaning': 'fluent-emoji-flat:roll-of-paper', 
    'Pharmacy & Personal Care': 'fluent-emoji-flat:soap', 
    'Baby': 'fluent-emoji-flat:baby-bottle',
    'General': 'fluent-emoji-flat:shopping-bags'
  };
  
  return iconMap[categoryName] || 'fluent-emoji-flat:shopping-bags';
};

const getStoreBrand = (storeName: string) => {
  const brands: Record<string, { icon: string, activeClass: string }> = {
    'Walmart': { icon: 'fluent-emoji-flat:shopping-cart', activeClass: 'border-blue-500 bg-blue-50 text-blue-700' },
    'Costco': { icon: 'fluent-emoji-flat:department-store', activeClass: 'border-red-500 bg-red-50 text-red-700' },
    'No Frills': { icon: 'fluent-emoji-flat:banana', activeClass: 'border-yellow-400 bg-yellow-50 text-yellow-800' },
    'Loblaws': { icon: 'fluent-emoji-flat:shopping-bags', activeClass: 'border-orange-500 bg-orange-50 text-orange-700' },
    'Metro': { icon: 'fluent-emoji-flat:red-apple', activeClass: 'border-rose-500 bg-rose-50 text-rose-700' },
    'Sobeys': { icon: 'fluent-emoji-flat:leafy-green', activeClass: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
    'FreshCo': { icon: 'fluent-emoji-flat:green-apple', activeClass: 'border-green-500 bg-green-50 text-green-700' },
    'Shoppers Drug Mart': { icon: 'fluent-emoji-flat:pill', activeClass: 'border-red-500 bg-red-50 text-red-700' },
    'Asian Grocery': { icon: 'emojione:flag-for-china', activeClass: 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700' },
    'Indian Grocery': { icon: 'emojione:flag-for-india', activeClass: 'border-teal-500 bg-teal-50 text-teal-700' }
  };
  
  return brands[storeName] || { 
    icon: 'fluent-emoji-flat:convenience-store', 
    activeClass: 'border-[#b8d0c0] bg-[#d3e3d8] text-[#174525]' 
  };
};

export const EditModal: React.FC<EditModalProps> = ({ item, onClose, onSave, onForget }) => {
  const [name, setName] = useState(item.name);
  
  const initialCategory = item.category === 'Beverages' ? 'Drinks & Beverages' : (item.category || CATEGORIES[0].name);
  const [category, setCategory] = useState(initialCategory);
  const [store, setStore] = useState(item.store || STORE_OPTIONS[0].name);
  const [trackHabit, setTrackHabit] = useState<boolean>(item.trackHabit !== false);

  const handleSave = () => {
    onSave(item.id, { name: name.trim(), category, store, trackHabit });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose} 
    >
      <div 
        className="bg-white text-slate-900 rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[75vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()} 
      >
        
        <div className="flex justify-between items-center p-6 pb-4 shrink-0">
          <h2 className="text-2xl font-bold text-slate-800">Edit Item</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-6 px-6 py-2 overflow-y-auto">
          <div className="flex flex-col gap-2 shrink-0">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Item Name</label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="p-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:ring-0 focus:border-[#b8d0c0] outline-none text-slate-800 font-medium transition-all"
            />
          </div>

          {/* TRACKING STATUS SELECTOR */}
          <div className="flex flex-col gap-2 shrink-0 mt-1">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tracking Status</span>
              <span className="text-xs text-slate-400 mt-0.5">Choose how Grocery Run calculates restock predictions in Habits.</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button 
                type="button"
                onClick={() => setTrackHabit(true)}
                className={`relative flex flex-col text-left p-3.5 rounded-2xl shadow-sm transition active:scale-[0.98] ${
                  trackHabit !== false ? 'bg-[#e3efe6] border-2 border-[#8db597] text-slate-900' : 'bg-slate-50/80 border border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-sm font-bold flex items-center gap-1.5 ${trackHabit !== false ? 'text-[#1b3d2b]' : 'text-slate-700'}`}>
                    <span className="text-base"></span> Track Item
                  </span>
                  {trackHabit !== false && (
                    <span className="w-4 h-4 rounded-full bg-[#27523a] text-white flex items-center justify-center text-[10px]"></span>
                  )}
                </div>
                <p className={`text-[11px] leading-tight font-medium ${trackHabit !== false ? 'text-[#2b5940]' : 'text-slate-400'}`}>
                  Smart restock reminders & auto replenishment
                </p>
              </button>

              <button 
                type="button"
                onClick={() => setTrackHabit(false)}
                className={`relative flex flex-col text-left p-3.5 rounded-2xl shadow-sm transition active:scale-[0.98] ${
                  trackHabit === false ? 'bg-[#fff4cc] border-2 border-[#eab308] text-slate-900' : 'bg-slate-50/80 border border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-sm font-bold flex items-center gap-1.5 ${trackHabit === false ? 'text-[#713f12]' : 'text-slate-700'}`}>
                    <span className="text-base"></span> One-time
                  </span>
                  {trackHabit === false && (
                    <span className="w-4 h-4 rounded-full bg-[#eab308] text-white flex items-center justify-center text-[10px]"></span>
                  )}
                </div>
                <p className={`text-[11px] leading-tight font-medium ${trackHabit === false ? 'text-[#713f12]' : 'text-slate-400'}`}>
                  Single purchase, won't clutter routine list
                </p>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0 mt-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Store</label>
            <div className="flex flex-wrap gap-2">
              {STORE_OPTIONS.map((s) => {
                const brand = getStoreBrand(s.name);
                const isActive = store === s.name;
                
                return (
                  <button
                    key={`store-${s.name}`}
                    onClick={() => setStore(s.name)}
                    className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all flex items-center gap-2 ${
                      isActive 
                        ? brand.activeClass
                        : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <Icon icon={brand.icon} className="text-lg drop-shadow-sm" />
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => {
                return (
                  <button
                    key={`cat-${c.name}`}
                    onClick={() => setCategory(c.name)}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                      category === c.name 
                        ? 'border-[#b8d0c0] bg-[#d3e3d8] text-[#174525] shadow-sm' 
                        : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <Icon 
                      icon={getCategoryIcon(c.name)} 
                      className="text-3xl drop-shadow-sm" 
                    />
                    <span className="text-[11px] font-bold tracking-wide text-center leading-tight">
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-6 pt-5 mt-2 border-t border-slate-100 gap-6 shrink-0 bg-white">
          
          <button 
            onClick={() => onForget(item.name)} 
            className="text-red-400 text-xs font-bold hover:bg-red-50 hover:text-red-600 px-2 py-2 rounded-xl transition-colors shrink-0"
            title="Forget my saved category for this item"
          >
            Reset Tag
          </button>
          
          <div className="flex gap-2 flex-1">
            <button 
              onClick={onClose} 
              className="flex-1 py-2.5 bg-transparent text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            
            <button 
              onClick={handleSave} 
              className="flex-1 py-2.5 bg-[#d3e3d8] text-[#174525] rounded-xl font-bold shadow-sm border border-[#b8d0c0] hover:bg-[#c2d6cb] transition-all active:scale-95"
            >
              Save
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};