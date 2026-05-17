import React from 'react';
import { Icon } from '@iconify/react';
import { getItemIcon, getCategoryBgColor } from '../constants'; 
import { LuCheck, LuTrash2, LuUndo } from 'react-icons/lu';

interface ItemCardProps {
  id: string | number;
  name: string;
  inCart: boolean;
  viewMode?: string; 
  category?: string;
  icon?: string;
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
  icon, 
  onToggleCart, 
  onDelete, 
  onEdit 
}: ItemCardProps) {
  
  const isListMode = viewMode === 'list';

  return (
    <div className={`relative w-full p-4 rounded-xl border transition-all duration-300 flex flex-col gap-1 ${
      isListMode && inCart 
        // FIXED: Applies the soft, distinct muted background block instead of going invisible
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
          {/* FIXED: Drains the color and fades the icon specifically when checked */}
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
              <span className="material-symbols-outlined text-[14px] leading-none">{icon}</span>
              <span className="whitespace-nowrap">{category}</span>
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