import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, CheckCheck, RefreshCcw, BarChart3, 
  EyeOff, Trash2, Plus, ChevronUp, ChevronDown, PieChart, ListOrdered, Sparkles, RotateCcw, Moon, Sun, MapPin, Store
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { AddItemForm } from './components/AddItemForm';
import { FrequencyStats } from './components/FrequencyStats';
import { GroceryItem } from './types';
import {
  getItemStats,
  saveToLocalStorage,
  loadFromLocalStorage,
} from './utils/groceryUtils';

// --- 1. BULLETPROOF SPEED CART LOGO ---
const SpeedCartIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} preserveAspectRatio="xMidYMid meet">
    <path d="M1 13H5M2 9H4M0 17H6" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" className="animate-pulse" />
    <path d="M10 10C10 10 9 4 12 4C15 4 14 10 14 10" fill="#22c55e" />
    <rect x="14" y="4" width="5" height="7" rx="1" fill="#f97316" />
    <circle cx="11" cy="9" r="3" fill="#ef4444" />
    <path d="M6 7H22L19 15H8.5L6 7Z" fill="#3b82f6" />
    <path d="M3 3H5.5L8.5 15L9.5 18H18" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="11" cy="20" r="2" fill="#1e293b" /><circle cx="17" cy="20" r="2" fill="#1e293b" />
    <circle cx="11" cy="20" r="1" fill="#e2e8f0" /><circle cx="17" cy="20" r="1" fill="#e2e8f0" />
  </svg>
);

// --- 2. SMART KEYWORD ENGINE ---
const getAutoCategory = (name: string): string | null => {
  const lower = name.toLowerCase();
  const categoryKeywords: Record<string, string[]> = {
    "🥬 Produce (Fruits & Veggies)": ["onion", "tomato", "potato", "apple", "banana", "orange", "grape", "spinach", "lettuce", "broccoli", "carrot", "garlic", "ginger", "pepper", "mushroom", "berry", "lemon", "lime", "avocado", "cilantro", "coriander", "okra", "palak", "fruit", "veg", "salad", "watermelon", "strawberry", "blueberry", "melon", "cherry", "peach", "mango", "pineapple", "coconut", "kiwi", "eggplant", "corn", "cucumber", "beet"],
    "🥛 Dairy & Eggs": ["milk", "cheese", "egg", "butter", "yogurt", "yoghurt", "cream", "paneer", "dahi", "curd"],
    "🥩 Meat & Seafood": ["chicken", "beef", "pork", "fish", "salmon", "bacon", "sausage", "meat", "shrimp", "prawn", "turkey"],
    "🍞 Bakery": ["bread", "bun", "roll", "bagel", "muffin", "cake", "croissant", "pastry", "pita", "tortilla", "baguette", "pretzel", "pancake", "waffle"],
    "🥜 Nuts & Seeds": ["nut", "peanut", "almond", "cashew", "walnut", "pecan", "seed", "pistachio"],
    "🥫 Pantry": ["rice", "pasta", "noodle", "dal", "lentil", "flour", "atta", "sugar", "salt", "spice", "oil", "ghee", "vinegar", "sauce", "soup", "cereal", "oat", "honey", "jam", "peanut butter", "chana", "basmati", "bean", "can"],
    "❄️ Frozen Foods": ["pizza", "ice cream", "frozen", "popsicle"],
    "🍿 Snacks & Candy": ["chip", "cookie", "cracker", "candy", "chocolate", "popcorn", "snack", "gum"],
    "🥤 Beverages & Coffee": ["water", "juice", "soda", "pop", "coffee", "tea", "beer", "wine", "liquor", "drink"],
    "🧼 Household & Cleaning": ["paper towel", "toilet paper", "trash", "soap", "detergent", "clean", "foil", "wrap", "sponge", "tissue", "bleach"],
    "🧴 Personal & Pet Care": ["shampoo", "toothpaste", "brush", "lotion", "deodorant", "dog", "cat", "pet", "pad", "tampon", "body wash"],
    "👶 Baby": ["diaper", "wipe", "formula", "baby food", "pacifier", "soother", "nappy", "bottle"]
  };
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lower.includes(keyword))) return category;
  }
  return null;
};

