import React, { useState } from 'react';
import { STORE_OPTIONS } from '../constants';

interface StoreInfo {
  name: string;
  itemCount: number;
}

interface CheckoutSpendModalProps {
  isOpen: boolean;
  stores: StoreInfo[];
  onClose: () => void;
  onConfirm: (storeSpends: Record<string, number>) => void;
}

export function CheckoutSpendModal({
  isOpen,
  stores,
  onClose,
  onConfirm,
}: CheckoutSpendModalProps) {
  const [spends, setSpends] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleInputChange = (storeName: string, value: string) => {
    const cleanVal = value.replace(/[^0-9.]/g, '');
    setSpends((prev) => ({ ...prev, [storeName]: cleanVal }));
  };

  const calculatedTotal = stores.reduce((sum, s) => {
    const val = parseFloat(spends[s.name] || '0');
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const handleSubmit = (skipSpend = false) => {
    const finalized: Record<string, number> = {};
    stores.forEach((s) => {
      if (skipSpend) {
        finalized[s.name] = 0;
      } else {
        const val = parseFloat(spends[s.name] || '0');
        finalized[s.name] = isNaN(val) ? 0 : Math.round(val * 100) / 100;
      }
    });
    onConfirm(finalized);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 pb-8 sm:p-4 z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white text-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-headline font-bold text-slate-900">
              Log Run Spend
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter receipt totals by store (optional)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {stores.map((s) => {
            const officialStore = STORE_OPTIONS.find(
              (opt) => opt.name.toLowerCase() === s.name.toLowerCase()
            );

            return (
              <div 
                key={s.name}
                className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-800 truncate">
                    {officialStore?.name || s.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {s.itemCount} {s.itemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="relative w-32 shrink-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={spends[s.name] || ''}
                    onChange={(e) => handleInputChange(s.name, e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-right text-sm font-extrabold text-slate-900 placeholder:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl">
          <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
            Total Run Spend
          </span>
          <span className="text-xl font-extrabold text-emerald-800">
            ${calculatedTotal.toFixed(2)}
          </span>
        </div>

        <div className="flex flex-col gap-1 pt-1">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="w-full py-3.5 bg-[#00A86B] hover:bg-[#059669] text-white font-headline font-bold rounded-xl shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <span>Save &amp; Finish Run</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="w-full py-4 sm:py-2.5 text-[13px] font-bold text-slate-500 hover:text-slate-700 transition-colors text-center mt-1"
          >
            Skip / Log $0 for now
          </button>
        </div>
      </div>
    </div>
  );
}