import { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { AddForm } from '../components/AddForm';
import { ItemCard } from '../components/ItemCard';
import { EditModal } from '../components/EditModal';
import { Toast } from '../components/Toast';
import { autoTagItem } from '../tagger';
import { STORE_OPTIONS, getItemIcon, CATEGORIES } from '../constants';
import { Icon } from '@iconify/react';
import { db } from '../firebase';
import {
  collection, onSnapshot, addDoc, doc, updateDoc,
  deleteDoc, getDoc, setDoc
} from 'firebase/firestore';

interface GroceryItem {
  id: string;
  name: string;
  category: string;
  store: string;
  inCart: boolean;
  createdAt?: string;
}

const isDuplicateItem = (newItem: string, existingItem: string) => {
  const a = newItem.trim().toLowerCase();
  const b = existingItem.trim().toLowerCase();

  if (a === b) return true;
  if (a + 's' === b || b + 's' === a) return true;
  if (a + 'es' === b || b + 'es' === a) return true;
  if (a.replace(/y$/, 'ies') === b || b.replace(/y$/, 'ies') === a) return true;

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

  const [habitSearchQuery, setHabitSearchQuery] = useState('');
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  const [authLoading, setAuthLoading] = useState(true);
  const [isHabitBannerVisible, setIsHabitBannerVisible] = useState(false);

  const [hasDismissedReminder, setHasDismissedReminderState] = useState(() => {
    return sessionStorage.getItem('cartReminderDismissed') === 'true';
  });

  const setHasDismissedReminder = (value: boolean) => {
    setHasDismissedReminderState(value);
    if (value) {
      sessionStorage.setItem('cartReminderDismissed', 'true');
    } else {
      sessionStorage.removeItem('cartReminderDismissed');
    }
  };

  const handleDismissSuggestion = (itemName: string) => {
    setDismissedSuggestions(prev => {
      const newSet = new Set(prev);
      newSet.add(itemName.toLowerCase());
      return newSet;
    });
  };

  const handleDismissHabitBanner = async () => {
    setIsHabitBannerVisible(false);
    try {
      const settingsRef = doc(db, 'settings', 'habitBanner');
      await setDoc(settingsRef, { isVisible: false }, { merge: true });
    } catch (error) {
      console.warn('Failed to save habit banner state to Firestore:', error);
    }
  };

  useEffect(() => {
    const fetchUiSettings = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'habitBanner');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          setIsHabitBannerVisible(data.isVisible !== false);
        } else {
          setIsHabitBannerVisible(true);
        }
      } catch (error) {
        console.warn('Database read failed for UI settings. Defaulting to banner visible.', error);
        setIsHabitBannerVisible(true);
      } finally {
        setAuthLoading(false);
      }
    };

    fetchUiSettings();

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

    let learnedCat = null;
    try {
      const prefRef = doc(db, 'preferences', nameKey);
      const prefSnap = await getDoc(prefRef);
      learnedCat = prefSnap.exists() ? prefSnap.data().category : null;
    } catch (error) {
      console.warn('Database read failed. Defaulting to auto-tagger.');
    }

    const { category: autoCat, store } = autoTagItem(newItemName);
    try {
      await addDoc(collection(db, 'items'), {
        name: newItemName.trim(),
        category: learnedCat || autoCat,
        store,
        inCart: false,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      setToastMessage('Failed to add item. Check network connection or database permissions.');
    }
  };

  const handleToggleCart = async (id: string, currentState: boolean) => {
    await updateDoc(doc(db, 'items', id), { inCart: !currentState });
    setToastMessage(!currentState ? 'Moved to Cart' : 'Moved back to List');
    setHasDismissedReminder(true);
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
    const checkoutTime = new Date().toISOString();

    await addDoc(collection(db, 'purchaseHistory'), {
      date: checkoutTime,
      items: cartItems
    });

    for (const item of cartItems) {
      const nameKey = item.name.toLowerCase().trim();
      await setDoc(doc(db, 'preferences', nameKey), {
        lastPurchasedDate: checkoutTime,
        lastPurchasedStore: item.store || 'Unknown',
        updatedAt: checkoutTime
      }, { merge: true });
      await deleteDoc(doc(db, 'items', item.id));
    }

    setHasDismissedReminder(false);
    setActiveTab('habits');
  };

  const handleAddFromHabits = async (habit: any) => {
    await addDoc(collection(db, 'items'), {
      name: habit.name,
      category: habit.category,
      store: habit.store,
      inCart: false,
      createdAt: new Date().toISOString()
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

  const habitsDashboardData = useMemo(() => {
    const itemHistory: Record<string, { itemData: GroceryItem, history: {date: number, store: string}[], count: number }> = {};

    purchaseHistory.forEach(order => {
      if (!order.date || !order.items) return;
      const orderTime = new Date(order.date).getTime();

      order.items.forEach((item: GroceryItem) => {
        const key = (item.name || '').toLowerCase();
        if (!itemHistory[key]) {
          itemHistory[key] = { itemData: item, history: [], count: 0 };
        }
        itemHistory[key].history.push({
          date: orderTime,
          store: item.store || 'Unknown'
        });
        itemHistory[key].count += 1;
      });
    });

    const now = new Date().getTime();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    const dashboard = Object.values(itemHistory).map(record => {
      let daysSinceLast = null;
      let status = 'Need Data';
      let progressPercent = 0;
      let lastPurchasedStore = 'Unknown';

      const itemNameKey = record.itemData.name.toLowerCase();
      let effectiveInterval = DEFAULT_VELOCITY[itemNameKey] || null;

      if (record.history.length >= 2) {
        const sortedHistory = [...record.history].sort((a, b) => a.date - b.date);
        let totalIntervalMs = 0;
        for (let i = 1; i < sortedHistory.length; i++) {
          totalIntervalMs += (sortedHistory[i].date - sortedHistory[i - 1].date);
        }
        effectiveInterval = (totalIntervalMs / (sortedHistory.length - 1)) / MS_PER_DAY;
      }

      if (record.history.length > 0) {
        const sortedHistory = [...record.history].sort((a, b) => a.date - b.date);
        const lastPurchase = sortedHistory[sortedHistory.length - 1];

        lastPurchasedStore = lastPurchase.store;
        daysSinceLast = (now - lastPurchase.date) / MS_PER_DAY;

        if (effectiveInterval) {
          progressPercent = Math.min((daysSinceLast / effectiveInterval) * 100, 100);
          if (daysSinceLast >= (effectiveInterval * 0.9)) {
            status = 'Restock Soon';
          } else {
            status = 'Stocked';
          }
        }
      }

      return {
        ...record.itemData,
        totalPurchases: record.count,
        avgIntervalDays: effectiveInterval ? Math.round(effectiveInterval) : null,
        daysSinceLast: daysSinceLast !== null ? Math.round(daysSinceLast) : null,
        lastPurchasedStore,
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

      if (dismissedSuggestions.has(itemNameKey)) return;

      let effectiveInterval = DEFAULT_VELOCITY[itemNameKey] || null;

      if (record.dates.length >= 2) {
        const sortedDates = [...record.dates].sort((a, b) => a - b);
        let totalIntervalMs = 0;
        for (let i = 1; i < sortedDates.length; i++) {
          totalIntervalMs += (sortedDates[i] - sortedDates[i - 1]);
        }
        const rawIntervalDays = (totalIntervalMs / (sortedDates.length - 1)) / MS_PER_DAY;
        effectiveInterval = Math.max(rawIntervalDays, 3);
      }

      if (record.dates.length > 0 && effectiveInterval) {
        const sortedDates = [...record.dates].sort((a, b) => a - b);
        const lastPurchaseTime = sortedDates[sortedDates.length - 1];
        const daysSinceLast = (now - lastPurchaseTime) / MS_PER_DAY;
        if (daysSinceLast >= (effectiveInterval * 0.9) && daysSinceLast > 2) {
          const alreadyOnList = items.some(i => i.name.toLowerCase() === record.itemData.name.toLowerCase());
          if (!alreadyOnList) {
            suggestions.push(record.itemData);
          }
        }
      }
    });
    return suggestions;
  }, [purchaseHistory, items, dismissedSuggestions]);

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>

      {cartTabItems.length > 0 && !hasDismissedReminder && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-fade-in">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl shadow-xl overflow-hidden p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-red-600">shopping_cart_checkout</span>
              </div>
              <div className="flex-1">
                <h3 className="font-headline font-bold text-red-900 text-lg">Unfinished Checkout</h3>
                <p className="text-red-700 text-sm mt-0.5 leading-tight">
                  You left {cartTabItems.length} items in your cart.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setHasDismissedReminder(true);
                      setActiveTab('cart');
                    }}
                    className="flex-1 bg-red-600 text-white font-bold py-2 rounded-xl text-sm active:scale-95 transition-transform"
                  >
                    View Cart
                  </button>
                  <button
                    onClick={() => setHasDismissedReminder(true)}
                    className="flex-1 bg-red-100 text-red-800 font-bold py-2 rounded-xl text-sm active:scale-95 transition-transform"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full flex flex-col gap-6 pb-20 mt-4">

        {activeTab === 'list' && (
          <>
            <AddForm onAddItem={handleAddItem} />

            {suggestedReplenishments.length > 0 && (
              <div className="mb-6 p-4 bg-white/50 backdrop-blur-md border border-primary/10 rounded-2xl shadow-[0_4px_20px_-4px_rgba(23,106,33,0.05)]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                  <h3 className="font-headline font-bold text-slate-800 tracking-tight">You might be running out of:</h3>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {suggestedReplenishments.map(item => (
                    <div
                      key={`suggest-${item.name}`}
                      className="flex items-center bg-transparent rounded-full border border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all"
                    >
                      <button
                        onClick={() => handleAddFromHabits(item)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-slate-700 whitespace-nowrap"
                      >
                        <Icon icon={getItemIcon(item.name)} className="text-lg" />
                        {item.name}
                        <span className="material-symbols-outlined text-[14px] text-primary/60 ml-0.5">add_circle</span>
                      </button>
                      <button
                        onClick={() => handleDismissSuggestion(item.name)}
                        className="pr-3 pl-1 py-2 text-slate-400 hover:text-red-500 transition-colors flex items-center"
                        aria-label="Dismiss suggestion"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
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
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {Object.keys(groupedByStore).sort().map((storeName) => {
                  const itemsInStore = groupedByStore[storeName];
                  const officialStore = STORE_OPTIONS.find(s => s.name.toLowerCase() === storeName.toLowerCase());

                  const storeHeader = officialStore?.imageLogo ? (
                    <div className="flex items-center px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm">
                      <img
                        src={officialStore.imageLogo}
                        alt={storeName}
                        className="h-5 sm:h-6 max-w-[100px] sm:max-w-[120px] object-contain object-left"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <div className="ml-auto bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md flex items-center justify-center">
                        <span className="text-xs font-bold">{itemsInStore.length}</span>
                      </div>
                    </div>
                  ) : (
                    <div className={`flex items-center px-4 py-3 rounded-xl border shadow-sm font-headline font-bold uppercase tracking-wider text-sm ${officialStore?.color || 'bg-white text-slate-600 border-slate-200'}`}>
                      {officialStore?.logo || storeName}
                      <div className="ml-auto bg-black/5 px-2.5 py-1 rounded-md flex items-center justify-center">
                        <span className="text-xs font-bold">{itemsInStore.length}</span>
                      </div>
                    </div>
                  );
                  const categoryOrder = CATEGORIES.reduce((acc, cat, index) => {
                    acc[cat.name] = index;
                    return acc;
                  }, {} as Record<string, number>);
                  const sortedItems = [...itemsInStore].sort((a, b) => {
                    const orderA = categoryOrder[a.category || ''] ?? 99;
                    const orderB = categoryOrder[b.category || ''] ?? 99;
                    return orderA - orderB;
                  });

                  return (
                    <div key={storeName} className="mb-6 flex flex-col gap-3">
                      {storeHeader}
                      <div className="flex flex-col gap-2">
                        {sortedItems.map((item: GroceryItem) => (
                          <ItemCard
                            key={item.id}
                            id={item.id}
                            name={item.name}
                            category={item.category || 'Unknown'}
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

        {activeTab === 'cart' && (
          <div className="flex flex-col gap-3 mt-2">
            <h2 className="text-2xl font-headline font-bold text-on-surface mb-4">Ready for Checkout</h2>
            {cartTabItems.map((item: GroceryItem) => (
              <ItemCard
                key={item.id}
                id={item.id}
                name={item.name}
                category={item.category || 'Unknown'}
                inCart={item.inCart}
                viewMode="cart"
                onToggleCart={handleToggleCart}
                onDelete={handleDeleteItem}
              />
            ))}
            <button
              onClick={handleCompletePurchase}
              className="mt-6 w-full bg-[#d3e3d8] text-[#174525] font-headline font-bold py-4 rounded-xl shadow-sm border border-[#b8d0c0] hover:bg-[#c2d6cb] transition-all flex justify-center items-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-xl">check_circle</span>
              Complete Purchase
            </button>
          </div>
        )}

        {/* UPDATED HABITS TAB WITH HARDENED LOADING & CLOUD-SYNC BANNER */}
        {activeTab === 'habits' && (
          authLoading ? (
            <div className="w-full flex items-center justify-center py-20 animate-fade-in">
              <div className="flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
                <p className="text-sm text-slate-500 font-medium">Loading habit analytics...</p>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-8 pb-24 animate-fade-in">
              {/* CLOUD-SYNC INFORMATIONAL BANNER */}
              {isHabitBannerVisible && (
                <div className="relative overflow-hidden bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 border border-emerald-200/80 rounded-2xl p-4 shadow-sm animate-fade-in">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-2xl">insights</span>
                      </div>
                      <div>
                        <h3 className="font-headline font-bold text-slate-900 text-base flex items-center gap-2">
                          Predictive Habit Insights
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200/80 text-emerald-800 px-2 py-0.5 rounded-full">
                            Smart AI
                          </span>
                        </h3>
                        <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                          Our predictive algorithm estimates purchase velocity to help you restock on time. Standard estimates are used initially and personalized automatically after two identical purchases.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleDismissHabitBanner}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-black/5 rounded-lg transition-colors shrink-0"
                      aria-label="Dismiss banner"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                </div>
              )}

              <section>
                <div className="flex flex-col gap-4 mb-6">
                  <h2 className="text-xl font-headline font-bold text-on-surface">Habits Dashboard</h2>

                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input
                      type="text"
                      placeholder="Find item history..."
                      value={habitSearchQuery}
                      onChange={(e) => setHabitSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow"
                    />
                    {habitSearchQuery && (
                      <button
                        onClick={() => setHabitSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {habitsDashboardData
                    .filter(habit => habit.name.toLowerCase().includes(habitSearchQuery.toLowerCase().trim()))
                    .map((habit, index) => (
                      <div key={`${habit.id}-${index}`} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="flex justify-between items-center mb-5">
                          <h3 className="font-bold text-slate-800 capitalize">{habit.name}</h3>

                          {/* INJECTED INTERACTIVE BUTTON */}
                          <button
                            onClick={() => {
                              const isAlreadyOnList = listTabItems.some(i => i.name.toLowerCase() === habit.name.toLowerCase());
                              if (!isAlreadyOnList) {
                                handleAddFromHabits(habit);
                              }
                            }}
                            disabled={listTabItems.some(i => i.name.toLowerCase() === habit.name.toLowerCase())}
                            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-md transition-all active:scale-95 ${
                              listTabItems.some(i => i.name.toLowerCase() === habit.name.toLowerCase())
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : habit.status === 'Restock Soon'
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200 shadow-sm'
                                  : habit.status === 'Need Data'
                                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 shadow-sm'
                                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-sm'
                            }`}
                            aria-label={`Add ${habit.name} to list`}
                          >
                            {listTabItems.some(i => i.name.toLowerCase() === habit.name.toLowerCase())
                              ? 'Added to List'
                              : habit.status}

                            {listTabItems.some(i => i.name.toLowerCase() === habit.name.toLowerCase()) ? (
                              <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                            ) : (
                              <span className="material-symbols-outlined text-[16px] font-bold">add</span>
                            )}
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm text-slate-600 mb-3">
                          <div>
                            <span className="block text-xs text-slate-400">Purchases</span>
                            <span className="font-medium">{habit.totalPurchases}</span>
                          </div>
                          <div>
                            <span className="block text-xs text-slate-400">Avg Cycle</span>
                            <span className="font-medium">{habit.avgIntervalDays ? `${habit.avgIntervalDays}d` : '--'}</span>
                          </div>
                          <div>
                            <span className="block text-xs text-slate-400">Last Bought</span>
                            <span className="font-medium">{habit.daysSinceLast !== null ? `${habit.daysSinceLast}d ago` : '--'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100 mt-2">
                          <span className="text-xs text-slate-400">Last bought from:</span>
                          <span className="text-xs font-medium text-slate-700 capitalize">
                            {habit.lastPurchasedStore}
                          </span>
                        </div>

                        <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              habit.status === 'Restock Soon' ? 'bg-red-500' :
                              habit.status === 'Need Data' ? 'bg-amber-400' :
                              'bg-emerald-500'
                            }`}
                            style={{ width: `${habit.progressPercent}%` }}
                          />
                        </div>
                      </div>
                  ))}

                  {habitsDashboardData.length === 0 && (
                    <p className="text-sm text-on-surface-variant text-center py-8">Complete a purchase to generate habit data.</p>
                  )}

                  {habitsDashboardData.length > 0 &&
                   habitSearchQuery &&
                   habitsDashboardData.filter(h => h.name.toLowerCase().includes(habitSearchQuery.toLowerCase().trim())).length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-8 bg-white border border-slate-200 rounded-xl shadow-sm">
                      No purchase history found for "{habitSearchQuery}"
                    </p>
                  )}
                </div>
              </section>
            </div>
          )
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
