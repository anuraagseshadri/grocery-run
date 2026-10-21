// src/constants.ts

// src/constants.ts

export const STORE_OPTIONS = [
  { 
    name: 'Real Canadian Superstore', 
    color: 'bg-blue-50 border-blue-200 text-blue-800', 
    logo: 'Superstore', 
    imageLogo: '/logos/superstore.svg',
    logoClass: 'h-6 sm:h-7 max-w-[130px]' // Wide wordmark
  },
  { 
    name: 'Costco', 
    color: 'bg-red-50 border-red-200 text-red-800', 
    logo: 'COSTCO', 
    imageLogo: '/logos/costco.svg',
    logoClass: 'h-6 sm:h-7 max-w-[100px]' // Compact emblem
  },
  { 
    name: 'Walmart', 
    color: 'bg-sky-50 border-sky-200 text-sky-800', 
    logo: 'Walmart', 
    imageLogo: '/logos/walmart.svg',
    logoClass: 'h-5 sm:h-6 max-w-[110px]' // Very wide wordmark
  },
  { 
    name: 'No Frills', 
    color: 'bg-yellow-50 border-yellow-300 text-yellow-900', 
    logo: 'no frills', 
    imageLogo: '/logos/nofrills.svg',
    logoClass: 'h-6 sm:h-7 max-w-[120px]' // Wide wordmark
  },
  { 
    name: 'FreshCo', 
    color: 'bg-emerald-50 border-emerald-300 text-emerald-900', 
    logo: 'FreshCo.', 
    imageLogo: '/logos/freshco.svg',
    logoClass: 'h-6 sm:h-7 max-w-[110px]' // Standard wordmark
  },
  { 
    name: 'Shoppers Drug Mart', 
    color: 'bg-rose-50 border-rose-200 text-rose-800', 
    logo: 'SHOPPERS', 
    imageLogo: '/logos/sdm.svg',
    logoClass: 'h-7 sm:h-8 max-w-[140px]' // Compact wordmark / slightly taller optical weight
  },
  { 
    name: "Farmers' Market", 
    color: 'bg-amber-100/80 border-amber-300 text-amber-950 shadow-sm', 
    logo: " FARMERS' MARKET" 
  },
  { 
    name: 'Asian Grocery', 
    logo: 'ASIAN GROCERY', 
    color: 'bg-gradient-to-r from-red-700 to-rose-900 text-white border-red-900 shadow-sm' 
  },
  { 
    name: 'Indian Grocery', 
    logo: 'INDIAN GROCERY', 
    color: 'bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808] text-slate-900 border-slate-300 shadow-sm'
  },
  { 
    name: 'Other', 
    color: 'bg-white border-slate-200 text-slate-600', 
    logo: 'Other' 
  }
];

export const CATEGORY_NAMES = {
  PRODUCE: 'Produce',
  BAKERY: 'Bakery',
  MEAT_AND_SEAFOOD: 'Meat & Seafood',
  DAIRY_AND_EGGS: 'Dairy & Eggs',
  RICE_AND_WHEAT: 'Rice & Wheat',
  PASTA_AND_NOODLES: 'Pasta & Noodles',
  BREAKFAST_AND_CEREAL: 'Breakfast & Cereal',
  COOKING_ESSENTIALS: 'Cooking Essentials',
  NUTS_AND_SEEDS: 'Nuts & Seeds',
  DESSERT_AND_SNACKS: 'Dessert & Snacks',
  DRINKS_AND_BEVERAGES: 'Drinks & Beverages', 
  FROZEN: 'Frozen',
  HOUSEHOLD_AND_CLEANING: 'Household & Cleaning',
  PHARMACY_AND_PERSONAL_CARE: 'Pharmacy & Personal Care',
  BABY: 'Baby',
  PANTRY: 'Pantry',
  EVERYDAY_AND_RETAIL: 'Everyday & Retail'
} as const;