const EMOJI_MAP: Record<string, string> = {
  apple: "🍎", "green apple": "🍏", banana: "🍌", orange: "🍊", lemon: "🍋", lime: "🍈",
  watermelon: "🍉", grape: "🍇", strawberry: "🍓", blueberry: "🫐", melon: "🍈", cherry: "🍒",
  peach: "🍑", mango: "🥭", pineapple: "🍍", coconut: "🥥", kiwi: "🥝", tomato: "🍅",
  eggplant: "🍆", potato: "🥔", carrot: "🥕", corn: "🌽", pepper: "🌶️", "bell pepper": "🫑",
  cucumber: "🥒", lettuce: "🥬", spinach: "🥬", broccoli: "🥦", garlic: "🧄", onion: "🧅",
  mushroom: "🍄", ginger: "🫚", okra: "🎋", palak: "🥬", cilantro: "🌿", coriander: "🌿",
  milk: "🥛", cheese: "🧀", egg: "🥚", butter: "🧈", yogurt: "🍦", curd: "🥣", dahi: "🥣", paneer: "🧀",
  chicken: "🍗", meat: "🥩", beef: "🥩", pork: "🥩", bacon: "🥓", fish: "🐟",
  salmon: "🍣", shrimp: "🦐", prawn: "🍤", turkey: "🦃", sausage: "🌭",
  bread: "🍞", croissant: "🥐", baguette: "🥖", pretzel: "🥨", bagel: "🥯",
  pancake: "🥞", waffle: "🧇", bun: "🥯", roll: "🥐", pastry: "🥐", cake: "🍰",
  peanut: "🥜", nut: "🌰", almond: "🌰", cashew: "🌰", walnut: "🌰",
  rice: "🍚", pasta: "🍝", noodle: "🍜", dal: "🥣", lentil: "🥣", flour: "🌾",
  atta: "🌾", salt: "🧂", spice: "🌶️", oil: "🛢️", honey: "🍯", jam: "🍯",
  soup: "🍲", cereal: "🥣", can: "🥫", bean: "🫘", "peanut butter": "🥜",
  pizza: "🍕", "ice cream": "🍨", frozen: "🧊", popsicle: "🍧", chip: "🍟",
  cookie: "🍪", cracker: "🍘", candy: "🍬", chocolate: "🍫", popcorn: "🍿",
  water: "💧", juice: "🧃", soda: "🥤", pop: "🥤", coffee: "☕", tea: "🍵",
  beer: "🍺", wine: "🍷", liquor: "🥃", drink: "🍹",
  "paper towel": "🧻", "toilet paper": "🧻", soap: "🧼", sponge: "🧽",
  diaper: "🧷", formula: "🍼", wipe: "🧻", pet: "🐕", dog: "🐕", cat: "🐈", toothpaste: "🪥"
};

const GROCERY_CATEGORIES = ["🥬 Produce (Fruits & Veggies)", "🥛 Dairy & Eggs", "🥩 Meat & Seafood", "🍞 Bakery", "🥜 Nuts & Seeds", "🥫 Pantry", "❄️ Frozen Foods", "🍿 Snacks & Candy", "🥤 Beverages & Coffee", "🧼 Household & Cleaning", "🧴 Personal & Pet Care", "👶 Baby", "📦 Other"];
const PRESET_STORES = ["Costco", "FreshCo", "No Frills", "Walmart", "Loblaws", "Other"];

// --- 3. BRAND COLOR MAPPING & LOGO DOMAINS ---
const STORE_DOMAINS: Record<string, string> = {
  "Costco": "costco.ca",
  "FreshCo": "freshco.com",
  "No Frills": "nofrills.ca",
  "Walmart": "walmart.ca",
  "Loblaws": "loblaws.ca"
};

