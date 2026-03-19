// src/constants.ts

export const STORE_OPTIONS = [
  { 
    name: 'Real Canadian Superstore', 
    color: 'bg-[#004EA5] border-[#004EA5] text-white', 
    logo: 'Superstore' 
  },
  { 
    name: 'Costco', 
    color: 'bg-[#E31837] border-[#E31837] text-white', 
    logo: 'COSTCO'
  },
  { 
    name: 'Walmart', 
    color: 'bg-[#0071CE] border-[#0071CE] text-white', 
    logo: 'Walmart'
  },
  { 
    name: 'No Frills', 
    color: 'bg-[#FADC00] border-[#FADC00] text-black', 
    logo: 'no frills'
  },
  { 
    name: 'FreshCo', 
    color: 'bg-[#03A64A] border-[#03A64A] text-white', 
    logo: 'FreshCo.'
  },
  { 
    name: 'Shoppers Drug Mart', 
    color: 'bg-[#E21836] border-[#E21836] text-white', 
    logo: 'SHOPPERS' 
  },
  { 
    name: 'Other', 
    color: 'bg-slate-100 border-slate-300 text-slate-700', 
    logo: 'Other'
  }
];

export const CATEGORY_OPTIONS = [
  { name: 'Produce', icon: 'mdi:leaf' },
  { name: 'Dairy & Eggs', icon: 'mdi:egg-outline' },
  { name: 'Bakery', icon: 'mdi:bread-slice' },
  { name: 'Meat & Seafood', icon: 'mdi:food-drumstick' },
  { name: 'Pantry & Snacks', icon: 'mdi:cookie' },
  { name: 'Rice & Cereal', icon: 'fluent-emoji-flat:sheaf-of-rice' }, // <--- ADDED HERE
  { name: 'Beverages', icon: 'mdi:cup-water' },
  { name: 'Frozen', icon: 'mdi:snowflake' },
  { name: 'Household & Cleaning', icon: 'mdi:broom' },
  { name: 'Pharmacy & Personal Care', icon: 'mdi:pill' },
  { name: 'Pets', icon: 'mdi:paw' },
  { name: 'Baby', icon: 'mdi:baby-carriage' },
  { name: 'General', icon: 'mdi:shopping-outline' }
];

const SPECIFIC_ICON_MAP: Record<string, string> = {
  'onion': 'mdi:onion',
  'tomato': 'mdi:tomato',
  'potato': 'mdi:potato',
  'avocado': 'mdi:avocado',
  'strawberry': 'mdi:fruit-strawberry',
  'blueberries': 'fluent-emoji-flat:blueberries',
  'cherries': 'mdi:fruit-cherries',
  'carrot': 'mdi:carrot',
  'banana': 'mdi:fruit-banana',
  'chicken': 'mdi:food-drumstick',
  'fish': 'mdi:fish',
  'salmon': 'mdi:fish',
  'beef': 'mdi:food-steak',
  'milk': 'mdi:milk',
  'eggs': 'mdi:egg-outline',
  'egg': 'mdi:egg-outline',
  'cheese': 'mdi:cheese',
  'butter': 'mdi:butter',
  'yogurt': 'mdi:cup-water',
  'bread': 'mdi:bread-slice',
  'bagel': 'mdi:bagel',
  'croissant': 'mdi:croissant',
  'soap': 'mdi:soap',
  'detergent': 'mdi:liquid-spot',
  'paper towels': 'mdi:paper-roll-outline',
  'water': 'mdi:water',
  'juice': 'mdi:cup-water',
  'soda': 'mdi:cup-fizz',
  'rice': 'mdi:bowl-rice',
  'pill': 'mdi:pill',
  'vitamins': 'mdi:pill',
  'medicine': 'mdi:pill',
};

