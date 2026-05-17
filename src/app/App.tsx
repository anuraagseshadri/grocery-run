import { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { AddForm } from '../components/AddForm';
import { ItemCard } from '../components/ItemCard';
import { EditModal } from '../components/EditModal';
import { Toast } from '../components/Toast';
import { autoTagItem } from '../tagger';
import { STORE_OPTIONS, getItemIcon, CATEGORIES } from '../constants';
import { Logo } from '../components/Logo';
import { Icon } from '@iconify/react';
import { db } from '../firebase';

import { 
  collection, onSnapshot, addDoc, doc, updateDoc, 
  deleteDoc, getDoc, setDoc 
} from 'firebase/firestore';

const GroceryRunLogo = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg viewBox="0 0 256 256" className={className} xmlns="http://www.w3.org/2000/svg">
    <g transform="rotate(15 128 128)">
      <rect x="135" y="35" width="42" height="95" rx="8" fill="#8b5e3c" />
      <circle cx="85" cy="85" r="28" fill="#ef4444" />
      <path d="M 85 58 C 95 58, 102 45, 102 45 C 90 45, 85 58, 85 58 Z" fill="#176a21" />
      <path d="M 105 40 Q 135 40, 135 85" fill="none" stroke="#facc15" strokeWidth="18" strokeLinecap="round" />
      <path d="M 64 200 L 192 200 L 204 96 L 160 80 L 128 96 L 96 80 L 52 96 Z" fill="#D2A679" />
    </g>
  </svg>
);

interface GroceryItem {
  id: string;
  name: string;
  category: string;
  icon: string;
  store: string;
  inCart: boolean;
  createdAt?: string;
}

const isDuplicateItem = (newItem: string, existingItem: string) => {
  const a = newItem.trim().toLowerCase();
  const b = existingItem.trim().toLowerCase();
  
  // 1. Exact match check
  if (a === b) return true;
  
  // 2. Plural checks
  if (a + 's' === b || b + 's' === a) return true;
  if (a + 'es' === b || b + 'es' === a) return true;
  if (a.replace(/y$/, 'ies') === b || b.replace(/y$/, 'ies') === a) return true; 

  // 3. Synonym Engine (Treats these pairs as the exact same item)
  const synonyms = [
    ['coriander', 'cilantro'],
    ['eggplant', 'aubergine'],
    ['zucchini', 'courgette'],
    ['scallion', 'green onion']
  ];

  for (const group of synonyms) {
    if (group.includes(a) && group.includes(b)) return true;
  }

  return false;
};

// PREDICTIVE ENGINE: Cold Start Dictionary
const DEFAULT_VELOCITY: Record<string, number> = {
  'milk': 7,
  'eggs': 14,
  'bread': 7,
  'bananas': 5,
  'coffee': 30,
  'olive oil': 60,
  'paper towels': 30,
  'laundry detergent': 45
};

