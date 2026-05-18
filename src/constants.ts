// src/constants.ts

export const STORE_OPTIONS = [
  { 
    name: 'Real Canadian Superstore', 
    color: 'bg-white border-[#004EA5]/20 text-[#004EA5]', 
    logo: 'Superstore', 
    imageLogo: '/logos/superstore.svg' 
  },
  { 
    name: 'Costco', 
    color: 'bg-white border-[#E31837]/20 text-[#E31837]', 
    logo: 'COSTCO', 
    imageLogo: '/logos/costco.svg' 
  },
  { 
    name: 'Walmart', 
    color: 'bg-white border-[#0071CE]/20 text-[#0071CE]', 
    logo: 'Walmart', 
    imageLogo: '/logos/walmart.svg' 
  },
  { 
    name: 'No Frills', 
    color: 'bg-white border-[#FADC00]/50 text-[#8B7A00]', 
    logo: 'no frills', 
    imageLogo: '/logos/nofrills.svg' 
  },
  { 
    name: 'FreshCo', 
    color: 'bg-white border-[#03A64A]/20 text-[#03A64A]', 
    logo: 'FreshCo.', 
    imageLogo: '/logos/freshco.svg' 
  },
  { 
    name: 'Shoppers Drug Mart', 
    color: 'bg-white border-[#E21836]/20 text-[#E21836]', 
    logo: 'SHOPPERS', 
    imageLogo: '/logos/sdm.svg' 
  },
  { 
    name: 'Other', 
    color: 'bg-white border-slate-200 text-slate-600', 
    logo: 'Other' 
  },
  { 
    name: 'Asian Grocery', 
    logo: '🇨🇳 Asian Grocery', 
    color: 'bg-white border-fuchsia-200 text-fuchsia-700' 
  },
  { 
    name: 'Indian Grocery', 
    logo: '🇮🇳 Indian Grocery', 
    color: 'bg-white border-teal-200 text-teal-700'
  }
];

// CRITICAL: App.tsx expects 'CATEGORIES', so we use that name here.
export const CATEGORIES = [
  { name: 'Produce', icon: 'mdi:leaf' },
  { name: 'Bakery', icon: 'mdi:bread-slice' },
  { name: 'Meat & Seafood', icon: 'mdi:food-drumstick' },
  { name: 'Dairy & Eggs', icon: 'mdi:egg-outline' },
  { name: 'Rice & Wheat', icon: 'mdi:barley' },
  { name: 'Pasta & Noodles', icon: 'mdi:noodles' },
  { name: 'Breakfast & Cereal', icon: 'mdi:bowl' },
  { name: 'Cooking Essentials', icon: 'mdi:shaker' },
  { name: 'Dessert & Snacks', icon: 'mdi:cookie' },
  { name: 'Beverages', icon: 'mdi:cup-water' },
  { name: 'Frozen', icon: 'mdi:snowflake' },
  { name: 'Household & Cleaning', icon: 'mdi:broom' },
  { name: 'Pharmacy & Personal Care', icon: 'mdi:pill' },
  { name: 'Baby', icon: 'mdi:baby-carriage' },
  { name: 'General', icon: 'mdi:shopping-outline' }
];

// Only declared ONCE here to prevent redeclaration errors
export const getCategoryBgColor = (category?: string) => {
  if (!category) return 'bg-gray-100 border-gray-200 text-gray-600';
  const cat = category.trim();
  switch (cat) {
    case 'Produce': return 'bg-emerald-100 border-emerald-200 text-emerald-800';
    case 'Bakery': return 'bg-orange-100 border-orange-200 text-orange-800';
    case 'Meat': 
    case 'Meat & Seafood': return 'bg-rose-100 border-rose-300 text-rose-800';
    case 'Dairy & Eggs': return 'bg-amber-100 border-amber-200 text-amber-800';
    case 'Rice & Wheat': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    case 'Pasta & Noodles': return 'bg-red-50 border-red-200 text-red-700';
    case 'Breakfast & Cereal': return 'bg-teal-100 border-teal-200 text-teal-800';
    case 'Cooking Essentials': return 'bg-amber-50 border-amber-200 text-amber-700';
    case 'Dessert & Snacks': return 'bg-indigo-100 border-indigo-200 text-indigo-800';
    case 'Household & Cleaning': return 'bg-slate-200 border-slate-300 text-slate-700';
    case 'General': return 'bg-stone-200 border-stone-300 text-stone-700';
    default: return 'bg-gray-50 border-gray-200 text-gray-500';
  }
};