export const CATEGORIES = [
  { name: CATEGORY_NAMES.PRODUCE, icon: 'mdi:leaf' },
  { name: CATEGORY_NAMES.BAKERY, icon: 'mdi:bread-slice' },
  { name: CATEGORY_NAMES.MEAT_AND_SEAFOOD, icon: 'mdi:food-drumstick' },
  { name: CATEGORY_NAMES.DAIRY_AND_EGGS, icon: 'mdi:egg-outline' },
  { name: CATEGORY_NAMES.RICE_AND_WHEAT, icon: 'mdi:barley' },
  { name: CATEGORY_NAMES.PASTA_AND_NOODLES, icon: 'mdi:noodles' },
  { name: CATEGORY_NAMES.BREAKFAST_AND_CEREAL, icon: 'mdi:bowl' },
  { name: CATEGORY_NAMES.COOKING_ESSENTIALS, icon: 'mdi:shaker' },
  { name: CATEGORY_NAMES.NUTS_AND_SEEDS, icon: 'mdi:peanut-outline' },
  { name: CATEGORY_NAMES.DESSERT_AND_SNACKS, icon: 'mdi:cookie' },
  { name: CATEGORY_NAMES.DRINKS_AND_BEVERAGES, icon: 'mdi:cup-water' }, 
  { name: CATEGORY_NAMES.FROZEN, icon: 'mdi:snowflake' },
  { name: CATEGORY_NAMES.HOUSEHOLD_AND_CLEANING, icon: 'mdi:broom' },
  { name: CATEGORY_NAMES.PHARMACY_AND_PERSONAL_CARE, icon: 'mdi:pill' },
  { name: CATEGORY_NAMES.BABY, icon: 'mdi:baby-carriage' },
  { name: CATEGORY_NAMES.PANTRY, icon: 'mdi:cupboard-outline' },
  { name: CATEGORY_NAMES.EVERYDAY_AND_RETAIL, icon: 'mdi:basket-outline' },
];

// Automatically normalizes legacy category strings ("General", "Pantry & Snacks", "Beverages", etc.)
export const normalizeCategoryName = (category?: string): string => {
  const raw = category?.trim();
  if (!raw || raw === 'General' || raw === 'Unknown' || raw === 'Pantry & Snacks') {
    return CATEGORY_NAMES.PANTRY;
  }
  if (raw === 'Beverages') return CATEGORY_NAMES.DRINKS_AND_BEVERAGES;
  if (raw === 'Nuts & Spices') return CATEGORY_NAMES.NUTS_AND_SEEDS;
  if (raw === 'Other' || raw === 'Retail' || raw === 'Hardware') return CATEGORY_NAMES.EVERYDAY_AND_RETAIL;
  return raw;
};

// Uses Iconify vector icons so every category (including Pantry's kitchen shelf) renders a crisp icon
export const getCategoryIcon = (category?: string): string => {
  const cleanCat = normalizeCategoryName(category);
  switch (cleanCat) {
    case CATEGORY_NAMES.PRODUCE: return 'mdi:leaf';
    case CATEGORY_NAMES.DAIRY_AND_EGGS: return 'mdi:water-outline';
    case CATEGORY_NAMES.MEAT_AND_SEAFOOD: return 'mdi:food-drumstick-outline';
    case CATEGORY_NAMES.BAKERY: return 'mdi:croissant';
    case CATEGORY_NAMES.FROZEN: return 'mdi:snowflake';
    case CATEGORY_NAMES.DRINKS_AND_BEVERAGES: return 'mdi:cup-water';
    case CATEGORY_NAMES.HOUSEHOLD_AND_CLEANING: return 'mdi:broom';
    case CATEGORY_NAMES.PHARMACY_AND_PERSONAL_CARE: return 'mdi:medical-bag';
    case CATEGORY_NAMES.DESSERT_AND_SNACKS: return 'mdi:cookie-outline';
    case CATEGORY_NAMES.RICE_AND_WHEAT: return 'mdi:barley'; 
    case CATEGORY_NAMES.PASTA_AND_NOODLES: return 'mdi:noodles'; 
    case CATEGORY_NAMES.BREAKFAST_AND_CEREAL: return 'mdi:bowl-mix-outline'; 
    case CATEGORY_NAMES.COOKING_ESSENTIALS: return 'mdi:shaker-outline'; 
    case CATEGORY_NAMES.NUTS_AND_SEEDS: return 'mdi:peanut-outline';
    case CATEGORY_NAMES.BABY: return 'mdi:baby-face-outline'; 
    case CATEGORY_NAMES.PANTRY: return 'mdi:cupboard-outline';
    case CATEGORY_NAMES.EVERYDAY_AND_RETAIL: return 'mdi:basket-outline';
    default: return 'mdi:cupboard-outline';
  }
};

