import { AddItemForm } from '../components/AddItemForm';
import { Auth } from '../components/Auth';
import { BackupRestore } from '../components/BackupRestore';
import { supabase } from '../utils/supabaseClient';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, CheckCheck, RefreshCcw, BarChart3, 
  Trash2, Plus, Sparkles, Moon, Sun, LogOut, Loader2,
  ListOrdered, History, ShoppingCart
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { GroceryItem } from './types';

// --- HELPERS (Categories & Emojis) ---
const EMOJI_MAP: Record<string, string> = {
  onion: "🧅", tomato: "🍅", milk: "🥛", bread: "🍞", chicken: "🍗", eggs: "🥚", apple: "🍎", banana: "🍌", 
  diaper: "🧷", formula: "🍼", wipe: "🧻", coffee: "☕", water: "💧", beer: "🍺"
};

const getAutoCategory = (name: string): string => {
  const lower = name.toLowerCase();
  const categoryKeywords: Record<string, string[]> = {
    "🥬 Produce": ["onion", "tomato", "potato", "apple", "banana", "spinach", "lettuce", "garlic", "fruit", "veg"],
    "🥛 Dairy & Eggs": ["milk", "cheese", "egg", "butter", "yogurt", "cream", "paneer"],
    "🥩 Meat & Seafood": ["chicken", "beef", "pork", "fish", "salmon", "bacon", "meat"],
    "🍞 Bakery": ["bread", "bun", "bagel", "muffin", "cake", "pita", "tortilla"],
    "👶 Baby": ["diaper", "wipe", "formula", "baby food", "pacifier", "soother"],
    "🧼 Household": ["paper towel", "toilet paper", "soap", "detergent", "clean", "foil", "trash"],
    "🥫 Pantry": ["rice", "dal", "flour", "sugar", "salt", "spice", "oil", "ghee", "cereal", "oat", "honey"]
  };
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lower.includes(keyword))) return category;
  }
  return "📦 Other";
};

const GROCERY_CATEGORIES = ["🥬 Produce", "🥛 Dairy & Eggs", "🥩 Meat & Seafood", "🍞 Bakery", "🍝 Pasta & Grains", "🥜 Nuts & Seeds", "🥫 Pantry", "❄️ Frozen Foods", "🍿 Snacks & Candy", "🥤 Beverages & Coffee", "🧼 Household & Cleaning", "🧴 Personal & Pet Care", "💊 Health & Pharmacy", "👶 Baby", "📦 Other"];
const PRESET_STORES = ["Costco", "FreshCo", "No Frills", "Walmart", "SDM", "Other"];

const normalizeName = (name: string) => name.toLowerCase().replace(/[^\w\s]/gi, "").trim();

const getTimeAgo = (dateString: string | undefined) => {
  if (!dateString) return "First purchase";
  const diffDays = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
};

