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
  const [habitFilter, setHabitFilter] = useState<'all' | 'restock' | 'stocked' | 'need_data'>('all');
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

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
      console.warn("Database read failed. Defaulting to auto-tagger.");
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
      setToastMessage("Failed to add item. Check network connection or database permissions.");
    }
  };

  const handleToggleCart = async (id: string, currentState: boolean) => {
    await updateDoc(doc(db, 'items', id), { inCart: !currentState });
    setToastMessage(!currentState ? "Moved to Cart" : "Moved back to List");
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
    const existingMatch = items.find(item => isDuplicateItem(habit.name, item.name));
    if (existingMatch) {
      setToastMessage(`${existingMatch.name} is already in your list`);
      return;
    }
    await addDoc(collection(db, 'items'), {
      name: habit.name, 
      category: habit.category || 'Other', 
      store: habit.store || habit.lastPurchasedStore || 'Other',
      inCart: false, 
      createdAt: new Date().toISOString()
    });
    setToastMessage(`Added ${habit.name} to List`);
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

  const restockCount = useMemo(() => habitsDashboardData.filter(h => h.status === 'Restock Soon').length, [habitsDashboardData]);
  const stockedCount = useMemo(() => habitsDashboardData.filter(h => h.status === 'Stocked').length, [habitsDashboardData]);
  const needDataCount = useMemo(() => habitsDashboardData.filter(h => h.status === 'Need Data').length, [habitsDashboardData]);

  const filteredHabits = useMemo(() => {
    return habitsDashboardData.filter(habit => {
      const matchesSearch = habit.name.toLowerCase().includes(habitSearchQuery.toLowerCase().trim());
      if (!matchesSearch) return false;
      if (habitFilter === 'restock') return habit.status === 'Restock Soon';
      if (habitFilter === 'stocked') return habit.status === 'Stocked';
      if (habitFilter === 'need_data') return habit.status === 'Need Data';
      return true;
    });
  }, [habitsDashboardData, habitSearchQuery, habitFilter]);

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
      
      {cartTabItems.length > 0 && activeTab !== 'cart' && !hasDismissedReminder && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-fade-in">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl shadow-xl overflow-hidden p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className=