export const getCategoryBgColor = (category?: string) => {
  const cat = normalizeCategoryName(category);
  
  switch (cat) {
    case CATEGORY_NAMES.PRODUCE: return 'bg-emerald-100 border-emerald-200 text-emerald-800';
    case CATEGORY_NAMES.BAKERY: return 'bg-orange-100 border-orange-200 text-orange-800';
    case CATEGORY_NAMES.MEAT_AND_SEAFOOD: return 'bg-rose-100 border-rose-300 text-rose-800';
    case CATEGORY_NAMES.DAIRY_AND_EGGS: return 'bg-amber-100 border-amber-200 text-amber-800';
    case CATEGORY_NAMES.RICE_AND_WHEAT: return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    case CATEGORY_NAMES.PASTA_AND_NOODLES: return 'bg-red-50 border-red-200 text-red-700';
    case CATEGORY_NAMES.BREAKFAST_AND_CEREAL: return 'bg-teal-100 border-teal-200 text-teal-800';
    case CATEGORY_NAMES.COOKING_ESSENTIALS: return 'bg-amber-50 border-amber-200 text-amber-700';
    case CATEGORY_NAMES.NUTS_AND_SEEDS: return 'bg-stone-200/80 border-amber-800/30 text-amber-950';
    case CATEGORY_NAMES.DESSERT_AND_SNACKS: return 'bg-indigo-100 border-indigo-200 text-indigo-800';
    case CATEGORY_NAMES.DRINKS_AND_BEVERAGES: return 'bg-cyan-100 border-cyan-200 text-cyan-800';
    case CATEGORY_NAMES.BABY: return 'bg-pink-100 border-pink-200 text-pink-800';
    case CATEGORY_NAMES.HOUSEHOLD_AND_CLEANING: return 'bg-slate-200 border-slate-300 text-slate-700';
    case CATEGORY_NAMES.PHARMACY_AND_PERSONAL_CARE: return 'bg-purple-100 border-purple-200 text-purple-800'; 
    case CATEGORY_NAMES.FROZEN: return 'bg-blue-100 border-blue-200 text-blue-800'; 
    case CATEGORY_NAMES.PANTRY: return 'bg-stone-100 border-stone-300 text-stone-700';
    case CATEGORY_NAMES.EVERYDAY_AND_RETAIL: return 'bg-zinc-100 border-zinc-300 text-zinc-800';
    default: return 'bg-stone-100 border-stone-300 text-stone-700';
  }
};

// Helper to match whole words (prevents "nut" from matching inside "coconut", "donut", or "butternut")
const hasWord = (text: string, word: string) => new RegExp(`\\b${word}s?\\b`, 'i').test(text);