// --- MAIN APPLICATION ---
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  // 1. Auth & Session Watcher
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch Data from Cloud
  useEffect(() => {
    const fetchItems = async () => {
      if (!session?.user) return;
      const { data, error } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (data) setItems(data);
      if (error) toast.error("Cloud fetch failed");
    };
    fetchItems();
  }, [session]);

  // 3. Predictive Suggestion Engine
  const suggestions = useMemo(() => {
    const today = new Date().getTime();
    return items.filter(item => {
      if (!item.is_history || (item.purchase_dates || []).length < 2) return false;
      const dates = item.purchase_dates!.map(d => new Date(d).getTime()).sort((a, b) => a - b);
      const avgInterval = ((dates[dates.length - 1] - dates[0]) / (dates.length - 1)) / 86400000;
      return ((today - dates[dates.length - 1]) / 86400000) >= avgInterval;
    }).slice(0, 5);
  }, [items]);

  // --- ACTIONS & HANDLERS ---

  const migrateLocalToCloud = async () => {
    const localData = localStorage.getItem('groceryItems');
    if (!localData || !session?.user) return;
    
    setIsMigrating(true);
    const localItems = JSON.parse(localData);
    
    const formatted = localItems.map((i: any) => ({
      name: i.name,
      category: i.category || "📦 Other",
      store: i.store || "",
      purchase_count: i.purchaseCount || i.purchase_count || 0,
      purchase_dates: i.purchaseDates || i.purchase_dates || [],
      is_history: i.isHistory || i.is_history || false,
      checked_out: i.checkedOut || i.checked_out || false,
      user_id: session.user.id
    }));

    const { error } = await supabase.from('grocery_items').insert(formatted);
    if (!error) {
      toast.success("Successfully migrated to Cloud!");
      localStorage.removeItem('groceryItems');
      window.location.reload(); 
    } else {
      toast.error("Migration failed");
    }
    setIsMigrating(false);
  };

  const handleAddItem = async (name: string, manualCategory?: string, manualStore?: string) => {
    if (!name.trim() || !session?.user) return;
    
    const normName = normalizeName(name);
    const finalEmoji = EMOJI_MAP[normName] || "";
    const displayName = finalEmoji ? `${name} ${finalEmoji}` : name;

    const { data, error } = await supabase.from('grocery_items').insert([{
      name: displayName,
      category: manualCategory || getAutoCategory(name),
      store: manualStore || "",
      user_id: session.user.id
    }]).select();

    if (data) setItems(prev => [data[0], ...prev]);
  };

  const handleAddWithSparkle = async (name: string, id: string | number) => {
    setAnimatingId(id.toString());
    const cleanName = name.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
    await handleAddItem(cleanName);
    setTimeout(() => setAnimatingId(null), 800);
  };

  const handleCheckout = async (id: string | number) => {
     // ... keep existing logic
    const item = items.find(i => i.id === id);
    if (!item) return;

    const { error } = await supabase.from('grocery_items').update({ 
      checked_out: true, 
      purchase_count: (item.purchase_count || 0) + 1,
      purchase_dates: [...(item.purchase_dates || []), new Date().toISOString()]
    }).eq('id', id);

    if (!error) setItems(prev => prev.map(i => i.id === id ? { ...i, checked_out: true } : i));
  };

  const handleDelete = async (id: string | number) => {
    const { error } = await supabase.from('grocery_items').delete().eq('id', id);
    if (!error) setItems(prev => prev.filter(i => i.id !== id));
  };