export const getItemIcon = (name: string): string => {
  const n = name.toLowerCase().trim();

  // ==========================================
  // SPECIFIC/NEW ICONIFY MAPPINGS
  // ==========================================
  if (n.includes('honey')) return 'fluent-emoji-flat:honey-pot';
  if (n.includes('breakfast')) return 'fluent-emoji-flat:shallow-pan-of-food';
  if (n.includes('fruit')) return 'game-icons:fruit-bowl';
  if (n.includes('cake')) return 'fluent-emoji-flat:shortcake';
  if (n.includes('flour') || n.includes('aata') || n.includes('besan')) return 'game-icons:flour';
  if (n.includes('baking powder') || n.includes('baking soda')) return 'fluent-emoji-flat:salt';

  // ==========================================
  // PRODUCE 
  // ==========================================
  if (n.includes('onion')) return 'fluent-emoji-flat:onion';
  if (n.includes('tomato')) return 'fluent-emoji-flat:tomato';
  if (n.includes('potato')) return 'fluent-emoji-flat:potato';
  if (n.includes('avocado')) return 'fluent-emoji-flat:avocado';
  if (n.includes('carrot')) return 'fluent-emoji-flat:carrot';
  if (n.includes('garlic')) return 'fluent-emoji-flat:garlic';
  if (n.includes('apple')) return 'fluent-emoji-flat:red-apple';
  if (n.includes('banana')) return 'fluent-emoji-flat:banana';
  if (n.includes('ginger')) return 'fluent-emoji-flat:ginger-root';
  if (n.includes('strawberr')) return 'fluent-emoji-flat:strawberry';
  if (n.includes('blueberr') || n.includes('berr')) return 'fluent-emoji-flat:blueberries';
  if (n.includes('cherr')) return 'fluent-emoji-flat:cherries';
  if (n.includes('aubergine') || n.includes('eggplant')) return 'fluent-emoji-flat:eggplant';
  if (n.includes('cucumber')) return 'fluent-emoji-flat:cucumber';
  if (n.includes('parsley') || n.includes('herb') || n.includes('coriander') || n.includes('cilantro')) return 'fluent-emoji-flat:herb';
  if (n.includes('kiwi')) return 'fluent-emoji-flat:kiwi-fruit';
  if (n.includes('clementine') || n.includes('tangerine') || n.includes('mandarin')) return 'fluent-emoji-flat:tangerine';
  if (n.includes('coconut')) return 'fluent-emoji-flat:coconut';

  // ==========================================
  // BAKERY, GRAINS & PANTRY
  // ==========================================
  if (n.includes('bread') || n.includes('sourdough')) return 'fluent-emoji-flat:bread';
  if (n.includes('bagel')) return 'fluent-emoji-flat:bagel';
  if (n.includes('croissant')) return 'fluent-emoji-flat:croissant';
  if (n.includes('cereal') || n.includes('granola') || n.includes('oat')) return 'fluent-emoji-flat:bowl-with-spoon';
  if (n.includes('rice')) return 'fluent-emoji-flat:cooked-rice';
  if (n.includes('pasta')) return 'fluent-emoji-flat:spaghetti';
  if (n.includes('noodle') || n.includes('ramen')) return 'fluent-emoji-flat:steaming-bowl';
  if (n.includes('cookies') || n.includes('cookie') || n.includes('biscuit')) return 'fluent-emoji-flat:cookie';
  if (n.includes('soy sauce') || n.includes('soya sauce')) return 'fluent-emoji-flat:sake';
  
  // ==========================================
  // DAIRY & EGGS
  // ==========================================
  if (n.includes('milk') || n.includes('creamer')) return 'fluent-emoji-flat:glass-of-milk';
  if (n.includes('egg')) return 'fluent-emoji-flat:egg';
  if (n.includes('cheese')) return 'fluent-emoji-flat:cheese-wedge';
  if (n.includes('butter')) return 'fluent-emoji-flat:butter';
  if (n.includes('yogurt')) return 'fluent-emoji-flat:cup-with-straw';

  // ==========================================
  // BEVERAGES
  // ==========================================
  if (n.includes('coffee') || n.includes('tea')) return 'fluent-emoji-flat:hot-beverage';
  if (n.includes('juice')) return 'fluent-emoji-flat:beverage-box';

  // ==========================================
  // MEAT & SEAFOOD
  // ==========================================
  if (n.includes('chicken') || n.includes('poultry')) return 'fluent-emoji-flat:poultry-leg';
  if (n.includes('beef') || n.includes('steak') || n.includes('meat')) return 'fluent-emoji-flat:cut-of-meat';
  if (n.includes('fish') || n.includes('salmon')) return 'fluent-emoji-flat:fish';
  if (n.includes('mutton') || n.includes('lamb')) return 'fluent-emoji-flat:meat-on-bone';

  // ==========================================
  // HOUSEHOLD & PHARMACY
  // ==========================================
  if (n.includes('soap')) return 'fluent-emoji-flat:soap';
  if (n.includes('paper') || n.includes('tissue') || n.includes('towel')) return 'fluent-emoji-flat:roll-of-paper';
  if (n.includes('water')) return 'fluent-emoji-flat:droplet';
  if (n.includes('pill') || n.includes('med') || n.includes('vitamin')) return 'fluent-emoji-flat:pill';

  // ==========================================
  // FROZEN
  // ==========================================
  if (n.includes('ice cream')) return 'fluent-emoji-flat:ice-cream';
  if (n.includes('frozen')) return 'fluent-emoji-flat:snowflake';

  return 'fluent-emoji-flat:shopping-bags';
};