export const getItemIcon = (name: string, category?: string): string => {
  const n = name.toLowerCase().trim();

  // ==========================================
  // 1. COMPOUND & SPECIFIC OVERRIDES (HIGHEST PRIORITY)
  // ==========================================
  if (n.includes('coconut')) return 'fluent-emoji-flat:coconut';
  if (n.includes('pineapple')) return 'fluent-emoji-flat:pineapple';
  if (n.includes('eggplant') || n.includes('aubergine')) return 'fluent-emoji-flat:eggplant';
  if (n.includes('butternut')) return 'fluent-emoji-flat:potato';
  if (n.includes('donut') || n.includes('doughnut')) return 'fluent-emoji-flat:doughnut';
  if (n.includes('cereal') || n.includes('cheerio') || n.includes('granola') || hasWord(n, 'oat')) return 'fluent-emoji-flat:bowl-with-spoon';
  if (n.includes('bell pepper') || n.includes('sweet pepper') || n.includes('green pepper') || n.includes('red pepper') || n.includes('capsicum')) return 'fluent-emoji-flat:bell-pepper';
  if (n.includes('chili') || n.includes('chilli') || n.includes('jalapeno') || n.includes('habanero') || n.includes('hot pepper')) return 'fluent-emoji-flat:hot-pepper';
  if (n.includes('coke') || n.includes('cola') || n.includes('pepsi')) return 'fluent-emoji-flat:bottle-with-popping-cork';
  if (n.includes('shrimp') || n.includes('prawn')) return 'fluent-emoji-flat:shrimp';
  if (n.includes('diaper') || n.includes('nappy')) return 'fluent-emoji-flat:baby-symbol';
  if (n.includes('ice cream')) return 'fluent-emoji-flat:ice-cream';
  if (n.includes('soy sauce') || n.includes('soya sauce')) return 'fluent-emoji-flat:sake';
  if (n.includes('baking powder') || n.includes('baking soda')) return 'fluent-emoji-flat:salt';
  if (n.includes('paneer') || n.includes('cottage cheese')) return 'fluent-emoji-flat:cheese-wedge';
  if (n.includes('motor oil') || n.includes('engine oil') || n.includes('wiper')) return 'fluent-emoji-flat:oil-drum';
  if (n.includes('paper towel') || n.includes('toilet paper')) return 'fluent-emoji-flat:roll-of-paper';

  // ==========================================
  // 2. PRODUCE (FRUITS, VEGETABLES & HERBS)
  // ==========================================
  if (n.includes('onion') || n.includes('scallion') || n.includes('shallot')) return 'fluent-emoji-flat:onion';
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
  if (n.includes('cucumber') || n.includes('zucchini') || n.includes('courgette')) return 'fluent-emoji-flat:cucumber';
  if (n.includes('parsley') || n.includes('herb') || n.includes('coriander') || n.includes('cilantro') || n.includes('mint') || n.includes('basil')) return 'fluent-emoji-flat:herb';
  if (n.includes('spinach') || n.includes('lettuce') || n.includes('kale') || n.includes('greens') || n.includes('salad')) return 'fluent-emoji-flat:leafy-green';
  if (n.includes('broccoli')) return 'fluent-emoji-flat:broccoli';
  if (n.includes('corn')) return 'fluent-emoji-flat:ear-of-corn';
  if (n.includes('mushroom')) return 'fluent-emoji-flat:mushroom';
  if (n.includes('lemon') || n.includes('lime')) return 'fluent-emoji-flat:lemon';
  if (n.includes('orange') || n.includes('clementine') || n.includes('tangerine') || n.includes('mandarin')) return 'fluent-emoji-flat:tangerine';
  if (n.includes('mango')) return 'fluent-emoji-flat:mango';
  if (n.includes('grape')) return 'fluent-emoji-flat:grapes';
  if (n.includes('watermelon') || n.includes('melon')) return 'fluent-emoji-flat:watermelon';
  if (n.includes('peach') || n.includes('nectarine')) return 'fluent-emoji-flat:peach';
  if (n.includes('pear')) return 'fluent-emoji-flat:pear';
  if (n.includes('kiwi')) return 'fluent-emoji-flat:kiwi-fruit';
  if (n.includes('fruit')) return 'game-icons:fruit-bowl';

  // ==========================================
  // 3. DAIRY & EGGS
  // ==========================================
  if (n.includes('milk') || n.includes('creamer')) return 'fluent-emoji-flat:glass-of-milk';
  if (hasWord(n, 'egg')) return 'fluent-emoji-flat:egg';
  if (n.includes('cheese')) return 'fluent-emoji-flat:cheese-wedge';
  if (n.includes('butter') || n.includes('ghee')) return 'fluent-emoji-flat:butter';
  if (n.includes('yogurt') || n.includes('curd')) return 'fluent-emoji-flat:cup-with-straw';

  // ==========================================
  // 4. BAKERY, GRAINS & PASTA
  // ==========================================
  if (n.includes('bread') || n.includes('sourdough') || n.includes('loaf') || n.includes('bun') || n.includes('pita') || n.includes('naan') || n.includes('tortilla')) return 'fluent-emoji-flat:bread';
  if (n.includes('bagel')) return 'fluent-emoji-flat:bagel';
  if (n.includes('croissant')) return 'fluent-emoji-flat:croissant';
  if (n.includes('cake') || n.includes('muffin') || n.includes('cupcake')) return 'fluent-emoji-flat:shortcake';
  if (n.includes('flour') || n.includes('aata') || n.includes('atta') || n.includes('besan') || n.includes('maida')) return 'game-icons:flour';
  if (hasWord(n, 'rice') || n.includes('basmati') || n.includes('jasmine')) return 'fluent-emoji-flat:cooked-rice';
  if (n.includes('pasta') || n.includes('spaghetti') || n.includes('macaroni') || n.includes('penne')) return 'fluent-emoji-flat:spaghetti';
  if (n.includes('noodle') || n.includes('ramen') || n.includes('maggi')) return 'fluent-emoji-flat:steaming-bowl';
  if (n.includes('cookie') || n.includes('biscuit')) return 'fluent-emoji-flat:cookie';
  if (n.includes('chocolate') || n.includes('candy')) return 'fluent-emoji-flat:chocolate-bar';
  if (n.includes('popcorn')) return 'fluent-emoji-flat:popcorn';

  // ==========================================
  // 5. NUTS & SEEDS (Whole-word safe so it never steals Coconut)
  // ==========================================
  if (n.includes('chestnut') || n.includes('hazelnut') || n.includes('acorn')) return 'fluent-emoji-flat:chestnut';
  if (
    n.includes('pistachio') || 
    n.includes('cashew') || 
    n.includes('almond') || 
    n.includes('walnut') || 
    n.includes('pecan') || 
    n.includes('macadamia') || 
    n.includes('peanut') || 
    hasWord(n, 'nut')
  ) {
    return 'fluent-emoji-flat:peanuts';
  }
  if (
    n.includes('chia') || 
    n.includes('flax') || 
    n.includes('hemp') || 
    n.includes('pumpkin seed') || 
    n.includes('sunflower seed') || 
    n.includes('sesame') || 
    hasWord(n, 'seed')
  ) {
    return 'fluent-emoji-flat:seedling';
  }

  // ==========================================
  // 6. COOKING ESSENTIALS & SPICES
  // ==========================================
  if (n.includes('honey')) return 'fluent-emoji-flat:honey-pot';
  if (n.includes('sugar') || n.includes('jaggery')) return 'mdi:cube-outline';
  if (
    hasWord(n, 'salt') || 
    n.includes('spice') || 
    n.includes('masala') || 
    n.includes('turmeric') || 
    n.includes('cumin') || 
    n.includes('pepper') || 
    n.includes('cinnamon') || 
    n.includes('cardamom') || 
    n.includes('clove') || 
    n.includes('nutmeg') || 
    n.includes('paprika')
  ) {
    return 'fluent-emoji-flat:salt';
  }

  // ==========================================
  // 7. MEAT & SEAFOOD
  // ==========================================
  if (n.includes('chicken') || n.includes('poultry') || n.includes('turkey')) return 'fluent-emoji-flat:poultry-leg';
  if (n.includes('beef') || n.includes('steak') || n.includes('pork') || n.includes('bacon') || n.includes('meat')) return 'fluent-emoji-flat:cut-of-meat';
  if (n.includes('fish') || n.includes('salmon') || n.includes('tuna') || n.includes('tilapia') || n.includes('cod')) return 'fluent-emoji-flat:fish';
  if (n.includes('mutton') || n.includes('lamb') || n.includes('goat')) return 'fluent-emoji-flat:meat-on-bone';

  // ==========================================
  // 8. DRINKS & BEVERAGES
  // ==========================================
  if (n.includes('coffee') || hasWord(n, 'tea') || n.includes('chai')) return 'fluent-emoji-flat:hot-beverage';
  if (n.includes('juice')) return 'fluent-emoji-flat:beverage-box';
  if (n.includes('water') || n.includes('soda') || n.includes('beer') || n.includes('wine') || n.includes('beverage') || n.includes('drink')) return 'fluent-emoji-flat:cup-with-straw';

  // ==========================================
  // 9. EVERYDAY & RETAIL (HARDWARE, ELECTRONICS, APPAREL)
  // ==========================================
  if (n.includes('hammer') || n.includes('mallet')) return 'fluent-emoji-flat:hammer';
  if (n.includes('wrench') || n.includes('spanner') || n.includes('pliers') || n.includes('tool')) return 'fluent-emoji-flat:wrench';
  if (n.includes('screwdriver') || n.includes('screw') || n.includes('nail') || n.includes('bolt') || n.includes('drill')) return 'fluent-emoji-flat:screwdriver';
  if (n.includes('bulb') || n.includes('light') || n.includes('lamp') || n.includes('flashlight')) return 'fluent-emoji-flat:light-bulb';
  if (n.includes('batter')) return 'fluent-emoji-flat:battery';
  if (n.includes('paint') || n.includes('roller') || n.includes('brush')) return 'fluent-emoji-flat:paintbrush';
  if (n.includes('charger') || n.includes('cable') || n.includes('cord') || n.includes('usb') || n.includes('adapter') || n.includes('plug')) return 'fluent-emoji-flat:electric-plug';
  if (n.includes('headphone') || n.includes('earbud')) return 'fluent-emoji-flat:headphone';
  if (n.includes('sock')) return 'fluent-emoji-flat:socks';
  if (n.includes('shirt') || n.includes('t-shirt') || n.includes('tee') || n.includes('top') || n.includes('jacket') || n.includes('coat') || n.includes('hoodie')) return 'fluent-emoji-flat:t-shirt';
  if (n.includes('pant') || n.includes('jean') || n.includes('trouser') || n.includes('short')) return 'fluent-emoji-flat:jeans';
  if (n.includes('shoe') || n.includes('sneaker') || n.includes('boot') || n.includes('slipper') || n.includes('sandal')) return 'fluent-emoji-flat:running-shoe';
  if (n.includes('umbrella')) return 'fluent-emoji-flat:umbrella';
  if (n.includes('backpack') || n.includes('bag') || n.includes('luggage')) return 'fluent-emoji-flat:backpack';
  if (n.includes('candle')) return 'fluent-emoji-flat:candle';
  if (n.includes('book') || n.includes('notebook') || n.includes('journal')) return 'fluent-emoji-flat:notebook';
  if (hasWord(n, 'pen') || n.includes('pencil') || n.includes('marker')) return 'fluent-emoji-flat:pen';
  if (n.includes('box') || n.includes('bin') || n.includes('tote') || n.includes('organizer') || n.includes('storage')) return 'fluent-emoji-flat:package';

  // ==========================================
  // 10. HOUSEHOLD, PHARMACY, BABY & FROZEN
  // ==========================================
  if (n.includes('soap') || n.includes('shampoo') || n.includes('body wash') || n.includes('lotion')) return 'fluent-emoji-flat:soap';
  if (n.includes('paper') || n.includes('tissue') || n.includes('towel') || n.includes('napkin')) return 'fluent-emoji-flat:roll-of-paper';
  if (n.includes('pill') || n.includes('med') || n.includes('vitamin') || n.includes('advil') || n.includes('tylenol')) return 'fluent-emoji-flat:pill';
  if (n.includes('baby') || n.includes('wipes')) return 'fluent-emoji-flat:baby-symbol';
  if (n.includes('frozen')) return 'fluent-emoji-flat:snowflake';
  if (n.includes('breakfast')) return 'fluent-emoji-flat:shallow-pan-of-food';

  // ==========================================
  // 11. CATEGORY-AWARE DEFAULT FALLBACK
  // ==========================================
  if (normalizeCategoryName(category) === CATEGORY_NAMES.EVERYDAY_AND_RETAIL) {
  return 'fluent-emoji-flat:shopping-cart';
  }

  // Whenever a kitchen item (like Soya granules, Dosa batter, Paapad) doesn't have a specific icon,
  // it uses the Mason Jar instead of the category icon!
  return 'fluent-emoji-flat:jar';
};