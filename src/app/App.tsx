import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, History, CheckCheck, RefreshCcw, BarChart3, 
  EyeOff, Trash2, AlertTriangle, Bell, Plus, ChevronRight, RotateCcw,
  Moon, Sun, Wind, ChevronUp, ChevronDown, PieChart, ListOrdered, Sparkles
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { AddItemForm } from './components/AddItemForm';
import { GroceryItem as GroceryItemComponent, CheckedOutItem } from './components/GroceryItem';
import { FrequencyStats } from './components/FrequencyStats';
import { GroceryItem } from './types';
import {
  getItemStats,
  saveToLocalStorage,
  loadFromLocalStorage,
} from './utils/groceryUtils';

// --- 1. BULLETPROOF SPEED CART LOGO ---
const SpeedCartIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    preserveAspectRatio="xMidYMid meet"
  >
    <path d="M1 13H5M2 9H4M0 17H6" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" className="animate-pulse" />
    <path d="M10 10C10 10 9 4 12 4C15 4 14 10 14 10" fill="#22c55e" />
    <rect x="14" y="4" width="5" height="7" rx="1" fill="#f97316" />
    <circle cx="11" cy="9" r="3" fill="#ef4444" />
    <path d="M6 7H22L19 15H8.5L6 7Z" fill="#3b82f6" />
    <path d="M3 3H5.5L8.5 15L9.5 18H18" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="11" cy="20" r="2" fill="#1e293b" />
    <circle cx="17" cy="20" r="2" fill="#1e293b" />
    <circle cx="11" cy="20" r="1" fill="#e2e8f0" />
    <circle cx="17" cy="20" r="1" fill="#e2e8f0" />
  </svg>
);

// --- 2. SMART KEYWORD ENGINE ---
const getAutoCategory = (name: string): string | null => {
  const lower = name.toLowerCase();
  
  const categoryKeywords: Record<string, string[]> = {
    "🥬 Produce (Fruits & Veggies)": ["onion", "tomato", "potato", "apple", "banana", "orange", "grape", "spinach", "lettuce", "broccoli", "carrot", "garlic", "ginger", "pepper", "mushroom", "berry", "lemon", "lime", "avocado", "cilantro", "coriander", "okra", "palak", "fruit", "veg", "salad", "watermelon", "strawberry", "blueberry", "melon", "cherry", "peach", "mango", "pineapple", "coconut", "kiwi", "eggplant", "corn", "cucumber"],
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
    if (keywords.some(keyword => lower.includes(keyword))) {
      return category;
    }
  }
  return null;
};

// --- EXPANDED EMOJI DICTIONARY ---
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

const SYNONYM_GROUPS = [
  ["yogurt", "yoghurt", "curd", "dahi"],
  ["cilantro", "coriander", "dhaniya"],
  ["lentils", "dal", "daal", "dhal", "masoor", "toor"],
  ["flour", "atta", "wheat flour"],
  ["diapers", "nappies"],
  ["formula", "baby milk"]
];

const GROCERY_CATEGORIES = [
  "🥬 Produce (Fruits & Veggies)", "🥛 Dairy & Eggs", "🥩 Meat & Seafood",
  "🍞 Bakery", "🥜 Nuts & Seeds", "🥫 Pantry", "❄️ Frozen Foods", 
  "🍿 Snacks & Candy", "🥤 Beverages & Coffee", "🧼 Household & Cleaning", 
  "🧴 Personal & Pet Care", "👶 Baby", "📦 Other"
];

// --- 3. HELPER FUNCTIONS ---
const normalizeName = (name: string) => {
  if (!name) return "";
  const clean = name.replace(/[^\w\s]/gi, "").trim().toLowerCase();
  
  if (clean.endsWith('ies')) return clean.slice(0, -3) + 'y'; 
  if (clean.endsWith('es')) return clean.slice(0, -2);
  if (clean.endsWith('s') && !clean.endsWith('ss')) return clean.slice(0, -1);
  return clean;
};

