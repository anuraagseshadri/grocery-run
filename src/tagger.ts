// src/tagger.ts
import { CATEGORY_NAMES } from './constants';

export function autoTagItem(itemName: string) {
  const lower = itemName.toLowerCase();

  // 1. Nuts & Seeds (Checked early so "pumpkin seeds" or "almond" don't get misclassified)
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
    lower.includes('nuts') || 
    lower.includes('seeds')
  ) {
    return { category: CATEGORY_NAMES.NUTS_AND_SEEDS, store: 'Other' };
  }

  // 2. Dairy & Eggs
  if (lower.includes('milk') || lower.includes('egg') || lower.includes('cheese') || lower.includes('yogurt') || lower.includes('butter') || lower.includes('creamer') || lower.includes('paneer')) {
    return { category: CATEGORY_NAMES.DAIRY_AND_EGGS, store: 'Other' };
  }
  
  // 3. Produce 
  if (lower.includes('apple') || lower.includes('banana') || lower.includes('onion') || lower.includes('avocado') || lower.includes('tomato') || lower.includes('cilantro') || lower.includes('coriander') || lower.includes('parsley') || lower.includes('lemon') || lower.includes('garlic') || lower.includes('ginger') || lower.includes('potato') || lower.includes('carrot') || lower.includes('spinach')) {
    return { category: CATEGORY_NAMES.PRODUCE, store: 'Other' };
  }
  
  // 4. Bakery
  if (lower.includes('bread') || lower.includes('bagel') || lower.includes('sourdough') || lower.includes('croissant') || lower.includes('bun') || lower.includes('pita')) {
    return { category: CATEGORY_NAMES.BAKERY, store: 'Other' };
  }

  // 5. Meat & Seafood
  if (lower.includes('chicken') || lower.includes('beef') || lower.includes('pork') || lower.includes('meat') || lower.includes('fish') || lower.includes('salmon') || lower.includes('shrimp') || lower.includes('prawn') || lower.includes('mutton') || lower.includes('lamb')) {
    return { category: CATEGORY_NAMES.MEAT_AND_SEAFOOD, store: 'Other' };
  }

  // 6. Rice & Wheat 
  if (lower.includes('flour') || lower.includes('atta') || lower.includes('aata') || lower.includes('besan') || lower.includes('rice') || lower.includes('wheat') || lower.includes('grain')) {
    return { category: CATEGORY_NAMES.RICE_AND_WHEAT, store: 'Other' };
  }

  // 7. Pasta & Noodles
  if (lower.includes('pasta') || lower.includes('noodle') || lower.includes('spaghetti') || lower.includes('macaroni') || lower.includes('ramen')) {
    return { category: CATEGORY_NAMES.PASTA_AND_NOODLES, store: 'Other' };
  }

  // 8. Breakfast & Cereal
  if (lower.includes('cereal') || lower.includes('granola') || lower.includes('oat')) {
    return { category: CATEGORY_NAMES.BREAKFAST_AND_CEREAL, store: 'Other' };
  }

  // 9. Cooking Essentials (Includes Spices, Salt, Sugar, Oils, Lentils/Dal)
  if (
    lower.includes('sugar') || 
    lower.includes('salt') || 
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
    lower.includes('lentil') || 
    lower.includes('dal') || 
    lower.includes('oil') || 
    lower.includes('ghee') || 
    lower.includes('vinegar') || 
    lower.includes('soy sauce') || 
    lower.includes('soya sauce')
  ) {
    return { category: CATEGORY_NAMES.COOKING_ESSENTIALS, store: 'Other' };
  }

  // 10. Dessert & Snacks
  if (lower.includes('cookie') || lower.includes('biscuit') || lower.includes('chip') || lower.includes('popcorn') || lower.includes('chocolate') || lower.includes('coconut')) {
    return { category: CATEGORY_NAMES.DESSERT_AND_SNACKS, store: 'Other' };
  }

  // 11. Household & Cleaning
  if (lower.includes('towel') || lower.includes('soap') || lower.includes('tissue') || lower.includes('detergent') || lower.includes('cleaner') || lower.includes('paper')) {
    return { category: CATEGORY_NAMES.HOUSEHOLD_AND_CLEANING, store: 'Other' };
  }
  
  // 12. Pharmacy & Personal Care
  if (lower.includes('pill') || lower.includes('medicine') || lower.includes('vitamin') || lower.includes('shampoo') || lower.includes('toothpaste') || lower.includes('advil') || lower.includes('tylenol')) {
    return { category: CATEGORY_NAMES.PHARMACY_AND_PERSONAL_CARE, store: 'Other' };
  }

  // 13. Drinks & Beverages
  if (lower.includes('water') || lower.includes('juice') || lower.includes('coffee') || lower.includes('tea') || lower.includes('soda') || lower.includes('coke') || lower.includes('pepsi') || lower.includes('drink')) {
    return { category: CATEGORY_NAMES.DRINKS_AND_BEVERAGES, store: 'Other' };
  }

  // 14. Frozen
  if (lower.includes('frozen') || lower.includes('ice cream')) {
    return { category: CATEGORY_NAMES.FROZEN, store: 'Other' };
  }

  // Fallback for unrecognized items
  return { category: CATEGORY_NAMES.GENERAL, store: 'Other' };
}