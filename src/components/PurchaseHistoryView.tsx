import React, { useState, useMemo } from 'react';
import { STORE_OPTIONS, getStoreShortCode, normalizeCategoryName } from '../constants';
import { db } from '../firebase';
import { doc, updateDoc, addDoc, collection, setDoc, deleteDoc, query, where, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { toast } from 'sonner';

interface StoreSpend {
  storeId: string;
  storeName: string;
  shortCode: string;
  itemCount: number;
  totalCents: number | null;
}

interface RunItem {
  itemId: string;
  name: string;
  storeId: string;
  category: string;
  trackHabit: boolean;
}

interface PurchaseRun {
  id: string;
  completedAt: string;
  stores: StoreSpend[];
  items: RunItem[];
  totalCents: number | null;
  spendStatus: 'logged' | 'partial' | 'skipped' | 'off' | 'legacy';
  schemaVersion?: number;
}

interface PurchaseHistoryViewProps {
  orders: any[];
  userId: string;
  trackSpend: boolean;
  onToggleTrackSpend?: () => void;
}

export function PurchaseHistoryView({ orders, userId, trackSpend, onToggleTrackSpend }: PurchaseHistoryViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [activeListItems, setActiveListItems] = useState<Record<string, string>>({});

  // LIVE DB SYNC: Watch the active shopping list so buttons update automatically even if items are added elsewhere
  React.useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'items'), 
      where('userId', '==', userId),
      where('inCart', '==', false)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData, DocumentData>) => {
      const itemsMap: Record<string, string> = {};
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.name) {
          itemsMap[data.name.trim().toLowerCase()] = docSnap.id;
        }
      });
      setActiveListItems(itemsMap);
    });

    return () => unsubscribe();
  }, [userId]);

  const [editingSpendRun, setEditingSpendRun] = useState<PurchaseRun | null>(null);
  const [editStoreSpends, setEditStoreSpends] = useState<Record<string, string>>({});

  const formatMoney = (cents: number | null) => {
    if (cents === null) return '--';
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100);
  };

  const normalizedRuns = useMemo(() => {
    return orders
      .map(docData => {
        const rawItems = docData.items || [];
        const items: RunItem[] = rawItems.map((i: any) => ({
          itemId: i.itemId || (i.name ? i.name.toLowerCase().replace(/\s+/g, '-') : 'unknown'),
          name: i.name || 'Unknown Item',
          storeId: i.storeId || i.store || 'Other',
          category: i.category || 'General',
          trackHabit: i.trackHabit !== false
        }));

        let rawStores = docData.stores || docData.storeBreakdown || [];
        
        if (rawStores.length === 0 && items.length > 0) {
          const storeMap = new Map<string, number>();
          items.forEach(i => {
            const sName = i.storeId || 'Other';
            storeMap.set(sName, (storeMap.get(sName) || 0) + 1);
          });
          
          rawStores = Array.from(storeMap.entries()).map(([name, count]) => ({
            storeId: name,
            storeName: name,
            shortCode: getStoreShortCode(name),
            itemCount: count,
            totalCents: null
          }));
        }

        const stores: StoreSpend[] = rawStores.map((s: any) => {
          const name = s.storeName || s.store || 'Unknown';
          return {
            storeId: s.storeId || name,
            storeName: name,
            shortCode: s.shortCode || getStoreShortCode(name),
            itemCount: s.itemCount || 0,
            totalCents: s.totalCents !== undefined ? s.totalCents : (typeof s.spend === 'number' ? Math.round(s.spend * 100) : null)
          };
        });

        const rawTotalCents = docData.totalCents !== undefined 
          ? docData.totalCents 
          : (typeof docData.totalSpend === 'number' ? Math.round(docData.totalSpend * 100) : null);

        const status = docData.spendStatus || (stores.length > 0 && rawTotalCents !== null ? 'logged' : 'legacy');
        
        let finalDate = new Date().toISOString();
        if (docData.completedAt?.toDate) {
          finalDate = docData.completedAt.toDate().toISOString();
        } else if (typeof docData.completedAt === 'string') {
          finalDate = docData.completedAt;
        } else if (docData.date) {
          finalDate = docData.date;
        }

        return {
          id: docData.id,
          completedAt: finalDate,
          stores,
          items,
          totalCents: rawTotalCents,
          spendStatus: status,
          schemaVersion: docData.schemaVersion || 1
        } as PurchaseRun;
      })
      // Filter out empty 0-item ghost runs left behind when legacy items were removed from Habits
      .filter(run => run.items.length > 0 || (run.totalCents !== null && run.totalCents > 0))
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }, [orders]);

  const fourMonthsAgo = useMemo(() => Date.now() - 120 * 24 * 60 * 60 * 1000, []);
  const recentRuns = useMemo(() => normalizedRuns.filter(r => new Date(r.completedAt).getTime() >= fourMonthsAgo), [normalizedRuns, fourMonthsAgo]);

  // Generate strict 4-month array (including current month)
  const fourMonthsKeys = useMemo(() => {
    const keys = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return keys;
  }, []);

  const chartData = useMemo(() => {
    return fourMonthsKeys.map(key => {
      const monthOrders = recentRuns.filter(r => {
        const d = new Date(r.completedAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === key;
      });
      const [year, month] = key.split('-');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
      
      return {
        key,
        label: dateObj.toLocaleString('en-US', { month: 'short' }),
        fullLabel: dateObj.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        totalCents: monthOrders.reduce((sum, r) => sum + (r.totalCents || 0), 0),
        runCount: monthOrders.length
      };
    });
  }, [fourMonthsKeys, recentRuns]);

  const maxChartSpend = Math.max(...chartData.map(d => d.totalCents), 100);
  const maxChartRuns = Math.max(...chartData.map(d => d.runCount), 1);

  const displayedRuns = selectedMonth === 'all' 
    ? recentRuns 
    : recentRuns.filter(r => {
        const d = new Date(r.completedAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
      });

  const totalDisplayedSpend = displayedRuns.reduce((sum, r) => sum + (r.totalCents || 0), 0);

  const calculatedEditTotal = useMemo(() => {
    if (!editingSpendRun) return 0;
    return editingSpendRun.stores.reduce((sum, s) => {
      const val = parseFloat(editStoreSpends[s.storeId] || '0');
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [editingSpendRun, editStoreSpends]);

  const handleAddSingleItemToList = async (runId: string, item: RunItem) => {
    const normalizedName = item.name.trim().toLowerCase();
    if (activeListItems[normalizedName]) {
      toast.error(`${item.name} is already in your list`, { position: 'bottom-center', style: { marginBottom: '76px' } });
      return;
    }

    try {
      await addDoc(collection(db, 'items'), {
        name: item.name.trim(),
        category: normalizeCategoryName(item.category),
        store: item.storeId || 'Other',
        trackHabit: item.trackHabit,
        userId,
        inCart: false,
        createdAt: new Date().toISOString()
      });
      toast.success(`Added ${item.name} to List`, { position: 'bottom-center', style: { marginBottom: '76px' } });
    } catch {
      toast.error('Failed to add item to list.', { position: 'bottom-center', style: { marginBottom: '76px' } });
    }
  };

  const handleRemoveSingleItemFromList = async (docId: string, itemName: string) => {
    if (!docId) return;
    try {
      await deleteDoc(doc(db, 'items', docId));
      toast(`Removed ${itemName} from List`, { icon: <span className="material-symbols-outlined text-[18px] text-rose-500">delete</span>, position: 'bottom-center', style: { marginBottom: '76px' } });
    } catch {
      toast.error('Failed to remove item.', { position: 'bottom-center', style: { marginBottom: '76px' } });
    }
  };

  const handleToggleTracking = async (runId: string, itemId: string, currentTrackStatus: boolean) => {
    const run = normalizedRuns.find(r => r.id === runId);
    if (!run) return;

    try {
      const updatedItems = run.items.map(i => 
        i.itemId === itemId ? { ...i, trackHabit: !currentTrackStatus } : i
      );
      await updateDoc(doc(db, 'purchaseHistory', runId), { items: updatedItems });

      const targetItem = run.items.find(i => i.itemId === itemId);
      if (targetItem) {
        const prefKey = targetItem.name.toLowerCase().replace(/\s+/g, '-');
        await setDoc(doc(db, 'preferences', `${userId}_${prefKey}`), {
          userId,
          trackHabit: !currentTrackStatus,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        
        toast.success(
          !currentTrackStatus 
            ? `${targetItem.name} is now being tracked` 
            : `${targetItem.name} is now a 1-Time purchase.`,
          { position: 'bottom-center', style: { marginBottom: '76px' } }
        );
      }
    } catch {
      toast.error('Failed to update tracking preferences.', { position: 'bottom-center', style: { marginBottom: '76px' } });
    }
  };

  const handleDeleteRun = async (runId: string) => {
    if (window.confirm("Delete this run? This will remove it from your history and spending totals.")) {
      try {
        await deleteDoc(doc(db, 'purchaseHistory', runId));
        toast.success('Run deleted successfully.', { position: 'bottom-center', style: { marginBottom: '76px' } });
        setExpandedOrderId(null);
      } catch {
        toast.error('Failed to delete run.', { position: 'bottom-center', style: { marginBottom: '76px' } });
      }
    }
  };

  const handleOpenEditSpend = (run: PurchaseRun, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const initialSpends: Record<string, string> = {};
    run.stores.forEach(s => {
      initialSpends[s.storeId] = s.totalCents !== null && s.totalCents > 0 ? (s.totalCents / 100).toFixed(2) : '';
    });
    setEditStoreSpends(initialSpends);
    setEditingSpendRun(run);
  };

  const handleSaveEditedSpend = async () => {
    if (!editingSpendRun) return;

    try {
      const updatedStores = editingSpendRun.stores.map(s => {
        const rawVal = editStoreSpends[s.storeId] || '0';
        const parsed = parseFloat(rawVal.replace(/[^0-9.]/g, ''));
        const cents = isNaN(parsed) ? 0 : Math.round(parsed * 100);
        return {
          ...s,
          totalCents: cents > 0 ? cents : null
        };
      });

      const totalCents = updatedStores.reduce((sum, s) => sum + (s.totalCents || 0), 0);
      const spendStatus = totalCents > 0 ? 'logged' : 'skipped';

      await updateDoc(doc(db, 'purchaseHistory', editingSpendRun.id), {
        stores: updatedStores,
        totalCents,
        totalSpend: totalCents / 100,
        spendStatus
      });

      toast.success(totalCents > 0 ? `Updated spend to ${formatMoney(totalCents)}` : "Spend totals updated.", { position: 'bottom-center', style: { marginBottom: '76px' } });
      setEditingSpendRun(null);
    } catch {
      toast.error("Failed to update receipt spend.", { position: 'bottom-center', style: { marginBottom: '76px' } });
    }
  };

  // Scoped low z-index classes so badges never bleed above the sticky app header
  const zIndexClasses = ['z-[3]', 'z-[2]', 'z-[1]'];
  const multiStoreColors = ['bg-[#065f46]', 'bg-[#10b981]', 'bg-[#6ee7b7]', 'bg-[#d1fae5]'];

  return (
    <div className="w-full flex flex-col gap-5 animate-fade-in pb-16">
      
      {/* Turn On Spend Tracking CTA when in History Mode */}
      {!trackSpend && onToggleTrackSpend && (
        <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-4 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex-1 pr-2">
            <h3 className="text-lg font-headline font-bold text-emerald-950 tracking-tight">Track Your Grocery Spend</h3>
            <p className="text-xs text-emerald-800/80 mt-1 leading-relaxed">
              Enable Receipts mode to log your checkout totals and track your 4-month spending.
            </p>
          </div>
          <button 
            type="button" 
            onClick={onToggleTrackSpend}
            className="w-full sm:w-auto px-5 py-3 bg-[#065f46] hover:bg-[#004532] text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-900/20 active:scale-[0.98] transition-all whitespace-nowrap z-10"
          >
            Turn On Receipts
          </button>
        </div>
      )}

      {/* 1. Header & 4-Month Bar Chart */}
      <section className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col gap-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-headline font-bold text-slate-900">
              {trackSpend ? 'Receipts' : 'History'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {trackSpend ? 'Last 4 months of household spending' : 'Last 4 months of grocery runs'}
            </p>
          </div>
        </div>

        <div className="pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            {selectedMonth === 'all' 
              ? '4-Month Total' 
              : `${chartData.find(d => d.key === selectedMonth)?.fullLabel || ''} Total`}
          </span>
          <span className="text-3xl font-extrabold text-[#065f46] tracking-tight tabular-nums">
            {trackSpend 
              ? formatMoney(totalDisplayedSpend) 
              : `${displayedRuns.length} ${displayedRuns.length === 1 ? 'trip' : 'trips'}`}
          </span>
        </div>

        <div className="flex items-end gap-3 h-36 pt-6 border-t border-slate-100/80 mt-2">
          {chartData.map((data, idx) => {
            const isCurrentMonth = idx === chartData.length - 1;
            const isSelected = selectedMonth === data.key;
            const heightPct = trackSpend 
              ? Math.max((data.totalCents / maxChartSpend) * 100, 6) 
              : Math.max((data.runCount / maxChartRuns) * 100, 6);
              
            return (
              <div 
                key={data.key} 
                onClick={() => setSelectedMonth(selectedMonth === data.key ? 'all' : data.key)}
                className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end cursor-pointer"
              >
                <div className="text-[10px] font-bold text-slate-600 tabular-nums">
                  {trackSpend 
                    ? (data.totalCents > 0 ? formatMoney(data.totalCents).split('.')[0] : '$0') 
                    : `${data.runCount}`}
                </div>
                
                <div className="w-full bg-slate-50 rounded-t-lg flex items-end justify-center h-[88px] relative overflow-hidden">
                  <div 
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isSelected || (selectedMonth === 'all' && isCurrentMonth) 
                        ? 'bg-[#065f46]' 
                        : 'bg-[#a7f3d0] group-hover:bg-[#6ee7b7]'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className={`text-[11px] font-bold ${isSelected || isCurrentMonth ? 'text-slate-900' : 'text-slate-400'}`}>
                  {data.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide pt-3 border-t border-slate-100/80">
          <button
            type="button"
            onClick={() => setSelectedMonth('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 border ${
              selectedMonth === 'all'
                ? 'bg-[#065f46] text-white border-[#065f46] shadow-md shadow-emerald-900/10'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            All ({recentRuns.length})
          </button>
          {fourMonthsKeys.slice().reverse().map((key) => {
            const data = chartData.find(d => d.key === key);
            if (!data) return null;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedMonth(key)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 border ${
                  selectedMonth === key
                    ? 'bg-[#065f46] text-white border-[#065f46] shadow-md shadow-emerald-900/10'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {data.label} {trackSpend && data.totalCents > 0 ? `(${formatMoney(data.totalCents).split('.')[0]})` : `(${data.runCount})`}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Feed */}
      {displayedRuns.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <span className="material-symbols-outlined text-3xl">receipt_long</span>
          </div>
          <h3 className="font-bold text-slate-800 mb-1">No runs found</h3>
          <p className="text-xs text-slate-500">
            Completed grocery runs will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {displayedRuns.map(run => {
            const isExpanded = expandedOrderId === run.id;
            const dateObj = new Date(run.completedAt);
            const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            
            const oneTimeCount = run.items.filter(i => !i.trackHabit).length;
            const hasSpend = run.totalCents !== null && run.totalCents > 0;
            const visibleStores = run.stores.slice(0, 2);
            const extraStoreCount = Math.max(0, run.stores.length - 2);

            return (
              <article key={run.id} className="isolate bg-white rounded-[24px] border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-200">
                
                {/* MACRO VIEW (Store-Forward Split Card) */}
                <div 
                  onClick={() => setExpandedOrderId(isExpanded ? null : run.id)}
                  className={`p-4 cursor-pointer flex flex-col gap-3 transition-colors ${isExpanded ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}
                  role="button"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center justify-between gap-2.5">
                    
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Capped Overlapping Store Squircle Badges (Max 2 + Counter) */}
                      {run.stores.length > 0 && (
                        <div className="flex items-center -space-x-2.5 shrink-0">
                          {visibleStores.map((store, i) => {
                            const official = STORE_OPTIONS.find(o => o.name.toLowerCase() === store.storeName.toLowerCase());
                            const bgText = official?.badgeColor || 'bg-[#64748B] text-[#FFFFFF] border-[#94A3B8]';
                            const code = official?.shortCode || getStoreShortCode(store.storeName);
                            return (
                              <div 
                                key={store.storeId} 
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-headline font-extrabold text-[10px] tracking-wider border-2 shadow-xs ${zIndexClasses[i] || 'z-0'} ${bgText}`}
                                title={official?.name || store.storeName}
                              >
                                {code}
                              </div>
                            );
                          })}
                          {extraStoreCount > 0 && (
                            <div 
                              className="w-9 h-9 rounded-xl flex items-center justify-center font-headline font-extrabold text-[10px] bg-slate-100 text-slate-700 border-2 border-white shadow-xs z-0"
                              title={`+${extraStoreCount} more ${extraStoreCount === 1 ? 'store' : 'stores'}`}
                            >
                              +{extraStoreCount}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="text-[15px] font-bold text-slate-900 whitespace-nowrap truncate">
                          {formattedDate}
                        </div>
                        <div className="text-xs font-semibold text-slate-500 mt-0.5 whitespace-nowrap truncate">
                          {run.items.length} {run.items.length === 1 ? 'item' : 'items'}
                          {run.stores.length > 0 && ` • ${run.stores.length} ${run.stores.length === 1 ? 'store' : 'stores'}`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center shrink-0 gap-2">
                      {trackSpend && hasSpend && (
                        <div className="text-[17px] font-bold tabular-nums text-[#065f46]">{formatMoney(run.totalCents)}</div>
                      )}
                      {trackSpend && !hasSpend && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditSpend(run, e)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-colors whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-[14px] leading-none">add_circle</span>
                          <span>Add Total</span>
                        </button>
                      )}
                      <div className="w-8 h-8 rounded-full bg-slate-100/80 border border-slate-200 text-slate-500 flex items-center justify-center transition-transform shrink-0">
                        <span className="material-symbols-outlined text-lg leading-none">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                      </div>
                    </div>

                  </div>

                  {!isExpanded && run.items.length > 0 && (
                    <div className="text-xs text-slate-500 font-medium truncate pt-2 border-t border-slate-100">
                      {run.items.slice(0, 3).map(i => i.name).join(', ')}
                      {run.items.length > 3 && ` +${run.items.length - 3} more`}
                    </div>
                  )}
                  
                  {((trackSpend && run.spendStatus === 'partial') || (oneTimeCount > 0 && !isExpanded)) && (
                    <div className="flex flex-wrap gap-2">
                      {trackSpend && run.spendStatus === 'partial' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#fef3c7] text-[#92400e] text-[10px] font-bold uppercase tracking-wider">
                          <span className="material-symbols-outlined text-[12px]">warning</span> Missing some totals
                        </span>
                      )}
                      {oneTimeCount > 0 && !isExpanded && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#fef3c7] text-[#92400e] text-[10px] font-bold uppercase tracking-wider">
                          {oneTimeCount}x 1-Time {oneTimeCount === 1 ? 'Buy' : 'Buys'}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* MICRO VIEW (Expanded Receipt Details) */}
                {isExpanded && (
                  <div className="flex flex-col border-t border-slate-100 bg-[#f9f9ff] pb-2">
                    
                    {/* Multi-Store Proportional Spend Split Bar */}
                    {run.stores.length > 1 && trackSpend && hasSpend && (
                      <div className="px-4 pt-4 pb-2">
                        <div className="flex flex-wrap text-[11px] font-bold text-slate-600 mb-2 gap-3">
                          {run.stores.map((s, idx) => {
                            const official = STORE_OPTIONS.find(o => o.name.toLowerCase() === s.storeName.toLowerCase());
                            return (
                              <span key={s.storeId} className="flex items-center gap-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${multiStoreColors[idx % multiStoreColors.length]}`} />
                                <span>{official?.name || s.storeName} ({formatMoney(s.totalCents)})</span>
                              </span>
                            );
                          })}
                        </div>
                        <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-200 gap-0.5">
                          {run.stores.map((s, idx) => {
                            const pct = Math.max(((s.totalCents || 0) / (run.totalCents || 1)) * 100, 4);
                            return (
                              <div 
                                key={s.storeId} 
                                style={{ width: `${pct}%` }} 
                                className={`h-full ${multiStoreColors[idx % multiStoreColors.length]}`} 
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {run.stores.map((store, sIdx) => {
                      const storeItems = run.items.filter(i => (i.storeId || 'Other') === store.storeId);
                      const official = STORE_OPTIONS.find(o => o.name.toLowerCase() === store.storeName.toLowerCase());
                      const badgeStyle = official?.badgeColor || 'bg-[#64748B] text-[#FFFFFF] border-[#94A3B8]';
                      const shortCode = official?.shortCode || getStoreShortCode(store.storeName);

                      return (
                        <div key={store.storeId} className={`p-4 ${sIdx !== 0 ? 'border-t border-slate-200/60' : ''}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center justify-center px-2 h-6 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${badgeStyle}`}>
                                {shortCode}
                              </span>
                              <span className="text-sm font-bold text-slate-900">
                                {official?.name || store.storeName}
                              </span>
                            </div>

                            {/* Store Spend / Add Total */}
                            {trackSpend && (
                              <div className="flex items-center gap-2">
                                {store.totalCents !== null && store.totalCents > 0 ? (
                                  <span className="text-sm font-extrabold tabular-nums text-[#065f46] bg-[#d1fae5] px-2.5 py-1 rounded-lg">
                                    {formatMoney(store.totalCents)}
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenEditSpend(run, e)}
                                    className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">add</span> Add Spend
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2 border-t border-slate-200/80 pt-3">
                            {storeItems.map((item, index) => {
                              const isTracked = item.trackHabit;
                              const normalizedItemName = item.name.trim().toLowerCase();
                              const activeDocId = activeListItems[normalizedItemName];
                              const isAdded = !!activeDocId;

                              return (
                                <div key={`${item.itemId}-${index}`} className="flex items-center justify-between py-1.5 gap-2">
                                  {/* Receipt Item Title Specification: Courier New, Bold 700, Uppercase, Tracking 0.05em, 15px */}
                                  <div className="min-w-0 flex-1">
                                    <span 
                                      className="font-bold uppercase tracking-[0.05em] text-[15px] leading-[1.25] text-[#111827] block truncate select-text"
                                      style={{ fontFamily: '"Courier New", Courier, monospace' }}
                                    >
                                      {item.name}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 shrink-0">
                                    {/* Action CTA: Green rounded + (Add to list) OR Check (Remove from list) */}
                                    <button
                                      type="button"
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        isAdded ? handleRemoveSingleItemFromList(activeDocId, item.name) : handleAddSingleItemToList(run.id, item); 
                                      }}
                                      className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-2xs transition-all active:scale-95 ${
                                        isAdded 
                                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                          : 'bg-[#d9efe2] hover:bg-[#c1e8d1] text-[#0a7a52]'
                                      }`}
                                      title={isAdded ? "Remove from list" : "Add to list"}
                                      aria-label={isAdded ? `Remove ${item.name} from list` : `Add ${item.name} to list`}
                                    >
                                      <span className="material-symbols-outlined text-[16px] font-bold leading-none">
                                        {isAdded ? 'check' : 'add'}
                                      </span>
                                    </button>

                                    {/* Status Badges: Tracked / 1-Time Reversible Toggles */}
                                    {isTracked ? (
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); handleToggleTracking(run.id, item.itemId, true); }}
                                          className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200 shadow-2xs transition-colors flex items-center gap-1 whitespace-nowrap active:scale-95"
                                        >
                                          <span className="material-symbols-outlined text-[15px] leading-none">autorenew</span>
                                          <span>Tracked</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); handleToggleTracking(run.id, item.itemId, false); }}
                                          className="text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg border border-amber-200 shadow-2xs transition-colors flex items-center gap-1 whitespace-nowrap active:scale-95"
                                        >
                                          <span className="material-symbols-outlined text-[15px] leading-none">bolt</span>
                                          <span>1-Time</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {storeItems.length === 0 && (
                              <div className="text-xs text-slate-400 italic">No items listed for this store.</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Action Footer: Delete button & Edit Spend CTA */}
                    <div className="p-4 border-t border-slate-200 flex items-center justify-between gap-3">
                      <button 
                        type="button"
                        onClick={() => handleDeleteRun(run.id)}
                        className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 shadow-sm active:scale-95 transition-all shrink-0"
                        aria-label="Delete Run"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>

                      {trackSpend && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditSpend(run, e)}
                          className="px-4 h-11 bg-white hover:bg-emerald-50 text-[#065f46] border border-[#d6e8dc] font-bold text-sm rounded-xl shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit_note</span>
                          <span>{run.totalCents !== null && run.totalCents > 0 ? 'Edit Spend' : 'Add Receipt Spend'}</span>
                        </button>
                      )}
                    </div>

                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* 3. RETROACTIVE / EDIT SPEND MODAL */}
      {editingSpendRun && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 pb-8 sm:p-4 z-50 animate-fade-in"
          onClick={() => setEditingSpendRun(null)}
        >
          <div 
            className="bg-white text-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-headline font-bold text-slate-900">
                  Update Receipt Spend
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(editingSpendRun.completedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSpendRun(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {editingSpendRun.stores.map((s) => {
                const officialStore = STORE_OPTIONS.find(
                  (opt) => opt.name.toLowerCase() === s.storeName.toLowerCase()
                );

                return (
                  <div 
                    key={s.storeId}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-800 truncate">
                        {officialStore?.name || s.storeName}
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
                        value={editStoreSpends[s.storeId] || ''}
                        onChange={(e) => {
                          const cleanVal = e.target.value.replace(/[^0-9.]/g, '');
                          setEditStoreSpends(prev => ({ ...prev, [s.storeId]: cleanVal }));
                        }}
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
              <span className="text-xl font-extrabold text-emerald-800 tabular-nums">
                ${calculatedEditTotal.toFixed(2)}
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveEditedSpend}
                className="w-full py-3.5 bg-[#00A86B] hover:bg-[#059669] text-white font-headline font-bold rounded-xl shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">check_circle</span>
                <span>Save Spend</span>
              </button>

              <button
                type="button"
                onClick={() => setEditingSpendRun(null)}
                className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}