// --- NEW: TIME AGO CALCULATOR ---
const getTimeAgo = (dateString: string) => {
  if (!dateString) return "Never purchased";
  
  const now = new Date().getTime();
  const past = new Date(dateString).getTime();
  const diffDays = Math.floor((now - past) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Purchased today";
  if (diffDays === 1) return "Purchased yesterday";
  if (diffDays < 7) return `Purchased ${diffDays} days ago`;
  
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Purchased ${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `Purchased ${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  
  const years = Math.floor(diffDays / 365);
  return `Purchased ${years} ${years === 1 ? 'year' : 'years'} ago`;
};

// --- 4. MAIN APP COMPONENT ---
export default function App() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [categoryPrefs, setCategoryPrefs] = useState<Record<string, string>>({});
  const [categoryOrder, setCategoryOrder] = useState<string[]>(GROCERY_CATEGORIES);
  const [showStats, setShowStats] = useState(true);
  
  const [statView, setStatView] = useState<'items' | 'categories'>('items');
  
  const [darkMode, setDarkMode] = useState(false);
  const [dismissedReminders, setDismissedReminders] = useState<string[]>([]);
  const [isBouncing, setIsBouncing] = useState(false);

  useEffect(() => {
    const loadedItems = loadFromLocalStorage();
    setItems(loadedItems);
    
    const savedPrefs = localStorage.getItem('groceryCategoryPrefs');
    if (savedPrefs) setCategoryPrefs(JSON.parse(savedPrefs));
    
    const savedTheme = localStorage.getItem('groceryTheme');
    if (savedTheme === 'dark') setDarkMode(true);

    const savedOrder = localStorage.getItem('groceryCategoryOrder');
    if (savedOrder) {
      const parsedOrder = JSON.parse(savedOrder);
      const mergedOrder = Array.from(new Set([...parsedOrder, ...GROCERY_CATEGORIES]));
      setCategoryOrder(mergedOrder);
    }
  }, []);

  useEffect(() => { saveToLocalStorage(items); }, [items]);
  useEffect(() => { localStorage.setItem('groceryCategoryPrefs', JSON.stringify(categoryPrefs)); }, [categoryPrefs]);
  useEffect(() => { localStorage.setItem('groceryTheme', darkMode ? 'dark' : 'light'); }, [darkMode]);
  useEffect(() => { localStorage.setItem('groceryCategoryOrder', JSON.stringify(categoryOrder)); }, [categoryOrder]);

  // --- PWA DYNAMIC INJECTION ---
  useEffect(() => {
    const rawSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 13H5M2 9H4M0 17H6" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/><path d="M10 10C10 10 9 4 12 4C15 4 14 10 14 10" fill="#22c55e" /><rect x="14" y="4" width="5" height="7" rx="1" fill="#f97316" /><circle cx="11" cy="9" r="3" fill="#ef4444" /><path d="M6 7H22L19 15H8.5L6 7Z" fill="#3b82f6" /><path d="M3 3H5.5L8.5 15L9.5 18H18" stroke="#1e293b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /><circle cx="11" cy="20" r="2" fill="#1e293b" /><circle cx="17" cy="20" r="2" fill="#1e293b" /><circle cx="11" cy="20" r="1" fill="#e2e8f0" /><circle cx="17" cy="20" r="1" fill="#e2e8f0" /></svg>`;
    const base64Svg = "data:image/svg+xml;base64," + btoa(rawSvg);

    const manifest = {
      short_name: "Grocery Run",
      name: "Grocery Run - Smart Organizer",
      icons: [{ src: base64Svg, type: "image/svg+xml", sizes: "any", purpose: "any maskable" }, { src: base64Svg, type: "image/svg+xml", sizes: "512x512", purpose: "maskable" }],
      start_url: "/",
      background_color: "#020617",
      display: "standalone",
      theme_color: "#020617"
    };

    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: "application/json" });
    const manifestUrl = URL.createObjectURL(manifestBlob);

    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (!manifestLink) { manifestLink = document.createElement('link'); manifestLink.rel = 'manifest'; document.head.appendChild(manifestLink); }
    manifestLink.href = manifestUrl;

    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    if (!appleIcon) { appleIcon = document.createElement('link'); appleIcon.rel = 'apple-touch-icon'; document.head.appendChild(appleIcon); }
    appleIcon.href = base64Svg;
    
    let themeMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (!themeMeta) { themeMeta = document.createElement('meta'); themeMeta.name = 'theme-color'; document.head.appendChild(themeMeta); }
    themeMeta.content = '#020617';
  }, []);

  // --- SMART SUGGESTIONS LOGIC ---
  const suggestions = useMemo(() => {
    const today = new Date().getTime();
    return items.filter(item => {
      const isActive = !item.isHistory;
      if (isActive) return false;

      const dates = item.purchaseDates || [];
      if (dates.length < 2) return false; 

      const sortedDates = dates.map(d => new Date(d).getTime()).sort((a, b) => a - b);
      const totalIntervals = sortedDates.length - 1;
      const totalTime = sortedDates[sortedDates.length - 1] - sortedDates[0];
      const avgIntervalDays = (totalTime / totalIntervals) / (1000 * 60 * 60 * 24);

      const lastPurchase = sortedDates[sortedDates.length - 1];
      const daysSince = (today - lastPurchase) / (1000 * 60 * 60 * 24);

      return daysSince >= avgIntervalDays;
    }).slice(0, 5); 
  }, [items]);

  const handleAddItem = (name: string, manualCategory?: string, forceAdd: boolean = false) => {
    const normName = normalizeName(name);
    const existing = items.find(i => !i.isHistory && normalizeName(i.name) === normName);
    
    if (existing && !forceAdd) {
      toast.error(`"${name}" is already here!`, {
        description: `Check your ${existing.checkedOut ? 'cart' : 'list'}.`,
        action: { label: "Add Anyway", onClick: () => handleAddItem(name, manualCategory, true) }
      });
      return;
    }

    const group = SYNONYM_GROUPS.find(g => g.includes(normName));
    if (group && !forceAdd) {
      const existingSynonym = items.find(i => !i.isHistory && group.includes(normalizeName(i.name)));
      if (existingSynonym) {
        toast.info(`Similar item found!`, {
          description: `You have "${existingSynonym.name}" already.`,
          action: { label: "Add Anyway", onClick: () => handleAddItem(name, manualCategory, true) }
        });
        return;
      }
    }

    const emoji = EMOJI_MAP[normName] || "";
    const displayName = emoji ? `${name} ${emoji}` : name;
    
    const isDefaultCategory = !manualCategory || manualCategory === "📦 Other" || manualCategory === "Auto";
    
    const finalCategory = !isDefaultCategory 
      ? manualCategory 
      : categoryPrefs[normName] || getAutoCategory(name) || "📦 Other";

    const historyItem = items.find(i => i.isHistory && normalizeName(i.name) === normName);
    
    if (historyItem) {
      setItems(prev => prev.map(i => i.id === historyItem.id ? { ...i, isHistory: false, checkedOut: false, category: finalCategory } : i));
    } else {
      const newItem: GroceryItem = {
        id: Date.now().toString(),
        name: displayName,
        category: finalCategory,
        purchaseCount: 0,
        purchaseDates: [],
        checkedOut: false,
        isHistory: false,
        addedAt: new Date().toISOString(),
      };
      setItems(prev => [newItem, ...prev]);
    }
    
    if (!isDefaultCategory && manualCategory) {
      setCategoryPrefs(prev => ({ ...prev, [normName]: manualCategory }));
    }
    toast.success(`Added ${name}`);
  };

  const handleCheckout = (id: string) => {
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 250);

    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const newDate = new Date().toISOString();
      const currentDates = Array.isArray(i.purchaseDates) ? i.purchaseDates : [];
      return { 
        ...i, 
        checkedOut: true, 
        purchaseCount: (i.purchaseCount || 0) + 1, 
        purchaseDates: [...currentDates, newDate] 
      };
    }));
  };

  const handleCompleteTrip = () => {
    const newPrefs = { ...categoryPrefs };
    items.forEach(item => {
      if (item.checkedOut) {
        const norm = normalizeName(item.name.replace(/[\u1000-\uFFFF]/g, '').trim());
        if (item.category !== "📦 Other") {
          newPrefs[norm] = item.category;
        }
      }
    });
    setCategoryPrefs(newPrefs);
    setItems(prev => prev.map(i => i.checkedOut ? { ...i, checkedOut: false, isHistory: true } : i));
    toast.success(`Trip completed!`);
  };

  const handleUpdateCategory = (id: string, newCategory: string) => {
    setItems(prev => prev.map(i => {
      if (i.id === id) {
        const norm = normalizeName(i.name.replace(/[\u1000-\uFFFF]/g, '').trim());
        setCategoryPrefs(p => ({ ...p, [norm]: newCategory }));
        return { ...i, category: newCategory };
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
      setItems(prev => prev
        .filter(i => !i.isHistory) 
        .map(i => ({ ...i, purchaseCount: 0, purchaseDates: [] })) 
      );
      toast.success("Habits and statistics refreshed!");
    }
  };

  const moveCategoryUp = (cat: string) => {
    const idx = categoryOrder.indexOf(cat);
    if (idx > 0) {
      const newOrder = [...categoryOrder];
      [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
      setCategoryOrder(newOrder);
    }
  };

  const moveCategoryDown = (cat: string) => {
    const idx = categoryOrder.indexOf(cat);
    if (idx < categoryOrder.length - 1) {
      const newOrder = [...categoryOrder];
      [newOrder[idx + 1], newOrder[idx]] = [newOrder[idx], newOrder[idx + 1]];
      setCategoryOrder(newOrder);
    }
  };

  const activeItems = items.filter(i => !i.isHistory && !i.checkedOut);
  const cartItems = items.filter(i => i.checkedOut && !i.isHistory);
  const historyItems = items.filter(i => i.isHistory);

  const grouped = activeItems.reduce((acc, i) => {
    const cat = i.category || "📦 Other";
    if (!acc[cat]) acc[cat] = []; acc[cat].push(i); return acc;
  }, {} as Record<string, GroceryItem[]>);

  const sortedCats = Object.keys(grouped).sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b));

  const categoryData = React.useMemo(() => {
    const stats = items.reduce((acc, item) => {
      const count = item.purchaseDates?.length || item.purchaseCount || 0;
      if (count > 0) {
        const cat = item.category || "📦 Other";
        acc[cat] = (acc[cat] || 0) + count;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(stats)
      .map(([name, count]) => ({ name, count: count as number }))
      .sort((a, b) => b.count - a.count);
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
              <div className="flex items-center">
                <h1 className="text-3xl font-black tracking-tight uppercase leading-none italic transform -skew-x-12 text-primary">
                  Grocery Run
                </h1>
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2">Smart. Organic. Adaptive.</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-full border transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-yellow-400' : 'bg-white border-slate-200 text-slate-600'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => setShowStats(!showStats)} className="flex items-center gap-2 text-xs px-5 py-2.5 rounded-full font-black border border-primary/20 bg-primary/10 text-primary transition-all">
              {showStats ? <BarChart3 className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {showStats ? "STATS" : "HIDE"}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`${showStats ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
            
            {suggestions.length > 0 && (
              <div className={`rounded-xl border p-4 border-dashed animate-in fade-in slide-in-from-top-4 duration-500 ${darkMode ? 'bg-blue-900/10 border-blue-800/50' : 'bg-blue-50/50 border-blue-200'}`}>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-3 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> Running Low?
                </h3>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map(item => (
                    <button 
                      key={item.id} 
                      onClick={() => handleAddItem(item.name.replace(/[\u1000-\uFFFF]/g, '').trim())} 
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${darkMode ? 'bg-slate-900 border-slate-700 hover:border-primary' : 'bg-white border-slate-200 hover:border-primary shadow-sm'}`}
                    >
                      {item.name} <Plus className="w-3 h-3 text-primary" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={`rounded-xl border p-6 shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-card'}`}>
              <AddItemForm onAddItem={(n, c) => handleAddItem(n, c)} categories={categoryOrder} darkMode={darkMode} />
            </div>

            <Tabs defaultValue="active" className="w-full">
              <TabsList className={`grid w-full grid-cols-3 ${darkMode ? 'bg-slate-900' : ''}`}>
                <TabsTrigger value="active">List ({activeItems.length})</TabsTrigger>
                <TabsTrigger value="cart">Cart ({cartItems.length})</TabsTrigger>
                <TabsTrigger value="history">Habits</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-6 space-y-6">
                {activeItems.length === 0 ? (
                  <div className="text-center py-20 italic text-sm opacity-40">
                    <Package className="w-12 h-12 mx-auto mb-3" />
                    <p>Your harvest list is empty.</p>
                  </div>
                ) : (
                  <>
                  {sortedCats.map(cat => (
                    <div key={cat} className={`rounded-xl p-4 border border-dashed mb-4 ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-card/40 border-muted'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-black text-[10px] text-primary flex items-center gap-2 uppercase tracking-widest opacity-60">
                          {cat} <span className="font-normal bg-muted px-2 py-0.5 rounded-full">{grouped[cat].length}</span>
                        </h3>
                        <div className="flex gap-1">
                          <button onClick={() => moveCategoryUp(cat)} className={`p-1 rounded transition-colors ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`} title="Move Category Up">
                            <ChevronUp className="w-3.5 h-3.5 opacity-50 hover:opacity-100" />
                          </button>
                          <button onClick={() => moveCategoryDown(cat)} className={`p-1 rounded transition-colors ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`} title="Move Category Down">
                            <ChevronDown className="w-3.5 h-3.5 opacity-50 hover:opacity-100" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {grouped[cat].map(item => (
                          <div key={item.id} className={`group flex flex-col p-4 border rounded-xl shadow-sm transition-all ${darkMode ? 'bg-slate-900 border-slate-800 active:bg-slate-800' : 'bg-white active:bg-slate-50'}`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <button onClick={(e) => { e.stopPropagation(); handleCheckout(item.id); }} className="p-1 rounded-full border-2 border-primary/20 text-transparent hover:text-primary transition-colors"><CheckCheck className="w-4 h-4"/></button>
                                <span className="font-semibold text-[13px] truncate">{item.name}</span>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); setItems(items.filter(i => i.id !== item.id)); }} className="p-2 text-red-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>
                            </div>
                            
                            <select 
                              value={item.category} 
                              onChange={(e) => handleUpdateCategory(item.id, e.target.value)}
                              className={`text-[10px] font-bold uppercase p-2 rounded-lg border-none focus:ring-0 w-full cursor-pointer ${darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                            >
                              {categoryOrder.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                    <div className="py-8 border-t border-dashed flex justify-center opacity-40">
                        <button onClick={handleClearList} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-red-500 transition-colors">
                          <RotateCcw className="w-3 h-3" /> Clear List
                        </button>
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
                {historyItems.map(item => (
                  <div key={item.id} className={`flex items-center justify-between p-4 border rounded-xl opacity-80 shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-card'}`}>
                    <div>
                      <span className="font-semibold text-[13px]">{item.name}</span>
                      {/* --- UPDATED: Uses the new getTimeAgo function --- */}
                      <p className="text-[10px] font-black uppercase opacity-50 mt-1">
                        {item.purchaseDates && item.purchaseDates.length > 0 
                          ? getTimeAgo(item.purchaseDates[item.purchaseDates.length - 1]) 
                          : "Never purchased"}
                      </p>
                    </div>
                    <button onClick={() => handleAddItem(item.name.replace(/[\u1000-\uFFFF]/g, '').trim(), undefined, true)} className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"><RefreshCcw className="w-5 h-5" /></button>
                  </div>
                ))}
                
                {historyItems.length > 0 && (
                  <div className="py-8 border-t border-dashed flex justify-center opacity-40">
                    <button onClick={handleRefreshHabits} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-red-500 transition-colors">
                      <RotateCcw className="w-3 h-3" /> Refresh Habits
                    </button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          {showStats && (
            <div className="lg:col-span-1 space-y-4">
              <div className={`p-1 flex rounded-lg border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                <button 
                  onClick={() => setStatView('items')} 
                  className={`flex items-center justify-center gap-2 flex-1 text-xs font-bold py-2 rounded-md transition-all ${statView === 'items' ? (darkMode ? 'bg-slate-800 text-slate-100 shadow' : 'bg-white text-primary shadow') : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <ListOrdered className="w-4 h-4" /> Top Items
                </button>
                <button 
                  onClick={() => setStatView('categories')} 
                  className={`flex items-center justify-center gap-2 flex-1 text-xs font-bold py-2 rounded-md transition-all ${statView === 'categories' ? (darkMode ? 'bg-slate-800 text-slate-100 shadow' : 'bg-white text-primary shadow') : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <PieChart className="w-4 h-4" /> By Category
                </button>
              </div>

              {statView === 'items' ? (
                <FrequencyStats data={getItemStats(items)} darkMode={darkMode} />
              ) : (
                <div className={`rounded-xl border p-6 shadow-sm transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-card'}`}>
                  <h3 className="font-black text-xs uppercase tracking-widest mb-6 opacity-80 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" /> Category Breakdown
                  </h3>
                  
                  <div className="space-y-5">
                    {categoryData.length === 0 ? (
                      <p className="text-xs opacity-50 text-center py-8 italic">No purchase history yet.</p>
                    ) : (
                      categoryData.map((cat, i) => {
                        const max = categoryData[0].count; 
                        const percentage = Math.max(2, Math.round((cat.count / max) * 100)); 
                        
                        return (
                          <div key={cat.name} className="space-y-1.5 group">
                            <div className="flex justify-between text-[11px] font-bold">
                              <span className="truncate pr-4 opacity-80 group-hover:opacity-100 transition-opacity">{cat.name}</span>
                              <span className="opacity-60">{cat.count}</span>
                            </div>
                            <div className={`h-2.5 w-full rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-100'} overflow-hidden`}>
                              <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }} />
                            </div>
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