const STORE_COLORS: Record<string, { text: string, bg: string, border: string, badge: string }> = {
  "Costco": { text: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/40", border: "border-red-200 dark:border-red-900/50", badge: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" },
  "FreshCo": { text: "text-green-700 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/40", border: "border-green-200 dark:border-green-900/50", badge: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" },
  "No Frills": { text: "text-yellow-700 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/40", border: "border-yellow-200 dark:border-yellow-900/50", badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400" },
  "Walmart": { text: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200 dark:border-blue-900/50", badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400" },
  "Loblaws": { text: "text-orange-700 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40", border: "border-orange-200 dark:border-orange-900/50", badge: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400" },
  "Other": { text: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-200 dark:border-purple-900/50", badge: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400" }
};

const getStoreColor = (storeName?: string) => {
  if (!storeName || storeName === "Any Store") {
    return { text: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800/50", border: "border-slate-200 dark:border-slate-700", badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" };
  }
  return STORE_COLORS[storeName] || STORE_COLORS["Other"];
};

const normalizeName = (name: string) => {
  if (!name) return "";
  const clean = name.replace(/[^\w\s]/gi, "").trim().toLowerCase();
  if (clean.endsWith('ies')) return clean.slice(0, -3) + 'y'; 
  if (clean.endsWith('es')) return clean.slice(0, -2);
  if (clean.endsWith('s') && !clean.endsWith('ss')) return clean.slice(0, -1);
  return clean;
};

const getTimeAgo = (dateString: string) => {
  if (!dateString) return "Never purchased";
  const diffDays = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Purchased today";
  if (diffDays === 1) return "Purchased yesterday";
  if (diffDays < 7) return `Purchased ${diffDays} days ago`;
  if (diffDays < 30) return `Purchased ${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `Purchased ${Math.floor(diffDays / 30)} months ago`;
  return `Purchased ${Math.floor(diffDays / 365)} years ago`;
};

// --- LOGO COMPONENT ---
const StoreLogo = ({ storeName, className = "" }: { storeName: string, className?: string }) => {
  const domain = STORE_DOMAINS[storeName];
  if (!domain) return <MapPin className={`w-3 h-3 flex-shrink-0 ${className}`} />;
  
  return (
    <img 
      src={`https://www.google.com/s2/favicons?sz=64&domain=${domain}`} 
      alt={`${storeName} logo`} 
      className={`w-3.5 h-3.5 rounded-full bg-white p-[1px] object-contain flex-shrink-0 ${className}`} 
      onError={(e) => {
        e.currentTarget.style.display = 'none';
        e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', `<svg class="w-3 h-3 ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`);
      }}
    />
  );
};

// --- 4. MAIN APP COMPONENT ---
export default function App() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [categoryPrefs, setCategoryPrefs] = useState<Record<string, string>>({});
  const [storePrefs, setStorePrefs] = useState<Record<string, string>>({});
  
  // NEW: Memory bank for custom emojis
  const [emojiPrefs, setEmojiPrefs] = useState<Record<string, string>>({});
  
  const [categoryOrder, setCategoryOrder] = useState<string[]>(GROCERY_CATEGORIES);
  const [showStats, setShowStats] = useState(true);
  const [statView, setStatView] = useState<'items' | 'categories' | 'stores'>('items');
  const [darkMode, setDarkMode] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [activeMenu, setActiveMenu] = useState<{id: string, type: 'category' | 'store'} | null>(null);

  useEffect(() => {
    setItems(loadFromLocalStorage());
    if (localStorage.getItem('groceryCategoryPrefs')) setCategoryPrefs(JSON.parse(localStorage.getItem('groceryCategoryPrefs')!));
    if (localStorage.getItem('groceryStorePrefs')) setStorePrefs(JSON.parse(localStorage.getItem('groceryStorePrefs')!));
    if (localStorage.getItem('groceryEmojiPrefs')) setEmojiPrefs(JSON.parse(localStorage.getItem('groceryEmojiPrefs')!));
    if (localStorage.getItem('groceryTheme') === 'dark') setDarkMode(true);
    if (localStorage.getItem('groceryCategoryOrder')) setCategoryOrder(Array.from(new Set([...JSON.parse(localStorage.getItem('groceryCategoryOrder')!), ...GROCERY_CATEGORIES])));
  }, []);

  useEffect(() => { saveToLocalStorage(items); }, [items]);
  useEffect(() => { localStorage.setItem('groceryCategoryPrefs', JSON.stringify(categoryPrefs)); }, [categoryPrefs]);
  useEffect(() => { localStorage.setItem('groceryStorePrefs', JSON.stringify(storePrefs)); }, [storePrefs]);
  useEffect(() => { localStorage.setItem('groceryEmojiPrefs', JSON.stringify(emojiPrefs)); }, [emojiPrefs]);
  useEffect(() => { localStorage.setItem('groceryTheme', darkMode ? 'dark' : 'light'); }, [darkMode]);
  useEffect(() => { localStorage.setItem('groceryCategoryOrder', JSON.stringify(categoryOrder)); }, [categoryOrder]);

  const suggestions = useMemo(() => {
    const today = new Date().getTime();
    return items.filter(item => {
      if (!item.isHistory || (item.purchaseDates || []).length < 2) return false;
      const dates = item.purchaseDates!.map(d => new Date(d).getTime()).sort((a, b) => a - b);
      const avgIntervalDays = ((dates[dates.length - 1] - dates[0]) / (dates.length - 1)) / 86400000;
      return ((today - dates[dates.length - 1]) / 86400000) >= avgIntervalDays;
    }).slice(0, 5);
  }, [items]);

  const handleAddItem = (rawInputName: string, manualCategory?: string, manualStore?: string, forceAdd = false) => {
    if (!rawInputName.trim()) return;

    // 1. Extract emojis using modern Unicode property escapes
    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
    const extractedEmojis = rawInputName.match(emojiRegex);
    const customEmoji = extractedEmojis ? extractedEmojis.join('') : null;

    // 2. Clean the name so we don't duplicate emojis, and normalize it for matching
    const cleanName = rawInputName.replace(emojiRegex, '').trim();
    if (!cleanName) return; // Prevent adding just an emoji with no text
    const normName = normalizeName(cleanName);

    const existing = items.find(i => !i.isHistory && normalizeName(i.name) === normName);
    
    if (existing && !forceAdd) {
      toast.error(`"${cleanName}" is already here!`, { action: { label: "Add Anyway", onClick: () => handleAddItem(rawInputName, manualCategory, manualStore, true) } });
      return;
    }

    // 3. Determine the final emoji (Custom override > Saved Preference > Default Emoji Map)
    const finalEmoji = customEmoji || emojiPrefs[normName] || EMOJI_MAP[normName] || "";
    const displayName = finalEmoji ? `${cleanName} ${finalEmoji}` : cleanName;
    
    const finalCategory = manualCategory || categoryPrefs[normName] || getAutoCategory(cleanName) || "📦 Other";
    const finalStore = manualStore || storePrefs[normName] || "";
    const historyItem = items.find(i => i.isHistory && normalizeName(i.name) === normName);
    
    if (historyItem) {
      setItems(prev => prev.map(i => i.id === historyItem.id ? { ...i, name: displayName, isHistory: false, checkedOut: false, category: finalCategory, store: finalStore } : i));
    } else {
      setItems(prev => [{ id: Date.now().toString(), name: displayName, category: finalCategory, store: finalStore, purchaseCount: 0, purchaseDates: [], checkedOut: false, isHistory: false, addedAt: new Date().toISOString() }, ...prev]);
    }
    
    // Save preferences
    if (customEmoji) setEmojiPrefs(prev => ({ ...prev, [normName]: customEmoji }));
    if (manualCategory) setCategoryPrefs(prev => ({ ...prev, [normName]: manualCategory }));
    if (manualStore && manualStore !== "Any Store") setStorePrefs(prev => ({ ...prev, [normName]: manualStore }));
    
    toast.success(`Added ${cleanName}`);
  };

  const handleCheckout = (id: string) => {
    setIsBouncing(true); setTimeout(() => setIsBouncing(false), 250);
    setItems(prev => prev.map(i => i.id === id ? { ...i, checkedOut: true, purchaseCount: (i.purchaseCount || 0) + 1, purchaseDates: [...(i.purchaseDates || []), new Date().toISOString()] } : i));
  };

  const handleCompleteTrip = () => {
    const newCatPrefs = { ...categoryPrefs };
    const newStorePrefs = { ...storePrefs };
    items.forEach(item => {
      if (item.checkedOut) {
        const norm = normalizeName(item.name);
        if (item.category !== "📦 Other") newCatPrefs[norm] = item.category;
        if (item.store && item.store !== "Any Store") newStorePrefs[norm] = item.store;
      }
    });
    setCategoryPrefs(newCatPrefs);
    setStorePrefs(newStorePrefs);
    setItems(prev => prev.map(i => i.checkedOut ? { ...i, checkedOut: false, isHistory: true } : i));
    toast.success(`Trip completed!`);
  };

  const handleUpdateCategory = (id: string, newCategory: string) => {
    setItems(prev => prev.map(i => {
      if (i.id === id) {
        const norm = normalizeName(i.name);
        setCategoryPrefs(p => ({ ...p, [norm]: newCategory }));
        return { ...i, category: newCategory };
      }
      return i;
    }));
  };

  const handleUpdateStore = (id: string, newStore: string) => {
    setItems(prev => prev.map(i => {
      if (i.id === id) {
        const norm = normalizeName(i.name);
        if (newStore) {
          setStorePrefs(p => ({ ...p, [norm]: newStore }));
        }
        return { ...i, store: newStore };
      }
      return i;
    }));
  };

  const handleClearList = () => {
    if (window.confirm("Remove all unchecked items from your list?")) {
      setItems(prev => prev.filter(i => i.isHistory || i.checkedOut));
      toast.success("List cleared.");
    }
  };

  const handleRefreshHabits = () => {
    if (window.confirm("Start fresh? This will clear all your shopping history and reset your analytics, but your custom categories will be saved.")) {
      setItems(prev => prev.filter(i => !i.isHistory).map(i => ({ ...i, purchaseCount: 0, purchaseDates: [] })));
      toast.success("Habits and statistics refreshed!");
    }
  };

  const moveCategoryUp = (cat: string) => {
    const idx = categoryOrder.indexOf(cat);
    if (idx > 0) { const newOrder = [...categoryOrder]; [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]]; setCategoryOrder(newOrder); }
  };
  const moveCategoryDown = (cat: string) => {
    const idx = categoryOrder.indexOf(cat);
    if (idx < categoryOrder.length - 1) { const newOrder = [...categoryOrder]; [newOrder[idx + 1], newOrder[idx]] = [newOrder[idx], newOrder[idx + 1]]; setCategoryOrder(newOrder); }
  };

  const activeItems = items.filter(i => !i.isHistory && !i.checkedOut);
  const cartItems = items.filter(i => i.checkedOut && !i.isHistory);
  const historyItems = items.filter(i => i.isHistory);
  const grouped = activeItems.reduce((acc, i) => { const cat = i.category || "📦 Other"; if (!acc[cat]) acc[cat] = []; acc[cat].push(i); return acc; }, {} as Record<string, GroceryItem[]>);
  const sortedCats = Object.keys(grouped).sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b));

  const categoryData = React.useMemo(() => {
    const stats = items.reduce((acc, item) => {
      const count = item.purchaseDates?.length || item.purchaseCount || 0;
      if (count > 0) { const cat = item.category || "📦 Other"; acc[cat] = (acc[cat] || 0) + count; }
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(stats).map(([name, count]) => ({ name, count: count as number })).sort((a, b) => b.count - a.count);
  }, [items]);

  const storeData = React.useMemo(() => {
    const stats = items.reduce((acc, item) => {
      const count = item.purchaseDates?.length || item.purchaseCount || 0;
      if (count > 0) { 
        const st = item.store || "Unassigned"; 
        acc[st] = (acc[st] || 0) + count; 
      }
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(stats).map(([name, count]) => ({ name, count: count as number })).sort((a, b) => b.count - a.count);
  }, [items]);

  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-background text-foreground'}`}>
      <Toaster position="top-center" richColors theme={darkMode ? 'dark' : 'light'} />
      <div className="max-w-7xl mx-auto flex-1 w-full">
        
        <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-1 rounded-2xl border shadow-md transition-all duration-200 ${isBouncing ? 'scale-110 -rotate-6' : 'scale-100 rotate-0'} ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#bbf7d0]'}`}>
              <SpeedCartIcon className="w-16 h-16 sm:w-20 sm:h-20" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase leading-none italic transform -skew-x-12 text-primary">Grocery Run</h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2">Smart. Organic. Adaptive.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2.5 rounded-full border transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-yellow-400' : 'bg-white border-slate-200 text-slate-600'}`}>
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => setShowStats(!showStats)} className="flex items-center gap-2 text-xs px-5 py-2.5 rounded-full font-black border border-primary/20 bg-primary/10 text-primary transition-all">
              {showStats ? <BarChart3 className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}{showStats ? "STATS" : "HIDE"}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`${showStats ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
            
            {suggestions.length > 0 && (
              <div className={`rounded-xl border p-4 border-dashed animate-in fade-in slide-in-from-top-4 duration-500 ${darkMode ? 'bg-blue-900/10 border-blue-800/50' : 'bg-blue-50/50 border-blue-200'}`}>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-3 flex items-center gap-2"><Sparkles className="w-3 h-3" /> Running Low?</h3>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map(item => (
                    <button key={item.id} onClick={() => handleAddItem(item.name)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${darkMode ? 'bg-slate-900 border-slate-700 hover:border-primary' : 'bg-white border-slate-200 hover:border-primary shadow-sm'}`}>
                      {item.name} <Plus className="w-3 h-3 text-primary" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={`rounded-xl border p-6 shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-card'}`}>
              <AddItemForm onAddItem={(n, c, s) => handleAddItem(n, c, s)} categories={categoryOrder} stores={PRESET_STORES} />
            </div>

            <Tabs defaultValue="active" className="w-full">
              <TabsList className={`grid w-full grid-cols-3 ${darkMode ? 'bg-slate-900' : ''}`}>
                <TabsTrigger value="active">List ({activeItems.length})</TabsTrigger>
                <TabsTrigger value="cart">Cart ({cartItems.length})</TabsTrigger>
                <TabsTrigger value="history">Habits</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-6 space-y-6">
                {activeItems.length === 0 ? (
                  <div className="text-center py-20 italic text-sm opacity-40"><Package className="w-12 h-12 mx-auto mb-3" /><p>Your harvest list is empty.</p></div>
                ) : (
                  <>
                  {sortedCats.map(cat => (
                    <div key={cat} className={`rounded-xl p-4 border border-dashed mb-4 ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-card/40 border-muted'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-black text-[10px] text-primary flex items-center gap-2 uppercase tracking-widest opacity-60">
                          {cat} <span className="font-normal bg-muted px-2 py-0.5 rounded-full">{grouped[cat].length}</span>
                        </h3>
                        <div className="flex gap-1">
                          <button onClick={() => moveCategoryUp(cat)} className={`p-1 rounded transition-colors ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`}><ChevronUp className="w-3.5 h-3.5 opacity-50 hover:opacity-100" /></button>
                          <button onClick={() => moveCategoryDown(cat)} className={`p-1 rounded transition-colors ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`}><ChevronDown className="w-3.5 h-3.5 opacity-50 hover:opacity-100" /></button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {grouped[cat].map(item => {
                          const isStoreMenu = activeMenu?.id === item.id && activeMenu.type === 'store';
                          const hasStoreAssigned = Boolean(item.store && item.store !== "Any Store");
                          const storeColors = getStoreColor(item.store);
                          
                          return (
                          <div key={item.id} className={`flex flex-col p-4 border rounded-xl shadow-sm transition-all ${darkMode ? 'bg-slate-900 border-slate-800 active:bg-slate-800' : 'bg-white active:bg-slate-50'}`}>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <button onClick={(e) => { e.stopPropagation(); handleCheckout(item.id); }} className="p-1 rounded-full border-2 border-primary/20 text-transparent hover:text-primary transition-colors"><CheckCheck className="w-4 h-4"/></button>
                                <span className="font-semibold text-[13px] truncate">{item.name}</span>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); setItems(items.filter(i => i.id !== item.id)); }} className="p-2 text-red-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>
                            </div>
                            
                            <div className="flex gap-2 mt-2">
                              {/* Category Button */}
                              <button 
                                onClick={() => setActiveMenu(activeMenu?.id === item.id && activeMenu.type === 'category' ? null : {id: item.id, type: 'category'})}
                                className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-[9px] font-bold uppercase transition-colors border ${activeMenu?.id === item.id && activeMenu.type === 'category' ? 'bg-primary/10 text-primary border-primary/20' : darkMode ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                              >
                                <span className="truncate pr-2">{item.category}</span>
                                <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${activeMenu?.id === item.id && activeMenu.type === 'category' ? 'rotate-180' : ''}`} />
                              </button>
                              
                              {/* Store Button */}
                              <button 
                                onClick={() => setActiveMenu(isStoreMenu ? null : {id: item.id, type: 'store'})}
                                className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-[9px] font-bold uppercase transition-all border ${isStoreMenu ? `${storeColors.bg} ${storeColors.text} ${storeColors.border}` : hasStoreAssigned ? `${storeColors.bg} ${storeColors.text} border-transparent` : darkMode ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                              >
                                <span className="truncate flex items-center gap-1.5 pr-2">
                                  {hasStoreAssigned && <StoreLogo storeName={item.store!} />}
                                  {hasStoreAssigned ? item.store : "From"}
                                </span>
                                <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${isStoreMenu ? 'rotate-180' : ''}`} />
                              </button>
                            </div>

                            {/* --- EXPANDABLE TRAY --- */}
                            {activeMenu?.id === item.id && (
                              <div className={`mt-3 pt-3 border-t border-dashed animate-in fade-in slide-in-from-top-2 duration-200 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                                
                                {activeMenu.type === 'category' ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {categoryOrder.map(c => (
                                      <button 
                                        key={c}
                                        onClick={() => { handleUpdateCategory(item.id, c); setActiveMenu(null); }}
                                        className={`text-[10px] px-2.5 py-1.5 rounded-md border font-semibold transition-all active:scale-95 ${item.category === c ? 'bg-primary text-white border-primary shadow-sm' : darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}
                                      >
                                        {c}
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {PRESET_STORES.map(s => {
                                      const chipColors = STORE_COLORS[s] || STORE_COLORS["Other"];
                                      const isSelected = item.store === s;
                                      return (
                                        <button 
                                          key={s}
                                          onClick={() => { handleUpdateStore(item.id, isSelected ? "" : s); setActiveMenu(null); }}
                                          className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-md border font-semibold transition-all active:scale-95 ${isSelected ? `${chipColors.bg} ${chipColors.text} ${chipColors.border} shadow-sm ring-1 ring-inset ${chipColors.border}` : darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'}`}
                                        >
                                          <StoreLogo storeName={s} />
                                          {s}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}

                          </div>
                        )})}
                      </div>
                    </div>
                  ))}
                    <div className="py-8 border-t border-dashed flex justify-center opacity-40">
                        <button onClick={handleClearList} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-red-500 transition-colors"><RotateCcw className="w-3 h-3" /> Clear List</button>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="cart" className="mt-6 space-y-3">
                {cartItems.length > 0 && (
                  <button onClick={handleCompleteTrip} className="w-full mb-4 bg-primary text-white p-4 rounded-xl font-black shadow-lg uppercase tracking-widest active:scale-95">Complete Trip</button>
                )}
                {cartItems.map(item => (
                  <div key={item.id} className={`flex items-center justify-between p-4 border rounded-xl opacity-60 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
                    <span className="font-semibold text-[13px] line-through">{item.name}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setItems(items.map(i => i.id === item.id ? {...i, checkedOut: false} : i))} className="p-2 text-primary"><RefreshCcw className="w-4 h-4"/></button>
                      <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="p-2 text-red-400"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="history" className="mt-6 space-y-3">
                {historyItems.map(item => {
                  const hasStoreAssigned = Boolean(item.store && item.store !== "Any Store");
                  return (
                  <div key={item.id} className={`flex items-center justify-between p-4 border rounded-xl opacity-80 shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-card'}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[13px]">{item.name}</span>
                        {hasStoreAssigned && (
                          <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${getStoreColor(item.store).badge}`}>
                            <StoreLogo storeName={item.store!} />
                            {item.store}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-black uppercase opacity-50 mt-1">
                        {item.purchaseDates && item.purchaseDates.length > 0 ? getTimeAgo(item.purchaseDates[item.purchaseDates.length - 1]) : "Never purchased"}
                      </p>
                    </div>
                    <button onClick={() => handleAddItem(item.name, undefined, undefined, true)} className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"><RefreshCcw className="w-5 h-5" /></button>
                  </div>
                )})}
                
                {historyItems.length > 0 && (
                  <div className="py-8 border-t border-dashed flex justify-center opacity-40">
                    <button onClick={handleRefreshHabits} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-red-500 transition-colors"><RotateCcw className="w-3 h-3" /> Refresh Habits</button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          {showStats && (
            <div className="lg:col-span-1 space-y-4">
              <div className={`p-1 flex rounded-lg border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                <button onClick={() => setStatView('items')} className={`flex items-center justify-center gap-1.5 flex-1 text-[10px] sm:text-xs font-bold py-2 rounded-md transition-all ${statView === 'items' ? (darkMode ? 'bg-slate-800 text-slate-100 shadow' : 'bg-white text-primary shadow') : 'text-slate-400 hover:text-slate-600'}`}>
                  <ListOrdered className="w-3.5 h-3.5" /> Items
                </button>
                <button onClick={() => setStatView('categories')} className={`flex items-center justify-center gap-1.5 flex-1 text-[10px] sm:text-xs font-bold py-2 rounded-md transition-all ${statView === 'categories' ? (darkMode ? 'bg-slate-800 text-slate-100 shadow' : 'bg-white text-primary shadow') : 'text-slate-400 hover:text-slate-600'}`}>
                  <PieChart className="w-3.5 h-3.5" /> Categories
                </button>
                <button onClick={() => setStatView('stores')} className={`flex items-center justify-center gap-1.5 flex-1 text-[10px] sm:text-xs font-bold py-2 rounded-md transition-all ${statView === 'stores' ? (darkMode ? 'bg-slate-800 text-slate-100 shadow' : 'bg-white text-primary shadow') : 'text-slate-400 hover:text-slate-600'}`}>
                  <Store className="w-3.5 h-3.5" /> Stores
                </button>
              </div>

              {statView === 'items' ? (
                <FrequencyStats data={getItemStats(items)} darkMode={darkMode} />
              ) : statView === 'categories' ? (
                <div className={`rounded-xl border p-6 shadow-sm transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-card'}`}>
                  <h3 className="font-black text-xs uppercase tracking-widest mb-6 opacity-80 flex items-center gap-2"><PieChart className="w-4 h-4 text-primary" /> Category Breakdown</h3>
                  <div className="space-y-5">
                    {categoryData.length === 0 ? (
                      <p className="text-xs opacity-50 text-center py-8 italic">No purchase history yet.</p>
                    ) : (
                      categoryData.map((cat, i) => {
                        const max = categoryData[0].count; 
                        const percentage = Math.max(2, Math.round((cat.count / max) * 100)); 
                        return (
                          <div key={cat.name} className="space-y-1.5 group">
                            <div className="flex justify-between text-[11px] font-bold"><span className="truncate pr-4 opacity-80 group-hover:opacity-100 transition-opacity">{cat.name}</span><span className="opacity-60">{cat.count}</span></div>
                            <div className={`h-2.5 w-full rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-100'} overflow-hidden`}><div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }} /></div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div className={`rounded-xl border p-6 shadow-sm transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-card'}`}>
                  <h3 className="font-black text-xs uppercase tracking-widest mb-6 opacity-80 flex items-center gap-2"><Store className="w-4 h-4 text-primary" /> Store Breakdown</h3>
                  <div className="space-y-5">
                    {storeData.length === 0 ? (
                      <p className="text-xs opacity-50 text-center py-8 italic">No purchase history yet.</p>
                    ) : (
                      storeData.map((st, i) => {
                        const max = storeData[0].count; 
                        const percentage = Math.max(2, Math.round((st.count / max) * 100)); 
                        return (
                          <div key={st.name} className="space-y-1.5 group">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className="flex items-center gap-1.5 truncate pr-4 opacity-80 group-hover:opacity-100 transition-opacity">
                                {st.name !== "Unassigned" && <StoreLogo storeName={st.name} className="w-3 h-3" />}
                                {st.name}
                              </span>
                              <span className="opacity-60">{st.count}</span>
                            </div>
                            <div className={`h-2.5 w-full rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-100'} overflow-hidden`}><div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }} /></div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
