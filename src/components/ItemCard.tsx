import React from 'react';
import { Icon } from '@iconify/react'; // REQUIRED: npm install @iconify/react
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
      isListMode && inCart ? 'bg-surface-container opacity-60 border-outline-variant/10' : 'bg-surface-container-lowest border-outline-variant/20 shadow-sm'
    }`}>
      
      <div className="flex items-center justify-between gap-2 z-10">
        
        {/* LEFT SIDE: Checkbox, Icon, and Name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          
          {/* Checkbox */}
          {isListMode && (
            <button 
              onClick={() => onToggleCart(id, inCart)}
              className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                inCart ? 'border-primary bg-primary' : 'border-outline-variant'
              }`}
            >
              {inCart && <LuCheck className="text-white text-sm stroke-[3px]" />}
            </button>
          )}

          {/* MAIN PRODUCT ICON: Now using Iconify for high-detail specific icons */}
          <div className={`text-2xl shrink-0 transition-colors ${
            isListMode && inCart ? 'text-on-surface-variant/40' : 'text-primary'
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
              isListMode && inCart ? 'line-through text-on-surface-variant' : 'text-on-surface'
            }`}
          >
            {name}
          </button>
        </div>

        {/* RIGHT SIDE: Category Tag & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* THE CATEGORY TAG */}
          {isListMode && (
            <div className={`flex items-center gap-1 text-[10px] font-label px-2 py-1 rounded-md border shrink-0 ${getCategoryBgColor(category)}`}>
              {/* Note: This uses Material Symbols for the small category icon */}
              <span className="material-symbols-outlined text-[14px] leading-none">{icon}</span>
              <span className="whitespace-nowrap">{category}</span>
            </div>
          )}

          {/* Delete / Undo Buttons */}
          {isListMode ? (
            <button onClick={() => onDelete(id)} className="p-2 text-error hover:bg-error/10 rounded-full transition-colors shrink-0">
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