export default function App() {
  const [activeTab, setActiveTab] = useState('list');
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeItems = onSnapshot(collection(db, 'items'), (snapshot) => {
      const liveItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroceryItem));
      setItems(liveItems);
    });

    const unsubscribeHistory = onSnapshot(collection(db, 'purchaseHistory'), (snapshot) => {
      const liveHistory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPurchaseHistory(liveHistory);
    });

    return () => {
      unsubscribeItems();
      unsubscribeHistory();
    };
  }, []);

  const handleAddItem = async (newItemName: string) => {
    const nameKey = newItemName.toLowerCase().trim();
    const existingMatch = items.find(item => isDuplicateItem(newItemName, item.name));

    if (existingMatch) {
      setToastMessage(`${existingMatch.name} is already in your list`);
      return; 
    }

    const prefRef = doc(db, 'preferences', nameKey);
    const prefSnap = await getDoc(prefRef);
    const learnedCat = prefSnap.exists() ? prefSnap.data().category : null;
    const { category: autoCat, icon, store } = autoTagItem(newItemName);

    await addDoc(collection(db, 'items'), {
      name: newItemName.trim(),
      category: learnedCat || autoCat, 
      icon, 
      store,
      inCart: false, 
      createdAt: new Date().toISOString()
    });
  };

  const handleToggleCart = async (id: string, currentState: boolean) => {
    await updateDoc(doc(db, 'items', id), { inCart: !currentState });
    setToastMessage(!currentState ? "Moved to Cart" : "Moved back to List");
  };

  const handleDeleteItem = async (id: string) => {
    await deleteDoc(doc(db, 'items', id));
  };

  const handleUpdateItem = async (id: string, updates: Partial<GroceryItem>) => {
    if (updates.category && updates.name) {
      const nameKey = updates.name.toLowerCase().trim();
      await setDoc(doc(db, 'preferences', nameKey), {
        category: updates.category,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    await updateDoc(doc(db, 'items', id), updates);
    setEditingItem(null); 
  };

  const handleForgetPreference = async (name: string) => {
    const nameKey = name.toLowerCase().trim();
    await deleteDoc(doc(db, 'preferences', nameKey));
    setToastMessage(`Reset default categorization for ${name}`);
    setEditingItem(null);
  };

  const handleCompletePurchase = async () => {
    const cartItems = items.filter(item => item.inCart);
    await addDoc(collection(db, 'purchaseHistory'), {
      date: new Date().toISOString(),
      items: cartItems
    });
    for (const item of cartItems) {
      await deleteDoc(doc(db, 'items', item.id));
    }
    setActiveTab('habits');
  };

  const handleAddFromHabits = async (habit: any) => {
    await addDoc(collection(db, 'items'), {
      name: habit.name, category: habit.category, icon: habit.icon, store: habit.store,
      inCart: false, createdAt: new Date().toISOString()
    });
    setToastMessage(`Added ${habit.name} to List`);
    setActiveTab('list'); 
  };
  
  const listTabItems = items;
  const cartTabItems = items.filter(item => item.inCart);

  const groupedByStore = listTabItems.reduce((groups, item) => {
    const rawStore = item.store?.trim() || 'Other';
    const officialStore = STORE_OPTIONS.find(
      s => s.name.toLowerCase() === rawStore.toLowerCase()
    );
    const storeName = officialStore ? officialStore.name : 'Other';

    if (!groups[storeName]) { groups[storeName] = []; }
    groups[storeName].push(item);
    return groups;
  }, {} as Record<string, GroceryItem[]>);

  // ===================== DASHBOARD DATA ENGINE =====================
  const habitsDashboardData = useMemo(() => {
    const itemHistory: Record<string, { itemData: GroceryItem, dates: number[], count: number }> = {};
    purchaseHistory.forEach(order => {
      if (!order.date || !order.items) return;
      const orderTime = new Date(order.date).getTime();

      order.items.forEach((item: GroceryItem) => {
        const key = (item.name || '').toLowerCase();
        if (!itemHistory[key]) {
          itemHistory[key] = { itemData: item, dates: [], count: 0 };
        }
        itemHistory[key].dates.push(orderTime);
        itemHistory[key].count += 1; 
      });
    });

    const now = new Date().getTime();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    const dashboard = Object.values(itemHistory).map(record => {
      let daysSinceLast = null;
      let status = 'Need Data';
      let progressPercent = 0;
      const itemNameKey = record.itemData.name.toLowerCase();
      
      let effectiveInterval = DEFAULT_VELOCITY[itemNameKey] || null;

      if (record.dates.length >= 2) {
        const sortedDates = [...record.dates].sort((a, b) => a - b);
        let totalIntervalMs = 0;
        
        for (let i = 1; i < sortedDates.length; i++) {
          totalIntervalMs += (sortedDates[i] - sortedDates[i - 1]);
        }
        effectiveInterval = (totalIntervalMs / (sortedDates.length - 1)) / MS_PER_DAY;
      }

      if (record.dates.length > 0 && effectiveInterval) {
        const sortedDates = [...record.dates].sort((a, b) => a - b);
        const lastPurchaseTime = sortedDates[sortedDates.length - 1];
        daysSinceLast = (now - lastPurchaseTime) / MS_PER_DAY;
        progressPercent = Math.min((daysSinceLast / effectiveInterval) * 100, 100);

        if (daysSinceLast >= (effectiveInterval * 0.9)) {
          status = 'Restock Soon';
        } else {
          status = 'Stocked';
        }
      }

      return {
        ...record.itemData,
        totalPurchases: record.count,
        avgIntervalDays: effectiveInterval ? Math.round(effectiveInterval) : null,
        daysSinceLast: daysSinceLast !== null ? Math.round(daysSinceLast) : null,
        status,
        progressPercent
      };
    });

    return dashboard.sort((a, b) => {
      if (a.status === 'Restock Soon' && b.status !== 'Restock Soon') return -1;
      if (b.status === 'Restock Soon' && a.status !== 'Restock Soon') return 1;
      return b.progressPercent - a.progressPercent;
    });
  }, [purchaseHistory]);


  // ===================== REPLENISHMENT ENGINE =====================
  const suggestedReplenishments = useMemo(() => {
    const itemHistory: Record<string, { itemData: GroceryItem, dates: number[] }> = {};
    
    purchaseHistory.forEach(order => {
      if (!order.date || !order.items) return;
      const orderTime = new Date(order.date).getTime(); 
      
      order.items.forEach((item: GroceryItem) => {
        const key = (item.name || '').toLowerCase();
        if (!itemHistory[key]) {
          itemHistory[key] = { itemData: item, dates: [] };
        }
        itemHistory[key].dates.push(orderTime);
      });
    });

    const now = new Date().getTime();
    const suggestions: GroceryItem[] = [];
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    Object.values(itemHistory).forEach(record => {
      const itemNameKey = record.itemData.name.toLowerCase();
      let effectiveInterval = DEFAULT_VELOCITY[itemNameKey] || null;

      if (record.dates.length >= 2) {
        const sortedDates = [...record.dates].sort((a, b) => a - b);
        let totalIntervalMs = 0;
        
        for (let i = 1; i < sortedDates.length; i++) {
          totalIntervalMs += (sortedDates[i] - sortedDates[i - 1]);
        }
        effectiveInterval = (totalIntervalMs / (sortedDates.length - 1)) / MS_PER_DAY;
      }

      if (record.dates.length > 0 && effectiveInterval) {
        const sortedDates = [...record.dates].sort((a, b) => a - b);
        const lastPurchaseTime = sortedDates[sortedDates.length - 1];
        const daysSinceLast = (now - lastPurchaseTime) / MS_PER_DAY;

        if (daysSinceLast >= (effectiveInterval * 0.9)) {
          const alreadyOnList = items.some(i => i.name.toLowerCase() === record.itemData.name.toLowerCase());
          if (!alreadyOnList) {
            suggestions.push(record.itemData);
          }
        }
      }
    });

    return suggestions;
  }, [purchaseHistory, items]);

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="w-full flex flex-col gap-6 pb-20">
        
        {activeTab === 'list' && (
          <>
            <AddForm onAddItem={handleAddItem} />

            {/* REPLENISHMENT NOTIFICATION BANNER */}
            {suggestedReplenishments.length > 0 && (
              <div className="mb-6 p-4 bg-white/50 backdrop-blur-md border border-primary/10 rounded-2xl shadow-[0_4px_20px_-4px_rgba(23,106,33,0.05)]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                  <h3 className="font-headline font-bold text-slate-800 tracking-tight">You might be running out of:</h3>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {suggestedReplenishments.map(item => (
                    <button 
                      key={`suggest-${item.name}`}
                      onClick={() => handleAddFromHabits(item)}
                      className="whitespace-nowrap flex items-center gap-1.5 px-4 py-2 bg-transparent rounded-full border border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-sm font-bold text-slate-700"
                    >
                      <Icon icon={getItemIcon(item.name)} className="text-lg" />
                      {item.name}
                      <span className="material-symbols-outlined text-[14px] text-primary/60 ml-0.5">add_circle</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {listTabItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-16 pb-8 text-center px-4 animate-fade-in">
                <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">shopping_cart</span>
                </div>
                <h3 className="text-xl font-headline font-bold text-on-surface mb-2">Your list is empty</h3>
                <p className="text-on-surface-variant max-w-[240px] leading-relaxed text-sm">
                  Add some items above or check your habits tab for regular purchases.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {Object.keys(groupedByStore).sort().map((storeName) => {
                  const itemsInStore = groupedByStore[storeName];
                  const brandProfile = STORE_OPTIONS.find(s => s.name === storeName) || STORE_OPTIONS.find(s => s.name === 'Other');
                  
                  // NEW: Create a strict rendering order based on your master CATEGORIES array
                  const categoryOrder = CATEGORIES.reduce((acc, cat, index) => {
                    acc[cat.name] = index;
                    return acc;
                  }, {} as Record<string, number>);

                  // NEW: Sub-sort the items in this specific store so identical badges stack together
                  const sortedItems = [...itemsInStore].sort((a, b) => {
                    // If a category isn't found, push it to the bottom (99)
                    const orderA = categoryOrder[a.category || ''] ?? 99;
                    const orderB = categoryOrder[b.category || ''] ?? 99;
                    return orderA - orderB;
                  });

                  return (
                    <div key={storeName} className="mb-6 flex flex-col gap-3">
                      
                      {/* STORE HEADER */}
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${brandProfile?.color || 'bg-white border-slate-200 text-slate-600'}`}>
                        {brandProfile?.imageLogo ? (
                          <img 
                            src={brandProfile.imageLogo} 
                            alt={`${storeName} logo`} 
                            className="h-6 w-16 object-contain object-left" 
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <span className={`font-black italic tracking-tighter uppercase text-sm ${brandProfile?.imageLogo ? 'hidden' : ''}`}>
                          {brandProfile?.logo || storeName}
                        </span>
                        <div className="ml-auto bg-black/5 px-2 py-0.5 rounded-md">
                          <span className="text-xs font-bold text-current">{itemsInStore.length}</span>
                        </div>
                      </div>

                      {/* ITEMS LIST */}
                      <div className="flex flex-col gap-2">
                        {sortedItems.map((item: GroceryItem) => (
                          <ItemCard 
                            key={item.id} 
                            id={item.id} 
                            name={item.name} 
                            category={item.category || 'Unknown'} 
                            icon={item.icon || 'shopping_bag'} 
                            inCart={item.inCart} 
                            viewMode="list" 
                            onToggleCart={handleToggleCart} 
                            onDelete={handleDeleteItem} 
                            onEdit={() => setEditingItem(item)} 
                          />
                        ))}
                      </div>
                      
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ===================== CART TAB ===================== */}
        {activeTab === 'cart' && (
          <div className="flex flex-col gap-3 mt-2">
            <h2 className="text-2xl font-headline font-bold text-on-surface mb-4">Ready for Checkout</h2>
            {cartTabItems.length === 0 ? (
              <p className="text-on-surface-variant text-sm bg-surface-container p-4 rounded-xl">
                Cart is empty. Tap the circles in your list to move items here.
              </p>
            ) : (
              <>
                {cartTabItems.map((item: GroceryItem) => (
                  <ItemCard 
                    key={item.id} 
                    id={item.id} 
                    name={item.name} 
                    category={item.category || 'Unknown'} 
                    icon={item.icon || 'shopping_bag'} 
                    inCart={item.inCart} 
                    viewMode="cart" 
                    onToggleCart={handleToggleCart} 
                    onDelete={handleDeleteItem} 
                  />
                ))}
                <button 
                  onClick={handleCompletePurchase}
                  className="mt-6 w-full bg-[#d3e3d8] text-[#174525] font-headline font-bold py-4 rounded-xl shadow-sm border border-[#b8d0c0] hover:bg-[#c2d6cb] transition-all flex justify-center items-center gap-2"
                >
                  <span className="material-symbols-outlined text-xl">shopping_bag</span>
                  Complete Purchase
                </button>
              </>
            )}
          </div>
        )}

        {/* ===================== HABITS TAB ===================== */}
        {activeTab === 'habits' && (
          <div className="w-full flex flex-col gap-8 pb-24 animate-fade-in">
            {/* SECTION 1: RECOMMENDED RESTOCKS */}
            <section>
              <div className="mb-4 px-1">
                <h2 className="text-xl font-headline font-bold text-on-surface mb-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">auto_awesome</span>
                  Recommended Restocks
                </h2>
                <p className="text-sm text-on-surface-variant">Items likely running out based on your velocity.</p>
              </div>
              <div className="flex flex-col gap-3">
                {habitsDashboardData.filter(item => item.status === 'Restock Soon').length === 0 ? (
                  <p className="text-on-surface-variant text-sm bg-surface-container p-4 rounded-xl">
                    You're all stocked up on your usuals!
                  </p>
                ) : (
                  habitsDashboardData.filter(item => item.status === 'Restock Soon').map(item => (
                    <div key={`rec-${item.name}`} className="bg-surface-container-low p-4 rounded-2xl flex items-center justify-between border border-primary/20 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Icon icon={getItemIcon(item.name)} className="text-xl drop-shadow-sm" />
                          <span className="font-bold text-on-surface">{item.name}</span>
                        </div>
                        <span className="text-xs font-medium text-primary bg-primary/10 w-fit px-2 py-0.5 rounded-md mt-1">
                          Bought {item.daysSinceLast} days ago
                        </span>
                      </div>
                      <button 
                        onClick={() => handleAddFromHabits(item)}
                        className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md hover:bg-primary/90 transition-transform active:scale-95"
                      >
                        <span className="material-symbols-outlined font-bold">add</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* SECTION 2: ALL HABITS BY CATEGORY */}
            <section>
              <div className="mb-4 px-1">
                <h2 className="text-xl font-headline font-bold text-on-surface mb-1">My Grocery Habits</h2>
                <p className="text-sm text-on-surface-variant">All tracked items.</p>
              </div>

              {Array.from(new Set(habitsDashboardData.map(item => item.category))).map(category => (
                <div key={`cat-${category}`} className="mb-6">
                  <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-3 pl-2">
                    {category}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {habitsDashboardData.filter(item => item.category === category).map(item => (
                      <div key={`all-${item.name}`} className="bg-surface-container-lowest p-3 rounded-xl flex items-center justify-between shadow-sm border border-outline-variant/30">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-surface-container rounded-lg flex items-center justify-center">
                            <Icon icon={getItemIcon(item.name)} className="text-xl" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-on-surface text-sm">{item.name}</span>
                            <span className="text-[11px] text-on-surface-variant">
                              {item.avgIntervalDays ? `Buys every ~${item.avgIntervalDays} days` : 'Need more data'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           {item.status === 'Stocked' && (
                             <div className="w-16 bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                               <div className="bg-primary h-full rounded-full" style={{ width: `${item.progressPercent}%` }}></div>
                             </div>
                           )}
                           <button 
                             onClick={() => handleAddFromHabits(item)}
                             className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors"
                           >
                             <span className="material-symbols-outlined text-[18px]">add</span>
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}
      </div>

      {editingItem && (
        <EditModal 
          item={editingItem} 
          onClose={() => setEditingItem(null)} 
          onSave={handleUpdateItem} 
          onForget={handleForgetPreference}
        />
      )}

      <Toast 
        message={toastMessage || ''} 
        isVisible={!!toastMessage} 
        onClose={() => setToastMessage(null)} 
      />
    </Layout>
  );
}