export const getItemIcon = (name: string) => {
  const n = name.toLowerCase().trim();
  
  // ==========================================
  // PRODUCE (Fruits & Veggies)
  // ==========================================
  if (n.includes('onion')) return 'fluent-emoji-flat:onion';
  if (n.includes('tomato')) return 'fluent-emoji-flat:tomato';
  if (n.includes('potato')) return 'fluent-emoji-flat:potato';
  if (n.includes('avocado')) return 'fluent-emoji-flat:avocado';
  if (n.includes('carrot')) return 'fluent-emoji-flat:carrot';
  if (n.includes('garlic')) return 'fluent-emoji-flat:garlic';
  if (n.includes('broccoli')) return 'fluent-emoji-flat:broccoli';
  if (n.includes('apple')) return 'fluent-emoji-flat:red-apple';
  if (n.includes('banana')) return 'fluent-emoji-flat:banana';
  if (n.includes('ginger')) return 'fluent-emoji-flat:ginger-root';
  // Catch partials for berries to handle plurals
  if (n.includes('strawberr')) return 'fluent-emoji-flat:strawberry';
  if (n.includes('blueberr') || n.includes('berr')) return 'fluent-emoji-flat:blueberries';
  if (n.includes('cherr')) return 'fluent-emoji-flat:cherries';
  if(n.includes('fruits')) return 'game-icons:fruit-bowl';
 
  // ==========================================
  // PANTRY & SNACKS
  // ==========================================
 
  if (n.includes('breakfast') || n.includes('breakfast items')) return 'fluent-emoji-flat:shallow-pan-of-food';
  

  // ==========================================
  // BAKERY & GRAINS
  // ==========================================
  // Catch typos like "sordough"
  if (n.includes('bread') || n.includes('sordough') || n.includes('sourdough')) return 'fluent-emoji-flat:bread';
  if (n.includes('bagel')) return 'fluent-emoji-flat:bagel';
  if (n.includes('croissant')) return 'fluent-emoji-flat:croissant';
  if (n.includes('cereal') || n.includes('granola') || n.includes('oat')) return 'fluent-emoji-flat:bowl-with-spoon';
  if (n.includes('rice')) return 'fluent-emoji-flat:cooked-rice';
  if (n.includes('pasta')) return 'fluent-emoji-flat:spaghetti';
  if (n.includes('flour') || n.includes('aata')) return 'game-icons:flour';
  if (n.includes('cake')) return 'fluent-emoji-flat:shortcake';
  if (n.includes('cookies') || n.includes('cookie')) return 'fluent-emoji-flat:cookie';

  // ==========================================
  // DAIRY & EGGS
  // ==========================================
  if (n.includes('milk')) return 'fluent-emoji-flat:glass-of-milk';
  if (n.includes('egg')) return 'fluent-emoji-flat:egg';
  if (n.includes('cheese')) return 'fluent-emoji-flat:cheese-wedge';
  if (n.includes('butter')) return 'fluent-emoji-flat:butter';
  if (n.includes('yogurt')) return 'fluent-emoji-flat:cup-with-straw';

  // ==========================================
  // MEAT & SEAFOOD
  // ==========================================
  if (n.includes('chicken') || n.includes('poultry')) return 'fluent-emoji-flat:poultry-leg';
  if (n.includes('beef') || n.includes('steak') || n.includes('meat')) return 'fluent-emoji-flat:cut-of-meat';
  if (n.includes('fish') || n.includes('salmon')) return 'fluent-emoji-flat:fish';
  if (n.includes ('mutton') || n.includes('lamb')) return 'fluent-emoji-flat:meat-on-bone';

  // ==========================================
  // HOUSEHOLD & PHARMACY
  // ==========================================
  if (n.includes('soap')) return 'fluent-emoji-flat:soap';
  if (n.includes('paper') || n.includes('tissue') || n.includes('towel')) return 'fluent-emoji-flat:roll-of-paper';
  if (n.includes('water')) return 'fluent-emoji-flat:droplet';
  if (n.includes('pill') || n.includes('med') || n.includes('vitamin')) return 'fluent-emoji-flat:pill';
  if (n.includes('coffee') || n.includes('tea')) return 'fluent-emoji-flat:hot-beverage';

  // ==========================================
  // DEFAULT FALLBACK
  // ==========================================
  return 'fluent-emoji-flat:shopping-bags';
};
export const getCategoryBgColor = (category?: string) => {
  if (!category) return 'bg-gray-100 border-gray-200 text-gray-600';
  const cat = category.trim();
  switch (cat) {
    case 'Produce': return 'bg-emerald-100 border-emerald-200 text-emerald-800';
    case 'Dairy & Eggs': return 'bg-amber-100 border-amber-200 text-amber-800';
    case 'Meat & Seafood': return 'bg-red-100 border-red-200 text-red-800';
    case 'Bakery': return 'bg-orange-100 border-orange-200 text-orange-800';
    case 'Pantry & Snacks': return 'bg-indigo-100 border-indigo-200 text-indigo-800';
    // CATCH BOTH LEGACY 'Meat' AND NEW 'Meat & Seafood'
    case 'Meat': 
    case 'Meat & Seafood': return 'bg-rose-100 border-rose-300 text-rose-800';
    // ADD THIS NEW LINE:
    case 'Rice & Cereal': return 'bg-teal-100 border-teal-200 text-teal-800'; 
    
    case 'Household & Cleaning': return 'bg-slate-200 border-slate-300 text-slate-700';
    case 'General': return 'bg-stone-200 border-stone-300 text-stone-700';
    default: return 'bg-gray-50 border-gray-200 text-gray-500';
  }
};