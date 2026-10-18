import React from 'react';
import { Icon } from '@iconify/react';
import { getItemIcon, getCategoryBgColor, getCategoryIcon } from '../constants';
import { LuCheck, LuTrash2, LuUndo } from 'react-icons/lu';

interface ItemCardProps {
  id: string | number;
  name: string;
  inCart: boolean;
  viewMode?: string; 
  category?: string;
  trackHabit?: boolean; 
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
  trackHabit, 
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
        
        {/* LEFT SIDE: Checkbox (List only), Icon, Name, and Tracking Badge */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          
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

          <div className={`text-2xl shrink-0 transition-all ${
            isListMode && inCart ? 'grayscale opacity-50' : 'text-primary'
          }`}>
            <Icon icon={getItemIcon(name, category)} />
          </div>
          
          {/* VERTICAL STACK: Item Name & Tracking Badge */}
          <div className="flex flex-col flex-1 min-w-0 justify-center">
            {isListMode && onEdit ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(id);
                }}
                className={`text-left font-headline font-semibold hover:text-primary transition-all break-words leading-tight ${
                  inCart ? 'line-through text-slate-400' : 'text-text-main'
                }`}
              >
                {name}
              </button>
            ) : (
              <span className="text-left font-headline font-semibold text-text-main break-words leading-tight">
                {name}
              </span>
            )}

            {/* Show Tracked / 1-Time badge in Cart mode AND on un-carted List items */}
            {(!isListMode || !inCart) && (
              <div className="mt-1">
                {trackHabit !== false ? (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#DCEDE0] text-[#006d30] font-bold text-[9px] cursor-default">
                    <span className="material-symbols-outlined text-[11px]">sync</span>
                    Tracked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#FEF3C7] text-amber-800 font-bold text-[9px] cursor-default">
                    <span className="material-symbols-outlined text-[11px]">bolt</span>
                    1-Time
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: Category Tag & Action Button (Delete in List, Undo in Cart) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className={`flex items-center gap-1 text-[10px] font-label font-semibold px-2 py-1 rounded-md border shrink-0 transition-all ${
             isListMode && inCart ? 'opacity-50 grayscale' : ''
          } ${getCategoryBgColor(category)}`}>
            <Icon icon={getCategoryIcon(category)} className="text-[14px] shrink-0" />
            <span className="whitespace-nowrap">{category || 'General'}</span>
          </div>

          {isListMode ? (
            <button 
              onClick={() => onDelete(id)} 
              className={`p-2 hover:bg-red-50 rounded-full transition-colors shrink-0 ${
                inCart ? 'text-red-300 hover:text-red-500' : 'text-red-400 hover:text-red-600'
              }`}
              title={`Delete ${name}`}
            >
              <LuTrash2 className="text-xl" />
            </button>
          ) : (
            <button 
              onClick={() => onToggleCart(id, inCart)} 
              className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors shrink-0"
              title={`Move ${name} back to list`}
              aria-label={`Return ${name} to list`}
            >
              <LuUndo className="text-xl" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}