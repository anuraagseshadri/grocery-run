import React, { useState, useMemo } from 'react';
import { STORE_OPTIONS, getStoreShortCode, normalizeCategoryName } from '../constants';
import { db } from '../firebase';
import { doc, updateDoc, addDoc, collection, setDoc, deleteDoc, getDocs, query, where, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
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
}

type Currency = 'CAD' | 'INR';

export function PurchaseHistoryView({ orders, userId, trackSpend }: PurchaseHistoryViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>('CAD');
  const [activeListItems, setActiveListItems] = useState<Record<string, string>>({}); // Live sync with active list

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

  // Retroactive spend editing state
  const [editingSpendRun, setEditingSpendRun] = useState<PurchaseRun | null>(null);
  const [editStoreSpends, setEditStoreSpends] = useState<Record<string, string>>({});

  const formatMoney = (cents: number | null) => {
    if (cents === null) return '--';
    const amount = cents / 100;
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    }
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);
  };

  const normalizedRuns = useMemo(() => {
    return orders.map(docData => {
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
    }).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }, [orders]);

  const fourMonthsAgo = useMemo(() => Date.now() - 120 * 24 * 60 * 60 * 1000, []);
  const recentRuns = useMemo(() => normalizedRuns.filter(r => new Date(r.completedAt).getTime() >= fourMonthsAgo), [normalizedRuns, fourMonthsAgo]);

  const monthlyRollups = useMemo(() => {
    const map: Record<string, { label: string; totalCents: number; runCount: number }> = {};
    recentRuns.forEach(r => {
      const d = new Date(r.completedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) {
        map[key] = { label: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }), totalCents: 0, runCount: 0 };
      }
      map[key].totalCents += (r.totalCents || 0);
      map[key].runCount += 1;
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [recentRuns]);

  const displayedRuns = selectedMonth === 'all' 
    ? recentRuns 
    : recentRuns.filter(r => {
        const d = new Date(r.completedAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
      });

  const totalDisplayedSpend = displayedRuns.reduce((sum, r) => sum + (r.totalCents || 0), 0);

  // Add individual item to list with duplicate check
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

  // Open modal to add or edit retroactive spend for a run
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

  const calculatedEditTotal = useMemo(() => {
    if (!editingSpendRun) return 0;
    return editingSpendRun.stores.reduce((sum, s) => {
      const val = parseFloat(editStoreSpends[s.storeId] || '0');
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [editingSpendRun, editStoreSpends]);

  return (
    <div className="w-full flex flex-col gap-5 animate-fade-in pb-16">
      
      {/* 1. Header Banner & Currency Toggle */}
      <section className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center shadow-xs">
            <button
              type="button"
              onClick={() => setCurrency('CAD')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${currency === 'CAD' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
            >
              CAD
            </button>
            <button
              type="button"
              onClick={() => setCurrency('INR')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${currency === 'INR' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
            >
              INR
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-headline font-bold text-slate-900">
            {trackSpend ? 'Receipts' : 'History'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {trackSpend ? 'Last 4 months of household spending' : 'Last 4 months of grocery runs'}
          </p>
        </div>

        {trackSpend && (
          <div className="pt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              {selectedMonth === 'all' ? '4-Month Total' : `${monthlyRollups.find(m => m[0] === selectedMonth)?.[1].label} Total`}
            </span>
            <span className="text-3xl font-extrabold text-[#0b5a3c] tracking-tight">
              {formatMoney(totalDisplayedSpend)}
            </span>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide pt-2 border-t border-slate-100/80">
          <button
            type="button"
            onClick={() => setSelectedMonth('all')}
            className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 border ${
              selectedMonth === 'all'
                ? 'bg-[#0a7a52] text-white border-[#0a7a52] shadow-md shadow-emerald-900/10'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            All ({recentRuns.length})
          </button>
          {monthlyRollups.map(([key, data]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedMonth(key)}
              className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 border ${
                selectedMonth === key
                  ? 'bg-[#0a7a52] text-white border-[#0a7a52] shadow-md shadow-emerald-900/10'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {data.label} {trackSpend && data.totalCents > 0 && `(${formatMoney(data.totalCents).split('.')[0]})`}
            </button>
          ))}
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

            return (
              <article key={run.id} className="bg-white rounded-[24px] border border-[#d6e8dc] shadow-xs overflow-hidden transition-all duration-200">
                
                {/* MACRO VIEW (Collapsed Row) */}
                <div 
                  onClick={() => setExpandedOrderId(isExpanded ? null : run.id)}
                  className={`p-4 cursor-pointer flex flex-col gap-3 transition-colors ${isExpanded ? 'bg-[#f3faf5]' : 'hover:bg-slate-50'}`}
                  role="button"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col min-w-0">
                      <div className="text-[15px] font-bold text-[#0f1f17]">{formattedDate}</div>
                      <div className="text-xs font-semibold text-[#5b6b63] mt-0.5">
                        {run.stores.length} {run.stores.length === 1 ? 'store' : 'stores'}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end shrink-0 gap-1.5">
                      {trackSpend && hasSpend && (
                        <div className="text-lg font-extrabold text-[#0b5a3c]">{formatMoney(run.totalCents)}</div>
                      )}
                      {trackSpend && !hasSpend && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditSpend(run, e)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[13px]">add_circle</span>
                          <span>Add Total</span>
                        </button>
                      )}
                      {!trackSpend && (
                        <div className="text-sm font-bold text-slate-600">{run.items.length} items</div>
                      )}
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center shadow-xs">
                        <span className="material-symbols-outlined text-lg">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Store Badges Row using Official Store Logos/Pills */}
                  {run.stores.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {run.stores.map(store => {
                        const official = STORE_OPTIONS.find(o => o.name.toLowerCase() === store.storeName.toLowerCase());
                        const badgeColorClass = official?.color 
                          ? official.color.replace('border-', 'border-opacity-40 border-') 
                          : 'bg-[#e8f1ec] text-[#0b5a3c]';

                        return (
                          <div key={store.storeId} className="flex items-center gap-1.5">
                            {official?.imageLogo ? (
                              <div className="flex items-center h-5 px-2 py-0.5 rounded-md bg-white border border-slate-200 shadow-2xs">
                                <img src={official.imageLogo} alt={store.storeName} className="h-4 max-w-[80px] object-contain object-left" />
                              </div>
                            ) : (
                              <span className={`inline-flex items-center justify-center px-2 h-5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border shadow-sm ${badgeColorClass}`}>
                                {official?.name || store.storeName}
                              </span>
                            )}
                            {trackSpend && store.totalCents !== null && store.totalCents > 0 && (
                              <span className="text-[11px] font-bold text-[#3d4d45]">{formatMoney(store.totalCents)}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!isExpanded && run.items.length > 0 && (
                    <div className="text-xs text-[#5b6b63] font-medium truncate pt-1 border-t border-[#e3efe7]">
                      {run.items.slice(0, 3).map(i => i.name).join(', ')}
                      {run.items.length > 3 && ` +${run.items.length - 3} more`}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mt-1">
                    {trackSpend && run.spendStatus === 'partial' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#fdf0d2] text-[#8a5300] text-[10px] font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[12px]">warning</span> Missing some totals
                      </span>
                    )}
                    {oneTimeCount > 0 && !isExpanded && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#fdf0d2] text-[#8a5300] text-[10px] font-bold uppercase tracking-wider">
                        {oneTimeCount} One-Time Buy{oneTimeCount !== 1 && 's'}
                      </span>
                    )}
                  </div>
                </div>

                {/* MICRO VIEW (Expanded Receipt Details) */}
                {isExpanded && (
                  <div className="flex flex-col border-t border-[#e3efe7] bg-[#fbfdfb] pb-2">
                    
                    {run.stores.map((store, sIdx) => {
                      const storeItems = run.items.filter(i => (i.storeId || 'Other') === store.storeId);
                      const official = STORE_OPTIONS.find(o => o.name.toLowerCase() === store.storeName.toLowerCase());

                      return (
                        <div key={store.storeId} className={`p-4 ${sIdx !== 0 ? 'border-t border-[#e3efe7]' : ''}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {/* OFFICIAL STORE LOGO HEADER IN EXPANDED VIEW */}
                              {official?.imageLogo ? (
                                <div className="flex items-center h-6 px-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                                  <img src={official.imageLogo} alt={store.storeName} className="h-4 max-w-[100px] object-contain object-left" />
                                </div>
                              ) : (
                                <span className="text-sm font-bold text-[#0f1f17]">{official?.logo || store.storeName}</span>
                              )}
                            </div>

                            {/* Store Spend / Add Total */}
                            {trackSpend && (
                              <div className="flex items-center gap-2">
                                {store.totalCents !== null && store.totalCents > 0 ? (
                                  <span className="text-sm font-extrabold text-[#0b5a3c] bg-[#d9efe2] px-2.5 py-1 rounded-lg">
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
                          
                          <div className="flex flex-col gap-2 border-t-2 border-[#e3efe7] pt-3">
                            {storeItems.map((item, index) => {
                              const isTracked = item.trackHabit;
                              const normalizedItemName = item.name.trim().toLowerCase();
                              const activeDocId = activeListItems[normalizedItemName];
                              const isAdded = !!activeDocId;

                              return (
                                <div key={`${item.itemId}-${index}`} className="flex items-center justify-between py-1.5 gap-2">
                                  {/* TYPOGRAPHY SPECIFICATION: Courier New, Bold 700, Uppercase, Tracking 0.05em, 15px, Line-height 1.25, Color #111827 */}
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
                                      <span className="material-symbols-outlined text-[16px] font-bold">
                                        {isAdded ? 'check' : 'add'}
                                      </span>
                                    </button>

                                    {/* Status Badges: Tracked / 1-Time Reversible Toggles */}
                                    {isTracked ? (
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); handleToggleTracking(run.id, item.itemId, true); }}
                                          className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200 shadow-2xs transition-colors flex items-center gap-1.5 whitespace-nowrap active:scale-95"
                                        >
                                          <span className="material-symbols-outlined text-[14px]">track_changes</span> Tracked
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); handleToggleTracking(run.id, item.itemId, false); }}
                                          className="text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg border border-amber-200 shadow-2xs transition-colors flex items-center gap-1.5 whitespace-nowrap active:scale-95"
                                        >
                                          <span className="material-symbols-outlined text-[14px]">event_busy</span> 1-Time
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
                    <div className="p-4 bg-[#f3faf5] border-t border-[#d6e8dc] flex items-center justify-between gap-3">
                      <button 
                        type="button"
                        onClick={() => handleDeleteRun(run.id)}
                        className="w-12 h-11 flex items-center justify-center rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 shadow-sm active:scale-95 transition-all shrink-0"
                        aria-label="Delete Run"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>

                      {trackSpend && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditSpend(run, e)}
                          className="px-4 h-11 bg-white hover:bg-emerald-50 text-[#0a7a52] border border-[#d6e8dc] font-bold text-sm rounded-xl shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
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
              <span className="text-xl font-extrabold text-emerald-800">
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