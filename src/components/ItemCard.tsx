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

export function ItemCard({ id, name, inCart, viewMode, category, trackHabit, onToggleCart, onDelete, onEdit }: ItemCardProps) {
  const isListMode = viewMode === 'list';

  // CART RECEIPT MODE
  if (!isListMode) {
    return (
      <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100/90 flex items-center justify-between gap-3 transition-all hover:border-emerald-200">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-[#F4FAF6] border border-emerald-100/80 flex items-center justify-center text-xl shrink-0">
            <Icon icon={getItemIcon(name, category)} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <h4 className="text-sm font-headline font-bold text-slate-800 truncate leading-snug">{name}</h4>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`inline-flex items-center gap-1 text-[10px] font-label font-semibold px-2 py-0.5 rounded-md border whitespace-nowrap ${getCategoryBgColor(category)}`}>
                <span className="material-symbols-outlined text-[12px] leading-none">{getCategoryIcon(category)}</span>
                <span>{category || 'General'}</span>
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => onToggleCart(id, inCart)} 
          className="p-2 text-slate-400 hover:text-primary hover:bg-emerald-50 rounded-full transition-colors shrink-0"
          title={`Move ${name} back to list`}
        >
          <LuUndo className="text-lg" />
        </button>
      </div>
    );
  }

  // STANDARD LIST MODE
  return (
    <div className={`relative w-full p-4 rounded-xl border transition-all duration-300 flex flex-col gap-1 ${inCart ? 'bg-primary/5 border-primary/10 shadow-none' : 'bg-white shadow-[0_4px_20px_-4px_rgba(23,106,33,0.08)] border-primary/5'}`}>
      <div className="flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button onClick={() => onToggleCart(id, inCart)} className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${inCart ? 'border-primary bg-primary' : 'border-slate-300 bg-white'}`}>
            {inCart && <LuCheck className="text-white text-sm stroke-[3px]" />}
          </button>
          <div className={`text-2xl shrink-0 transition-all ${inCart ? 'grayscale opacity-50' : 'text-primary'}`}>
            <Icon icon={getItemIcon(name, category)} />
          </div>
          <div className="flex flex-col flex-1 min-w-0 justify-center">
            <button onClick={(e) => { e.stopPropagation(); if (onEdit) onEdit(id); }} className={`text-left font-headline font-semibold hover:text-primary transition-all break-words leading-tight ${inCart ? 'line-through text-slate-400' : 'text-text-main'}`}>
              {name}
            </button>
            {!inCart && (
              <div className="mt-0.5">
                {trackHabit !== false ? (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#DCEDE0] text-[#006d30] font-bold text-[9px] cursor-default"><span className="material-symbols-outlined text-[11px]">sync</span>Tracked</span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#FEF3C7] text-amber-800 font-bold text-[9px] cursor-default"><span className="material-symbols-outlined text-[11px]">bolt</span>1-Time</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className={`flex items-center gap-1 text-[10px] font-label px-2 py-1 rounded-md border shrink-0 transition-all ${inCart ? 'opacity-50 grayscale' : ''} ${getCategoryBgColor(category)}`}>
            <span className="material-symbols-outlined text-[14px] leading-none">{getCategoryIcon(category)}</span>
            <span className="whitespace-nowrap">{category || 'Other'}</span>
          </div>
          <button onClick={() => onDelete(id)} className={`p-2 hover:bg-red-50 rounded-full transition-colors shrink-0 ${inCart ? 'text-red-300 hover:text-red-500' : 'text-red-400 hover:text-red-600'}`}>
            <LuTrash2 className="text-xl" />
          </button>
        </div>
      </div>
    </div>
  );
}