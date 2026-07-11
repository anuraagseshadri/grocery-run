import React from 'react';
import { Icon } from '@iconify/react';
import { getItemIcon, getCategoryBgColor } from '../constants';
import { LuCheck, LuTrash2, LuUndo } from 'react-icons/lu';

// 1. DYNAMIC UI MAPPING: The UI now decides what icon to show based purely on the category string.
const getCategoryIcon = (category?: string) => {
  switch(category?.trim()) {
    case 'Produce': return 'eco';    case 'Dairy & Eggs': return 'water_drop';
    case 'Meat & Seafood': return 'set_meal';
    case 'Pantry': return 'inventory_2';
    case 'Bakery': return 'bakery_dining';
    case 'Frozen': return 'ac_unit';
    case 'Beverages': return 'local_drink';
    case 'Household & Cleaning': return 'cleaning_services';
    case 'Pharmacy & Personal Care': return 'medical_services';
    case 'Dessert & Snacks': return 'cookie';
    case 'Rice & Wheat': return 'rice_bowl'; 
    case 'Pasta & Noodles': return 'ramen_dining'; 
    case 'Breakfast & Cereal': return 'breakfast_dining'; 
    case 'Cooking Essentials': return 'soup_kitchen'; 
    default: return 'shopping_bag';
  }
};

interface ItemCardProps {
  id: string | number;
  name: string;
  inCart: boolean;
  viewMode?: string; 
  category?: string;
  // Note: 'icon' has been completely removed from this interface!
  onToggleCart: (id: any, inCart: boolean) => void;
  onDelete: (id: any) => void;
  onEdit?: (id: any) => void;
}

export function ItemCard({ 
  id, 
  name, 
  inCart, 
  viewMode, 
  category, 
  onToggleCart, 
  onDelete, 
  onEdit 
}: ItemCardProps) {
  
  const isListMode = viewMode === 'list';

  return (
    <div className={`relative w-full p-4 rounded-xl border transition-all duration-300 flex flex-col gap-1 ${
      isListMode && inCart 
        ? 'bg-primary/5 border-primary/10 shadow-none' 
        : 'bg-white shadow-[0_4px_20px_-4px_rgba(23,106,33,0.08)] border-primary/5'
    }`}>
      
      <div className="flex items-center justify-between gap-2 z-10">
        
        {/* LEFT SIDE: Checkbox, Icon, and Name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          
          {/* Checkbox */}
          {isListMode && (
            <button 
              onClick={() => onToggleCart(id, inCart)}
              className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                inCart ? 'border-primary bg-primary' : 'border-slate-300 bg-white'
              }`}
            >
              {inCart && <LuCheck className="text-white text-sm stroke-[3px]" />}
            </button>
          )}

          {/* MAIN PRODUCT ICON */}
          <div className={`text-2xl shrink-0 transition-all ${
            isListMode && inCart ? 'grayscale opacity-50' : 'text-primary'
          }`}>
            <Icon icon={getItemIcon(name)} />
          </div>
          
          {/* Item Name */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) onEdit(id);
            }}
            className={`text-left font-headline font-semibold hover:text-primary transition-all truncate ${
              isListMode && inCart ? 'line-through text-slate-400' : 'text-text-main'
            }`}
          >
            {name}
          </button>
        </div>

        {/* RIGHT SIDE: Category Tag & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* THE CATEGORY TAG */}
          {isListMode && (
            <div className={`flex items-center gap-1 text-[10px] font-label px-2 py-1 rounded-md border shrink-0 transition-all ${
               isListMode && inCart ? 'opacity-50 grayscale' : ''
            } ${getCategoryBgColor(category)}`}>
              
              {/* 2. IMPLEMENTATION: The icon is now dynamically generated on the fly */}
              <span className="material-symbols-outlined text-[14px] leading-none">
                {getCategoryIcon(category)}
              </span>
              
              <span className="whitespace-nowrap">{category || 'Other'}</span>
            </div>
          )}

          {/* Delete / Undo Buttons */}
          {isListMode ? (
            <button onClick={() => onDelete(id)} className={`p-2 hover:bg-red-50 rounded-full transition-colors shrink-0 ${
              isListMode && inCart ? 'text-red-300 hover:text-red-500' : 'text-red-400 hover:text-red-600'
            }`}>
              <LuTrash2 className="text-xl" />
            </button>
          ) : (
            <button 
              onClick={() => onToggleCart(id, inCart)} 
              className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors shrink-0"
              title="Move back to list"
            >
              <LuUndo className="text-xl" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}