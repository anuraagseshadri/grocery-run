import { useState, useEffect, useMemo } from 'react';
import { Auth } from '../components/Auth';
import { Layout } from '../components/Layout';
import { AddForm } from '../components/AddForm';
import AddItemForm from '../components/AddItemForm';
import { ItemCard } from '../components/ItemCard';
import { EditModal } from '../components/EditModal';
import { Toast } from '../components/Toast';
import { autoTagItem } from '../tagger';
import { STORE_OPTIONS, getItemIcon, CATEGORIES, getCategoryBgColor, getCategoryIcon } from '../constants';
import { Icon } from '@iconify/react';
import { db, auth, analytics } from '../firebase';
import { Analytics } from '@vercel/analytics/react';
import { logEvent } from 'firebase/analytics';
import { 
  collection, onSnapshot, addDoc, doc, updateDoc, 
  deleteDoc, getDoc, setDoc, query, where 
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

interface GroceryItem {
  id: string;
  name: string;
  category: string;
  store: string;
  inCart: boolean;
  createdAt?: string;
  userId?: string;
  cartedAt?: string | null;
  trackHabit?: boolean;
}

const normalizeItemName = (name: string) => {
  let n = name.trim().toLowerCase();
  if (n.endsWith('ies')) return n.slice(0, -3) + 'y'; 
  if (n.endsWith('oes')) return n.slice(0, -2);       
  if (n.endsWith('s') && !n.endsWith('ss')) return n.slice(0, -1); 
  return n;
};

const isDuplicateItem = (newItem: string, existingItem: string) => {
  const a = normalizeItemName(newItem);
  const b = normalizeItemName(existingItem);
  if (a === b) return true;
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
  useEffect(() => {
    const handleAppInstalled = () => {
      if (analytics) {
        logEvent(analytics, 'pwa_installed', {
          platform: navigator.userAgent,
          timestamp: new Date().toISOString(),
        });
      }
    };
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showStaleCartWarning, setShowStaleCartWarning] = useState(false);

  const [expandedCartStore, setExpandedCartStore] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const [habitSearchQuery, setHabitSearchQuery] = useState('');
  const [habitTab, setHabitTab] = useState<'tracked' | 'untracked'>('tracked');
  const [habitSortFilter, setHabitSortFilter] = useState('urgency');
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  
  const [trackingOverrides, setTrackingOverrides] = useState<Record<string, boolean>>({});
  const [preferences, setPreferences] = useState<Record<string, any>>({});

  const getPrefDocId = (uid: string, nameKey: string) => `${uid}_${nameKey}`;

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

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setPurchaseHistory([]);
      setPreferences({});
      return;
    }

    const unsubscribeItems = onSnapshot(
      query(collection(db, 'items'), where('userId', '==', user.uid)),
      (snapshot) => {
        const liveItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroceryItem));
        setItems(liveItems);
      }
    );

    const unsubscribeHistory = onSnapshot(
      query(collection(db, 'purchaseHistory'), where('userId', '==', user.uid)),
      (snapshot) => {
        const liveHistory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPurchaseHistory(liveHistory);
      }
    );

    const unsubscribePrefs = onSnapshot(collection(db, 'preferences'), (snapshot) => {
      const prefsObj: Record<string, any> = {};
      const prefix = `${user.uid}_`;
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (docSnap.id.startsWith(prefix)) {
          const cleanKey = docSnap.id.slice(prefix.length);
          prefsObj[cleanKey] = data;
        } else if (data.userId === user.uid) {
          prefsObj[docSnap.id] = data;
        }
      });
      setPreferences(prefsObj);
    });

    return () => {
      unsubscribeItems();
      unsubscribeHistory();
      unsubscribePrefs();
    };
  }, [user]);

  const getLatestStoreFromHistory = (nameKey: string): string | null => {
    let latestTime = -1;
    let latestStore: string | null = null;

    purchaseHistory.forEach(order => {
      if (!order.date || !order.items) return;
      const orderTime = new Date(order.date).getTime();
      order.items.forEach((item: GroceryItem) => {
        if (normalizeItemName(item.name || '') === nameKey && item.store && item.store !== 'Unknown') {
          if (orderTime >= latestTime) {
            latestTime = orderTime;
            latestStore = item.store;
          }
        }
      });
    });

    return latestStore;
  };

  const handleAddItem = async (newItemName: string) => {
    if (!user) return;
    
    const nameKey = normalizeItemName(newItemName);
    const existingMatch = items.find(item => isDuplicateItem(newItemName, item.name));

    if (existingMatch) {
      setToastMessage(`${existingMatch.name} is already in your list`);
      return; 
    }

    let learnedCat = preferences[nameKey]?.category || null;
    let learnedTrackHabit = preferences[nameKey]?.trackHabit !== undefined ? preferences[nameKey].trackHabit : true; 
    let learnedStore = preferences[nameKey]?.lastPurchasedStore || getLatestStoreFromHistory(nameKey) || null; 

    if (!learnedStore || !learnedCat) {
      try {
        const prefRef = doc(db, 'preferences', getPrefDocId(user.uid, nameKey));
        const prefSnap = await getDoc(prefRef);
        if (prefSnap.exists()) {
          const data = prefSnap.data();
          learnedCat = learnedCat || data.category;
          learnedStore = learnedStore || data.lastPurchasedStore; 
          if (data.trackHabit !== undefined) {
            learnedTrackHabit = data.trackHabit;
          }
        }
      } catch (error) {
        console.warn("Database read failed. Defaulting to auto-tagger.");
      }
    }
    
    const { category: autoCat, store: autoStore } = autoTagItem(newItemName);
    
    addDoc(collection(db, 'items'), {
      name: newItemName.trim(),
      category: learnedCat || autoCat, 
      store: (learnedStore && learnedStore !== 'Unknown') ? learnedStore : autoStore, 
      inCart: false, 
      trackHabit: learnedTrackHabit,
      userId: user.uid,
      createdAt: new Date().toISOString()
    }).catch(() => setToastMessage("Saved offline. Will sync when connection returns."));

    if (analytics) {
      logEvent(analytics, 'item_added', {
        add_method: 'manual_type',
        item_category: learnedCat || autoCat
      });
    }
  };

  const handleToggleCart = (id: string, currentState: boolean) => {
    const item = items.find(i => i.id === id);
    const itemName = item ? item.name : 'Item';
    
    setToastMessage(!currentState ? `Moved ${itemName} to Cart` : `Moved ${itemName} back to List`);
    setHasDismissedReminder(false); 
    setNowTick(Date.now());

    const payload: Partial<GroceryItem> = { inCart: !currentState };
    payload.cartedAt = !currentState ? new Date().toISOString() : null; 
    updateDoc(doc(db, 'items', id), payload);

    if (analytics && !currentState) {
      logEvent(analytics, 'item_checked');
    }
  };

  const handleDeleteItem = (id: string) => {
    deleteDoc(doc(db, 'items', id));
  };

  const handleUpdateItem = (id: string, updates: Partial<GroceryItem>) => {
    setEditingItem(null); 

    if (user && updates.name) {
      const nameKey = normalizeItemName(updates.name);
      const prefPayload: any = { 
        userId: user.uid,
        updatedAt: new Date().toISOString() 
      };
      if (updates.category) prefPayload.category = updates.category;
      if (updates.store) prefPayload.lastPurchasedStore = updates.store;
      if (updates.trackHabit !== undefined) prefPayload.trackHabit = updates.trackHabit;
      setDoc(doc(db, 'preferences', getPrefDocId(user.uid, nameKey)), prefPayload, { merge: true });
    }
    updateDoc(doc(db, 'items', id), updates);
  };

  const handleToggleTracking = (itemName: string, newTrackState: boolean) => {
    if (!user) return;
    const nameKey = normalizeItemName(itemName);
    
    setTrackingOverrides(prev => ({ ...prev, [nameKey]: newTrackState }));
    setToastMessage(newTrackState ? `${itemName} is now being tracked!` : `${itemName} is no longer being tracked.`);

    setDoc(doc(db, 'preferences', getPrefDocId(user.uid, nameKey)), {
      userId: user.uid,
      trackHabit: newTrackState,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  };

  const handleForgetPreference = (name: string) => {
    if (!user) return;
    const nameKey = normalizeItemName(name);
    
    setToastMessage(`Reset default categorization for ${name}`);
    setEditingItem(null);

    deleteDoc(doc(db, 'preferences', getPrefDocId(user.uid, nameKey)));
  };

  const handleFinishRun = () => {
    if (!user) return;
    const cartItems = items.filter(item => item.inCart);
    if (cartItems.length === 0) return;
    const checkoutTime = new Date().toISOString();

    if (analytics) {
      logEvent(analytics, 'run_completed', {
        total_items: cartItems.length,
        list_type: 'standard'
      });
    }

    setHasDismissedReminder(false);
    setToastMessage(`Run complete. ${cartItems.length === 1 ? 'Item' : 'Items'} added to Habits.`);
    setActiveTab('habits');

    addDoc(collection(db, 'purchaseHistory'), {
      date: checkoutTime,
      userId: user.uid,
      items: cartItems
    });

    for (const item of cartItems) {
      const nameKey = normalizeItemName(item.name);
      const prefPayload: any = {
        userId: user.uid,
        category: item.category,
        lastPurchasedDate: checkoutTime,
        lastPurchasedStore: item.store || 'Other',
        updatedAt: checkoutTime
      };
      if (item.trackHabit !== undefined) {
        prefPayload.trackHabit = item.trackHabit;
      }
      setDoc(doc(db, 'preferences', getPrefDocId(user.uid, nameKey)), prefPayload, { merge: true });
      deleteDoc(doc(db, 'items', item.id));
    }
  };

  const handleAddFromHabits = (habit: any, stayOnTab: boolean = false) => {
    if (!user) return;
    const nameKey = normalizeItemName(habit.name);
    const alreadyOnList = items.some(i => normalizeItemName(i.name) === nameKey);
    if (alreadyOnList) {
      setToastMessage(`${habit.name} is already on your list`);
      return;
    }
    
    setToastMessage(`Added ${habit.name} to List`);
    if (!stayOnTab) setActiveTab('list'); 

    const resolvedStore = 
      (habit.lastPurchasedStore && habit.lastPurchasedStore !== 'Unknown' ? habit.lastPurchasedStore : null) ||
      preferences[nameKey]?.lastPurchasedStore ||
      getLatestStoreFromHistory(nameKey) ||
      habit.store ||
      'Other';

    const resolvedCategory = 
      preferences[nameKey]?.category ||
      habit.category ||
      autoTagItem(habit.name).category;

    addDoc(collection(db, 'items'), {
      name: habit.name, 
      category: resolvedCategory, 
      store: resolvedStore,
      trackHabit: habit.trackHabit !== false,
      userId: user.uid,
      inCart: false, 
      createdAt: new Date().toISOString()
    }).catch(() => setToastMessage("Failed to sync item."));

    if (analytics) {
      logEvent(analytics, 'item_added', {
        add_method: 'predictive',
        item_category: resolvedCategory
      });
    }
  };
  
  const listTabItems = items;
  const cartTabItems = items.filter(item => item.inCart);

  useEffect(() => {
    if (activeTab !== 'cart' || cartTabItems.length === 0) return;
    setNowTick(Date.now());
    const interval = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(interval);
  }, [activeTab, cartTabItems.length]);

  useEffect(() => {
    const checkStaleItems = () => {
      if (cartTabItems.length === 0 || hasDismissedReminder) {
        setShowStaleCartWarning(false);
        return;
      }
      const THREE_HOURS_MS = 10800000; 
      const now = Date.now();
      const hasStale = cartTabItems.some(item => {
        if (!item.cartedAt) return false;
        return (now - new Date(item.cartedAt).getTime()) >= THREE_HOURS_MS;
      });
      setShowStaleCartWarning(hasStale);
    };

    checkStaleItems();
    window.addEventListener('focus', checkStaleItems);
    return () => window.removeEventListener('focus', checkStaleItems);
  }, [cartTabItems, hasDismissedReminder]);

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

  const cartGroupedByStore = useMemo(() => {
    return cartTabItems.reduce((groups, item) => {
      const rawStore = item.store?.trim() || 'Other';
      const officialStore = STORE_OPTIONS.find(
        s => s.name.toLowerCase() === rawStore.toLowerCase()
      );
      const storeName = officialStore ? officialStore.name : 'Other';

      if (!groups[storeName]) { groups[storeName] = []; }
      groups[storeName].push(item);
      return groups;
    }, {} as Record<string, GroceryItem[]>);
  }, [cartTabItems]);

  const cartStoreNames = useMemo(() => Object.keys(cartGroupedByStore).sort(), [cartGroupedByStore]);

  useEffect(() => {
    if (cartStoreNames.length === 0) {
      setExpandedCartStore(null);
    } else if (!expandedCartStore || !cartStoreNames.includes(expandedCartStore)) {
      setExpandedCartStore(cartStoreNames[0]);
    }
  }, [cartStoreNames, expandedCartStore]);

  const cartRunTelemetry = useMemo(() => {
    if (cartTabItems.length === 0) {
      return { isActive: false, isPaused: false, durationLabel: null };
    }

    const validTimestamps = cartTabItems
      .map(i => (i.cartedAt ? new Date(i.cartedAt).getTime() : NaN))
      .filter(t => !isNaN(t));

    if (validTimestamps.length === 0) {
      return { isActive: true, isPaused: false, durationLabel: null };
    }

    const firstCartedTime = Math.min(...validTimestamps);
    const elapsedMs = Math.max(0, nowTick - firstCartedTime);
    const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

    if (elapsedMs >= THREE_HOURS_MS) {
      return { isActive: false, isPaused: true, durationLabel: null };
    }

    const totalMinutes = Math.max(1, Math.round(elapsedMs / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const durationLabel = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return { isActive: true, isPaused: false, durationLabel };
  }, [cartTabItems, nowTick]);

  const habitsDashboardData = useMemo(() => {
    const itemHistory: Record<string, { itemData: GroceryItem, latestOrderTime: number, history: {date: number, store: string}[], count: number, isTracked: boolean }> = {};
    
    purchaseHistory.forEach(order => {
      if (!order.date || !order.items) return;
      const orderTime = new Date(order.date).getTime();

      order.items.forEach((item: GroceryItem) => {
        const rawNameKey = (item.name || '').toLowerCase();
        const normalizedKey = normalizeItemName(rawNameKey); 
        
        let currentTrackState = item.trackHabit !== false;
        if (trackingOverrides[normalizedKey] !== undefined) {
          currentTrackState = trackingOverrides[normalizedKey];
        } else if (preferences[normalizedKey] && preferences[normalizedKey].trackHabit !== undefined) {
          currentTrackState = preferences[normalizedKey].trackHabit;
        } else if (item.trackHabit !== undefined) {
          currentTrackState = item.trackHabit;
        }

        if (!itemHistory[normalizedKey]) {
          itemHistory[normalizedKey] = { itemData: item, latestOrderTime: orderTime, history: [], count: 0, isTracked: currentTrackState };
        } else {
          itemHistory[normalizedKey].isTracked = currentTrackState;
          if (orderTime >= itemHistory[normalizedKey].latestOrderTime) {
            itemHistory[normalizedKey].itemData = item;
            itemHistory[normalizedKey].latestOrderTime = orderTime;
          }
        }
        
        itemHistory[normalizedKey].history.push({ date: orderTime, store: item.store || 'Unknown' });
        itemHistory[normalizedKey].count += 1; 
      });
    });

    const now = new Date().getTime();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    const dashboard = Object.values(itemHistory).map(record => {
      let daysSinceLast = null;
      let status = 'Need Data';
      let progressPercent = 0;
      let lastPurchasedStore = 'Unknown';
      
      const rawNameKey = record.itemData.name.toLowerCase();
      const itemNameKey = normalizeItemName(rawNameKey);
      
      let effectiveInterval = DEFAULT_VELOCITY[itemNameKey] || DEFAULT_VELOCITY[rawNameKey] || null;

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
        lastPurchasedStore = preferences[itemNameKey]?.lastPurchasedStore || lastPurchase.store;
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
        store: lastPurchasedStore !== 'Unknown' ? lastPurchasedStore : record.itemData.store,
        trackHabit: record.isTracked,
        totalPurchases: record.count,
        avgIntervalDays: effectiveInterval ? Math.round(effectiveInterval) : null,
        daysSinceLast: daysSinceLast !== null ? Math.round(daysSinceLast) : null,
        lastPurchasedStore,
        status,
        progressPercent
      };
    });

    return dashboard;
  }, [purchaseHistory, trackingOverrides, preferences]);

  const activeHabitsList = habitTab === 'tracked' 
    ? habitsDashboardData.filter(i => i.trackHabit !== false) 
    : habitsDashboardData.filter(i => i.trackHabit === false);

  const filteredAndSortedHabits = useMemo(() => {
    let result = activeHabitsList.filter(habit => 
      habit.name.toLowerCase().includes(habitSearchQuery.toLowerCase().trim())
    );
    
    result.sort((a, b) => {
      if (habitSortFilter === 'urgency' && habitTab === 'tracked') {
        if (a.status === 'Restock Soon' && b.status !== 'Restock Soon') return -1;
        if (b.status === 'Restock Soon' && a.status !== 'Restock Soon') return 1;
        return b.progressPercent - a.progressPercent;
      } else if (habitSortFilter === 'recent') {
        return (a.daysSinceLast !== null ? a.daysSinceLast : 9999) - (b.daysSinceLast !== null ? b.daysSinceLast : 9999);
      } else if (habitSortFilter === 'frequent') {
        return b.totalPurchases - a.totalPurchases;
      } else if (habitSortFilter === 'az') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
    
    return result;
  }, [activeHabitsList, habitSearchQuery, habitSortFilter, habitTab]);

  const handleHabitTabSwitch = (tab: 'tracked' | 'untracked') => {
    setHabitTab(tab);
    if (tab === 'untracked' && habitSortFilter === 'urgency') {
      setHabitSortFilter('recent');
    }
  };

  const suggestedReplenishments = useMemo(() => {
    const itemHistory: Record<string, { itemData: GroceryItem, latestOrderTime: number, dates: number[], isTracked: boolean }> = {};
    
    purchaseHistory.forEach(order => {
      if (!order.date || !order.items) return;
      const orderTime = new Date(order.date).getTime(); 
      order.items.forEach((item: GroceryItem) => {
        const rawNameKey = (item.name || '').toLowerCase();
        const normalizedKey = normalizeItemName(rawNameKey); 
        
        let currentTrackState = item.trackHabit !== false;
        if (trackingOverrides[normalizedKey] !== undefined) {
          currentTrackState = trackingOverrides[normalizedKey];
        } else if (preferences[normalizedKey] && preferences[normalizedKey].trackHabit !== undefined) {
          currentTrackState = preferences[normalizedKey].trackHabit;
        } else if (item.trackHabit !== undefined) {
          currentTrackState = item.trackHabit;
        }

        if (!itemHistory[normalizedKey]) {
          itemHistory[normalizedKey] = { itemData: item, latestOrderTime: orderTime, dates: [], isTracked: currentTrackState };
        } else {
          itemHistory[normalizedKey].isTracked = currentTrackState;
          if (orderTime >= itemHistory[normalizedKey].latestOrderTime) {
            itemHistory[normalizedKey].itemData = item;
            itemHistory[normalizedKey].latestOrderTime = orderTime;
          }
        }
        itemHistory[normalizedKey].dates.push(orderTime);
      });
    });

    const now = new Date().getTime();
    const suggestions: GroceryItem[] = [];
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    Object.values(itemHistory).forEach(record => {
      if (!record.isTracked) return; 
      
      const rawNameKey = record.itemData.name.toLowerCase();
      const itemNameKey = normalizeItemName(rawNameKey);
      if (dismissedSuggestions.has(rawNameKey) || dismissedSuggestions.has(itemNameKey)) return;

      let effectiveInterval = DEFAULT_VELOCITY[itemNameKey] || DEFAULT_VELOCITY[rawNameKey] || null;
      
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
          const alreadyOnList = items.some(i => normalizeItemName(i.name) === normalizeItemName(record.itemData.name));
          if (!alreadyOnList) {
            const latestStore = preferences[itemNameKey]?.lastPurchasedStore || record.itemData.store;
            suggestions.push({
              ...record.itemData,
              store: latestStore
            });
          }
        }
      }
    });
    return suggestions;
  }, [purchaseHistory, items, dismissedSuggestions, trackingOverrides, preferences]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f9ea]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#176a21] mx-auto"></div>
          <p className="mt-4 text-[#176a21] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      userEmail={user.email}
      cartCount={cartTabItems.length}
    >
      
      {showStaleCartWarning && (
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

      <div className="w-full flex flex-col gap-6 mt-4">
        
        {activeTab === 'list' && (
          <>
            <div className="flex flex-col gap-4">
              <AddItemForm onAddItem={handleAddItem} />
              <AddForm onAddItem={handleAddItem} />
            </div>

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
                        onClick={() => handleAddFromHabits(item, true)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-slate-700 whitespace-nowrap"
                      >
                        <Icon icon={getItemIcon(item.name, item.category)} className="text-lg" />
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
                    <div className={`flex items-center px-4 py-3 rounded-xl border shadow-sm ${officialStore.color || 'bg-white border-slate-200'}`}>
                      <img 
                        src={officialStore.imageLogo}
                        alt={storeName} 
                        className="h-5 sm:h-6 max-w-[100px] sm:max-w-[120px] object-contain object-left drop-shadow-sm" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <div className="ml-auto bg-white/80 text-slate-800 px-2.5 py-1 rounded-md shadow-sm border border-slate-200/50 flex items-center justify-center backdrop-blur-sm">
                        <span className="text-xs font-bold">{itemsInStore.length}</span>
                      </div>
                    </div>
                  ) : (
                    <div className={`flex items-center px-4 py-3 rounded-xl border shadow-sm font-headline font-bold uppercase tracking-wider text-sm ${officialStore?.color || 'bg-white text-slate-600 border-slate-200'}`}>
                      <span>{officialStore?.logo || officialStore?.name || storeName || 'Other'}</span>
                      <div className="ml-auto bg-white/60 text-slate-800 px-2.5 py-1 rounded-md shadow-sm border border-slate-200/50 flex items-center justify-center backdrop-blur-sm">
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
                            trackHabit={item.trackHabit}
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
          <div className="flex flex-col gap-4 mt-1 animate-fade-in">
            <section className="px-1">
              <h2 className="text-2xl font-headline font-black text-slate-900 tracking-tight leading-none">
                Run Summary
              </h2>
              {cartTabItems.length > 0 && (
                <div className="flex items-center flex-wrap gap-2 mt-2 text-xs text-slate-600 font-medium">
                  {cartRunTelemetry.isPaused ? (
                    <span className="inline-flex items-center text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                      Run Paused
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                      Cart Active
                    </span>
                  )}

                  <span>•</span>
                  <span>
                    {cartStoreNames.length} {cartStoreNames.length === 1 ? 'Store' : 'Stores'}
                  </span>

                  {cartRunTelemetry.durationLabel && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <span className="material-symbols-outlined text-[14px] text-emerald-700">schedule</span>
                        {cartRunTelemetry.durationLabel}
                      </span>
                    </>
                  )}
                </div>
              )}
            </section>

            {cartTabItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-16 pb-8 text-center px-4 animate-fade-in">
                <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">shopping_cart_checkout</span>
                </div>
                <h3 className="text-xl font-headline font-bold text-on-surface mb-2">Your cart is empty</h3>
                <p className="text-sm text-slate-500 max-w-xs">
                  Check off items from your List as you shop to review your run summary here.
                </p>
              </div>
            ) : (
              <>
                <section className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100 shrink-0">
                      <span className="material-symbols-outlined text-xl">shopping_cart</span>
                    </div>
                    <div>
                      <div className="text-sm font-headline font-bold text-slate-900">Cart Overview</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">
                        {cartTabItems.length} {cartTabItems.length === 1 ? 'item' : 'items'} ready across {cartStoreNames.length} {cartStoreNames.length === 1 ? 'store' : 'stores'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 shrink-0">
                    {cartStoreNames.length} {cartStoreNames.length === 1 ? 'Store' : 'Stores'}
                  </span>
                </section>

                <div className="flex flex-col gap-3">
                  {cartStoreNames.map((storeName) => {
                    const itemsInStore = cartGroupedByStore[storeName];
                    const officialStore = STORE_OPTIONS.find(
                      s => s.name.toLowerCase() === storeName.toLowerCase()
                    );
                    const isExpanded = expandedCartStore === storeName;

                    const categoryOrder = CATEGORIES.reduce((acc, cat, index) => {
                      acc[cat.name] = index;
                      return acc;
                    }, {} as Record<string, number>);

                    const sortedStoreItems = [...itemsInStore].sort((a, b) => {
                      const orderA = categoryOrder[a.category || ''] ?? 99;
                      const orderB = categoryOrder[b.category || ''] ?? 99;
                      return orderA - orderB;
                    });

                    return (
                      <div 
                        key={storeName} 
                        className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${
                          isExpanded ? 'ring-2 ring-primary/20' : ''
                        } ${officialStore?.color || 'bg-white border-slate-200'}`}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedCartStore(isExpanded ? null : storeName)}
                          className="w-full p-4 flex items-center justify-between text-left select-none hover:brightness-95 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {officialStore?.imageLogo ? (
                              <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                                <img 
                                  src={officialStore.imageLogo}
                                  alt={storeName} 
                                  className="h-5 max-w-[95px] object-contain object-left" 
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              </div>
                            ) : (
                              <span className="px-3 py-1 rounded-lg bg-white/50 border border-slate-200/50 font-headline font-bold uppercase tracking-wider text-xs shrink-0 text-slate-800 shadow-sm">
                                {officialStore?.logo || officialStore?.name || storeName}
                              </span>
                            )}

                            <span className="text-xs text-slate-800 font-bold truncate">
                              {itemsInStore.length} {itemsInStore.length === 1 ? 'item' : 'items'}
                            </span>
                          </div>

                          <span className={`w-7 h-7 rounded-full bg-white/80 shadow-sm flex items-center justify-center text-slate-600 transition-transform duration-200 shrink-0 ${
                            isExpanded ? 'rotate-180 text-primary' : ''
                          }`}>
                            <span className="material-symbols-outlined text-[18px]">expand_more</span>
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-slate-200/50 p-3 flex flex-col gap-2 bg-white/40 backdrop-blur-md">
                            {sortedStoreItems.map((item: GroceryItem) => (
                              <ItemCard 
                                key={item.id} 
                                id={item.id} 
                                name={item.name} 
                                category={item.category || 'General'} 
                                inCart={item.inCart} 
                                viewMode="cart" 
                                trackHabit={item.trackHabit}
                                onToggleCart={handleToggleCart} 
                                onDelete={handleDeleteItem} 
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 pb-4">
                  <button 
                    onClick={handleFinishRun}
                    className="w-full py-4 px-6 bg-[#00A86B] hover:bg-[#059669] text-white rounded-2xl font-headline font-extrabold shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-xl">check_circle</span>
                    <span>Finish Run</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'habits' && (
          <div className="w-full flex flex-col gap-8 animate-fade-in">
            <section>
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-headline font-bold text-on-surface">Habits Dashboard</h2>
                </div>
                
                <div className="flex p-1 bg-white rounded-xl shadow-sm mb-2">
                  <button 
                    onClick={() => handleHabitTabSwitch('tracked')}
                    className={`flex-1 py-2 text-center rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                      habitTab === 'tracked' ? 'bg-[#eaf3ea] text-[#1b3d2b] shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <span>Tracked Items</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${habitTab === 'tracked' ? 'bg-[#7d9d7c]/20 text-[#1b3d2b]' : 'bg-slate-100 text-slate-500'}`}>
                      {habitsDashboardData.filter(i => i.trackHabit !== false).length}
                    </span>
                  </button>
                  <button 
                    onClick={() => handleHabitTabSwitch('untracked')}
                    className={`flex-1 py-2 text-center rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                      habitTab === 'untracked' ? 'bg-[#eaf3ea] text-[#1b3d2b] shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <span>Untracked items</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${habitTab === 'untracked' ? 'bg-[#7d9d7c]/20 text-[#1b3d2b]' : 'bg-slate-100 text-slate-500'}`}>
                      {habitsDashboardData.filter(i => i.trackHabit === false).length}
                    </span>
                  </button>
                </div>

                {habitTab === 'tracked' ? (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-700 text-[20px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      <span className="font-bold">How it works:</span> Habits predicts when you run out based on past purchases. Only items you choose to track appear here!
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-700 text-[20px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      These untracked items will not trigger restock recommendations. You can start tracking them anytime by tapping Track Item.
                    </p>
                  </div>
                )}

                <div className="flex gap-2 relative mt-2">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input 
                      type="text"
                      placeholder={habitTab === 'tracked' ? "Find tracked item..." : "Find untracked items..."}
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
                  <select
                    value={habitSortFilter}
                    onChange={(e) => setHabitSortFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow px-2 py-3 font-semibold text-slate-700 shadow-sm"
                  >
                    {habitTab === 'tracked' && <option value="urgency">Restock Urgency</option>}
                    <option value="recent">Recently Bought</option>
                    <option value="frequent">Most Bought</option>
                    <option value="az">Alphabetical (A-Z)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {filteredAndSortedHabits.map((habit, index) => {
                  const isAlreadyOnList = listTabItems.some(i => normalizeItemName(i.name) === normalizeItemName(habit.name));
                  
                  return (
                    <div key={`${habit.id}-${index}`} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                      
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold text-slate-800 capitalize flex items-center gap-2 flex-1 min-w-0 pr-3">
                          <Icon icon={getItemIcon(habit.name, habit.category)} className="text-xl shrink-0" />
                          <span className="break-words leading-tight">{habit.name}</span>
                        </h3>
                        {habitTab === 'tracked' ? (
                          <button 
                            onClick={() => handleAddFromHabits(habit, true)}
                            disabled={isAlreadyOnList}
                            className={`flex items-center gap-1 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all active:scale-95 shrink-0 ${
                              isAlreadyOnList
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : habit.status === 'Restock Soon' 
                                  ? 'bg-[#FFE4E6] text-[#BE123C] hover:bg-rose-100 shadow-sm' 
                                  : 'bg-[#DCEDE0] text-[#1b3d2b] hover:bg-[#c2d6cb] shadow-sm'
                            }`}
                          >
                            {isAlreadyOnList ? 'Added to List' : 'Restock Soon'}
                            <span className="material-symbols-outlined text-[16px] font-bold">
                              {isAlreadyOnList ? 'check' : 'add'}
                            </span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleAddFromHabits(habit, true)}
                            disabled={isAlreadyOnList}
                            className={`flex items-center justify-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                              isAlreadyOnList ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isAlreadyOnList ? 'Added' : 'Add to List'}
                            <span className="material-symbols-outlined text-[16px] font-bold">{isAlreadyOnList ? 'check' : 'add'}</span>
                          </button>
                        )}
                      </div>

                      {/* NEW 2x2 GRID */}
                      <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm text-slate-600 mb-4 mt-4 bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400">Purchases</span>
                          <span className="font-bold text-slate-800 text-lg">{habit.totalPurchases}</span>
                        </div>
                        {habitTab === 'tracked' ? (
                          <div>
                            <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400">Avg Cycle</span>
                            <span className="font-bold text-slate-800 text-lg">{habit.avgIntervalDays ? `${habit.avgIntervalDays}d` : '--'}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end pr-2">
                            <button 
                              onClick={() => handleToggleTracking(habit.name, true)}
                              className="flex items-center justify-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-[#15803D] text-white shadow-md hover:bg-[#006d30] active:scale-95 transition-all"
                            >
                              <span className="material-symbols-outlined text-[16px]">sync</span>
                              Track
                            </button>
                          </div>
                        )}
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400">Last Bought</span>
                          <span className="font-bold text-slate-800 text-lg">{habit.daysSinceLast !== null ? `${habit.daysSinceLast}d ago` : '--'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400">Store</span>
                          <span className="font-bold text-slate-800 text-lg capitalize truncate block pr-2">
                            {habit.lastPurchasedStore}
                          </span>
                        </div>
                      </div>

                      {/* NEW CATEGORY FOOTER */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100">
                        <div className={`inline-flex items-center gap-1 text-[10px] font-label font-bold px-2.5 py-1 rounded-md border whitespace-nowrap ${getCategoryBgColor(habit.category)}`}>
                          <span className="material-symbols-outlined text-[14px] leading-none">
                            {getCategoryIcon(habit.category)}
                          </span>
                          <span>{habit.category || 'General'}</span>
                        </div>
                        
                        {habitTab === 'untracked' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 self-start sm:self-auto">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Not tracked
                          </span>
                        )}
                      </div>
                      
                      {habitTab === 'tracked' && (
                        <>
                          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                habit.status === 'Restock Soon' ? 'bg-[#EF4444]' : 
                                habit.status === 'Need Data' ? 'bg-amber-400' : 
                                'bg-emerald-500'
                              }`}
                              style={{ width: `${habit.progressPercent}%` }}
                            />
                          </div>
                          <div className="flex justify-end mt-2">
                            <button 
                              onClick={() => handleToggleTracking(habit.name, false)}
                              className="text-slate-400 hover:text-slate-600 font-semibold text-xs flex items-center gap-1 transition-colors px-2 py-1 rounded"
                            >
                              <span className="material-symbols-outlined text-[14px]">do_not_disturb_on</span>
                              Stop tracking (move to untracked)
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
                
                {filteredAndSortedHabits.length === 0 && (
                  <div className="text-center py-12 px-6 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-3xl text-slate-400">monitoring</span>
                    </div>
                    <h3 className="font-bold text-slate-800 mb-2">No data yet</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      {habitTab === 'tracked' 
                        ? "Complete your first purchase to start tracking your grocery habits."
                        : "You don't have any untracked items yet."}
                    </p>
                  </div>
                )}
              </div>
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
      <Analytics />
    </Layout>
  );
}