const handleDismiss = async (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation(); 
    
    const now = new Date().toISOString();
    
    // Optimistic UI update: Instantly hide it locally
    setItems(prev => prev.map(i => i.id === id ? { ...i, dismissed_at: now } : i));

    // Background network request
    const { error } = await supabase
      .from('grocery_items')
      .update({ dismissed_at: now })
      .eq('id', id);

    if (error) {
      toast.error("Failed to dismiss item.");
    } else {
      toast.success("Snoozed for 7 days.");
    }
  };
  const handleCompleteTrip = async () => {
    const checkedItems = items.filter(i => i.checked_out && !i.is_history);
    if (checkedItems.length === 0) return;

    const updates = checkedItems.map(i => ({ ...i, checked_out: false, is_history: true }));
    const { error } = await supabase.from('grocery_items').upsert(updates);
    
    if (!error) {
      setItems(prev => prev.map(i => i.checked_out ? { ...i, checked_out: false, is_history: true } : i));
      toast.success("Trip completed! Items moved to History.");
    }
  };

  // --- UI GROUPING ---
  const activeItems = items.filter(i => !i.is_history && !i.checked_out);
  const cartItems = items.filter(i => i.checked_out && !i.is_history);
  const historyItems = items.filter(i => i.is_history);
  
  const grouped = activeItems.reduce((acc, i) => {
    const cat = i.category || "📦 Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(i);
    return acc;
  }, {} as Record<string, GroceryItem[]>);

  if (!session) return <div className={darkMode ? 'dark' : ''}><Auth /></div>;

  return (
    <div className={`min-h-screen p-4 sm:p-8 transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Toaster position="top-center" richColors theme={darkMode ? 'dark' : 'light'} />
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-black italic tracking-tighter text-blue-600 truncate">GROCERY RUN</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">Cloud Sync Enabled</p>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-full shadow-sm border border-slate-200 dark:border-slate-800">
            <BackupRestore />
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-500" />}
            </button>
            <button onClick={() => supabase.auth.signOut()} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full text-slate-400 hover:text-red-500">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* MIGRATION BANNER */}
        {localStorage.getItem('groceryItems') && (
          <button onClick={migrateLocalToCloud} disabled={isMigrating} className="w-full py-3 bg-amber-50 dark:bg-amber-900/10 border border-dashed border-amber-300 rounded-2xl text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center justify-center gap-2 animate-pulse">
            {isMigrating ? <Loader2 className="w-3 h-3 animate-spin" /> : "⚠️ Migrate Local List to Cloud"}
          </button>
        )}

        {/* SUGGESTIONS BAR */}
        {suggestions.length > 0 && (
          <div className="p-4 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-3 flex items-center gap-2"><Sparkles className="w-3 h-3" /> Habits Suggest:</h3>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(item => (
                <button 
                  key={item.id} 
                  onClick={() => handleAddWithSparkle(item.name, item.id)} 
                  className={`px-3 py-1.5 border rounded-full text-xs font-bold transition-all relative ${animatingId === item.id ? 'scale-110 bg-blue-500 text-white border-blue-500' : 'bg-white dark:bg-slate-900 hover:border-blue-300'}`}
                >
                  {item.name} {animatingId === item.id ? <Sparkles className="inline w-3 h-3 ml-1" /> : <Plus className="inline w-3 h-3 ml-1 text-blue-500" />}
                </button>
              ))}
            </div>
          </div>
        )}

        <AddItemForm onAddItem={handleAddItem} categories={GROCERY_CATEGORIES} stores={PRESET_STORES} />

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-slate-900 p-1 rounded-2xl border shadow-sm">
            <TabsTrigger value="active" className="rounded-xl flex gap-2"><ListOrdered className="w-4 h-4" /> List ({activeItems.length})</TabsTrigger>
            <TabsTrigger value="cart" className="rounded-xl flex gap-2"><ShoppingCart className="w-4 h-4" /> Cart ({cartItems.length})</TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl flex gap-2"><History className="w-4 h-4" /> Habits</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6 space-y-6">
            {Object.keys(grouped).sort((a,b) => GROCERY_CATEGORIES.indexOf(a) - GROCERY_CATEGORIES.indexOf(b)).map(cat => (
              <div key={cat} className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">{cat}</h3>
                {grouped[cat].map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border rounded-2xl shadow-sm group">
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleCheckout(item.id)} className="w-6 h-6 rounded-full border-2 border-blue-100 hover:border-blue-500 transition-colors" />
                      <div>
                        <p className="text-sm font-bold">{item.name}</p>
                        <p className="text-[9px] font-black uppercase opacity-40">{item.store || "Any Store"}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="cart" className="mt-6 space-y-3">
            {cartItems.length > 0 && (
              <button onClick={handleCompleteTrip} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all mb-4">
                Complete Trip & Sync Cloud
              </button>
            )}
            {cartItems.map(item => (
              <div key={item.id} className="p-4 bg-white/50 dark:bg-slate-900/50 border border-dashed rounded-2xl opacity-60 flex justify-between items-center">
                <span className="text-sm font-medium line-through">{item.name}</span>
                <CheckCheck className="w-4 h-4 text-green-500" />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="history" className="mt-6 space-y-3">
            {historyItems.map(item => (
              <div key={item.id} className="p-4 bg-white dark:bg-slate-900 border rounded-2xl flex justify-between items-center group">
                <div>
                  <p className="text-sm font-bold">{item.name}</p>
                  <p className="text-[9px] font-black opacity-30 uppercase tracking-tighter">
                    {item.purchase_count} times • {getTimeAgo(item.purchase_dates?.[item.purchase_dates.length - 1])}
                  </p>
                </div>
                <button onClick={() => handleAddItem(item.name)} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <RefreshCcw className="w-4 h-4" />
                </button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}