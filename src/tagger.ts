// src/tagger.ts
import { CATEGORY_NAMES } from './constants';

const hasWord = (text: string, word: string) => new RegExp(`\\b${word}s?\\b`, 'i').test(text);

export function autoTagItem(itemName: string): {
  category: string;
  store: string;
  trackHabit: boolean;
} {
  const lower = itemName.toLowerCase().trim();

  // 0. Specific Compound Disambiguations (Checked first to prevent substring collisions)
  if (
    lower.includes('motor oil') ||
    lower.includes('engine oil') ||
    lower.includes('wiper fluid') ||
    lower.includes('washer fluid') ||
    lower.includes('wiper blade') ||
    lower.includes('printer paper') ||
    lower.includes('copy paper') ||
    lower.includes('sandpaper') ||
    lower.includes('wrapping paper') ||
    lower.includes('duct tape') ||
    lower.includes('masking tape') ||
    lower.includes('packing tape') ||
    lower.includes('electrical tape') ||
    lower.includes('painters tape') ||
    lower.includes('tape measure') ||
    lower.includes('measuring tape') ||
    lower.includes('bath towel') ||
    lower.includes('beach towel') ||
    lower.includes('hand towel') ||
    lower.includes('air filter') ||
    lower.includes('furnace filter') ||
    lower.includes('oil filter')
  ) {
    return {
      category: CATEGORY_NAMES.EVERYDAY_AND_RETAIL,
      store: 'Other',
      trackHabit: false
    };
  }

  if (lower.includes('cereal') || lower.includes('cheerio') || lower.includes('granola') || hasWord(lower, 'oat')) {
    return { category: CATEGORY_NAMES.BREAKFAST_AND_CEREAL, store: 'Other', trackHabit: true };
  }
  if (lower.includes('eggplant') || lower.includes('aubergine') || lower.includes('butternut') || lower.includes('bell pepper') || lower.includes('green pepper') || lower.includes('red pepper') || lower.includes('sweet pepper') || lower.includes('capsicum') || lower.includes('coconut')) {
    return { category: CATEGORY_NAMES.PRODUCE, store: 'Other', trackHabit: true };
  }
  if (lower.includes('milk') || lower.includes('creamer')) {
    return { category: CATEGORY_NAMES.DAIRY_AND_EGGS, store: 'Other', trackHabit: true };
  }
  if (lower.includes('peanut butter') || lower.includes('almond butter') || lower.includes('nutmeg')) {
    return { category: CATEGORY_NAMES.COOKING_ESSENTIALS, store: 'Other', trackHabit: true };
  }
  if (lower.includes('paper towel') || lower.includes('toilet paper') || lower.includes('parchment paper') || lower.includes('wax paper')) {
    return { category: CATEGORY_NAMES.HOUSEHOLD_AND_CLEANING, store: 'Other', trackHabit: true };
  }

  // 1. Everyday & Retail (Hardware, Home Depot, Canadian Tire, Mall, Apparel, Electronics)
  if (
    // Hardware, Tools & Auto
    lower.includes('drill') ||
    lower.includes('screw') ||
    hasWord(lower, 'nail') ||
    hasWord(lower, 'bolt') ||
    lower.includes('hammer') ||
    lower.includes('wrench') ||
    lower.includes('pliers') ||
    lower.includes('saw') ||
    lower.includes('wd-40') ||
    lower.includes('wd40') ||
    lower.includes('paint') ||
    lower.includes('primer') ||
    lower.includes('caulk') ||
    lower.includes('glue') ||
    lower.includes('epoxy') ||
    lower.includes('superglue') ||
    lower.includes('extension cord') ||
    lower.includes('power strip') ||
    lower.includes('surge protector') ||
    lower.includes('light bulb') ||
    hasWord(lower, 'bulb') ||
    lower.includes('led') ||
    lower.includes('battery') ||
    lower.includes('batteries') ||
    lower.includes('flashlight') ||
    lower.includes('fertilizer') ||
    lower.includes('potting mix') ||
    lower.includes('soil') ||
    lower.includes('mulch') ||
    lower.includes('garden hose') ||
    lower.includes('shovel') ||
    lower.includes('rake') ||
    lower.includes('antifreeze') ||
    lower.includes('car wash') ||
    lower.includes('tire') ||
    lower.includes('lumber') ||
    lower.includes('plywood') ||
    lower.includes('drywall') ||
    lower.includes('padlock') ||
    lower.includes('hinge') ||
    lower.includes('bracket') ||

    // Electronics & Office Supplies
    lower.includes('cable') ||
    lower.includes('charger') ||
    lower.includes('usb') ||
    lower.includes('hdmi') ||
    lower.includes('adapter') ||
    lower.includes('headphone') ||
    lower.includes('earbud') ||
    lower.includes('notebook') ||
    hasWord(lower, 'pen') ||
    lower.includes('pencil') ||
    lower.includes('marker') ||
    lower.includes('highlighter') ||
    lower.includes('stapler') ||
    lower.includes('scissors') ||
    lower.includes('folder') ||
    lower.includes('binder') ||
    lower.includes('envelope') ||
    lower.includes('scotch tape') ||

    // Mall, Apparel & Home Goods
    lower.includes('sock') ||
    lower.includes('shirt') ||
    lower.includes('t-shirt') ||
    lower.includes('pant') ||
    lower.includes('jean') ||
    lower.includes('short') ||
    lower.includes('jacket') ||
    lower.includes('coat') ||
    lower.includes('hoodie') ||
    lower.includes('sweater') ||
    lower.includes('shoe') ||
    lower.includes('sneaker') ||
    lower.includes('boot') ||
    lower.includes('slipper') ||
    lower.includes('sandal') ||
    lower.includes('underwear') ||
    lower.includes('bedsheet') ||
    lower.includes('pillow') ||
    lower.includes('blanket') ||
    lower.includes('duvet') ||
    lower.includes('curtain') ||
    lower.includes('hanger') ||
    lower.includes('umbrella') ||
    lower.includes('backpack') ||
    lower.includes('luggage') ||
    lower.includes('suitcase') ||
    lower.includes('wallet') ||
    lower.includes('purse') ||
    lower.includes('candle') ||
    lower.includes('frame') ||
    lower.includes('storage bin') ||
    lower.includes('tote') ||
    lower.includes('organizer') ||
    lower.includes('gift')
  ) {
    return {
      category: CATEGORY_NAMES.EVERYDAY_AND_RETAIL,
      store: 'Other',
      trackHabit: false
    };
  }

  // 2. Nuts & Seeds
  if (
    lower.includes('almond') || 
    lower.includes('cashew') || 
    lower.includes('walnut') || 
    lower.includes('pistachio') || 
    lower.includes('peanut') || 
    lower.includes('pecan') || 
    lower.includes('hazelnut') || 
    lower.includes('macadamia') || 
    lower.includes('pine nut') || 
    lower.includes('chia') || 
    lower.includes('flax') || 
    lower.includes('hemp') || 
    lower.includes('sunflower seed') || 
    lower.includes('pumpkin seed') || 
    lower.includes('sesame') || 
    hasWord(lower, 'nut') || 
    hasWord(lower, 'seed')
  ) {
    return { category: CATEGORY_NAMES.NUTS_AND_SEEDS, store: 'Other', trackHabit: true };
  }

  // 3. Dairy & Eggs
  if (hasWord(lower, 'egg') || lower.includes('cheese') || lower.includes('yogurt') || lower.includes('butter') || lower.includes('paneer')) {
    return { category: CATEGORY_NAMES.DAIRY_AND_EGGS, store: 'Other', trackHabit: true };
  }
  
  // 4. Produce 
  if (
    lower.includes('apple') || 
    lower.includes('banana') || 
    lower.includes('onion') || 
    lower.includes('avocado') || 
    lower.includes('tomato') || 
    lower.includes('cilantro') || 
    lower.includes('coriander') || 
    lower.includes('parsley') || 
    lower.includes('lemon') || 
    lower.includes('lime') || 
    lower.includes('garlic') || 
    lower.includes('ginger') || 
    lower.includes('potato') || 
    lower.includes('carrot') || 
    lower.includes('spinach') || 
    lower.includes('cucumber') || 
    lower.includes('orange') || 
    lower.includes('mango') || 
    lower.includes('berr')
  ) {
    return { category: CATEGORY_NAMES.PRODUCE, store: 'Other', trackHabit: true };
  }
  
  // 5. Bakery
  if (lower.includes('bread') || lower.includes('bagel') || lower.includes('sourdough') || lower.includes('croissant') || lower.includes('bun') || lower.includes('pita') || lower.includes('donut') || lower.includes('doughnut')) {
    return { category: CATEGORY_NAMES.BAKERY, store: 'Other', trackHabit: true };
  }

  // 6. Meat & Seafood
  if (lower.includes('chicken') || lower.includes('beef') || lower.includes('pork') || lower.includes('meat') || lower.includes('fish') || lower.includes('salmon') || lower.includes('shrimp') || lower.includes('prawn') || lower.includes('mutton') || lower.includes('lamb')) {
    return { category: CATEGORY_NAMES.MEAT_AND_SEAFOOD, store: 'Other', trackHabit: true };
  }

  // 7. Rice & Wheat 
  if (lower.includes('flour') || lower.includes('atta') || lower.includes('aata') || lower.includes('besan') || hasWord(lower, 'rice') || lower.includes('wheat') || lower.includes('grain')) {
    return { category: CATEGORY_NAMES.RICE_AND_WHEAT, store: 'Other', trackHabit: true };
  }

  // 8. Pasta & Noodles
  if (lower.includes('pasta') || lower.includes('noodle') || lower.includes('spaghetti') || lower.includes('macaroni') || lower.includes('ramen')) {
    return { category: CATEGORY_NAMES.PASTA_AND_NOODLES, store: 'Other', trackHabit: true };
  }

  // 9. Cooking Essentials (Includes Spices, Salt, Sugar, Oils, Honey)
  if (
    lower.includes('sugar') || 
    hasWord(lower, 'salt') || 
    lower.includes('spice') || 
    lower.includes('masala') || 
    lower.includes('turmeric') || 
    lower.includes('cumin') || 
    lower.includes('cinnamon') || 
    lower.includes('cardamom') || 
    lower.includes('clove') || 
    lower.includes('pepper') || 
    lower.includes('paprika') || 
    lower.includes('chili powder') || 
    lower.includes('baking soda') || 
    lower.includes('baking powder') || 
    lower.includes('oil') || 
    lower.includes('ghee') || 
    lower.includes('vinegar') || 
    lower.includes('honey') || 
    lower.includes('soy sauce') || 
    lower.includes('soya sauce')
  ) {
    return { category: CATEGORY_NAMES.COOKING_ESSENTIALS, store: 'Other', trackHabit: true };
  }

  // 10. Dessert & Snacks
  if (lower.includes('cookie') || lower.includes('biscuit') || lower.includes('chip') || lower.includes('popcorn') || lower.includes('chocolate')) {
    return { category: CATEGORY_NAMES.DESSERT_AND_SNACKS, store: 'Other', trackHabit: true };
  }

  // 11. Household & Cleaning
  if (lower.includes('towel') || lower.includes('soap') || lower.includes('tissue') || lower.includes('detergent') || lower.includes('cleaner') || lower.includes('paper')) {
    return { category: CATEGORY_NAMES.HOUSEHOLD_AND_CLEANING, store: 'Other', trackHabit: true };
  }
  
  // 12. Pharmacy & Personal Care
  if (lower.includes('pill') || lower.includes('medicine') || lower.includes('vitamin') || lower.includes('shampoo') || lower.includes('toothpaste') || lower.includes('advil') || lower.includes('tylenol')) {
    return { category: CATEGORY_NAMES.PHARMACY_AND_PERSONAL_CARE, store: 'Other', trackHabit: true };
  }

  // 13. Drinks & Beverages
  if (lower.includes('water') || lower.includes('juice') || lower.includes('coffee') || hasWord(lower, 'tea') || lower.includes('soda') || lower.includes('coke') || lower.includes('pepsi') || lower.includes('drink')) {
    return { category: CATEGORY_NAMES.DRINKS_AND_BEVERAGES, store: 'Other', trackHabit: true };
  }

  // 14. Frozen
  if (lower.includes('frozen') || lower.includes('ice cream')) {
    return { category: CATEGORY_NAMES.FROZEN, store: 'Other', trackHabit: true };
  }

  // Fallback for shelf-stable/kitchen staples (Dal, Lentils, Soya granules, Dosa batter, Paapad, etc.)
  return { category: CATEGORY_NAMES.PANTRY, store: 'Other', trackHabit: true };
}