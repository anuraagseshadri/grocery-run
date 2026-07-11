// src/tagger.ts

export function autoTagItem(itemName: string) {
  const lower = itemName.toLowerCase();

  // 1. Dairy & Eggs
  if (lower.includes('milk') || lower.includes('egg') || lower.includes('cheese') || lower.includes('yogurt') || lower.includes('butter') || lower.includes('creamer')) {
    return { category: 'Dairy & Eggs', store: 'Other' };
  }
  
  // 2. Produce 
  if (lower.includes('apple') || lower.includes('banana') || lower.includes('onion') || lower.includes('avocado') || lower.includes('tomato') || lower.includes('cilantro') || lower.includes('coriander') || lower.includes('parsley') || lower.includes('lemon') || lower.includes('garlic')) {
    return { category: 'Produce', store: 'Other' };
  }
  
  // 3. Bakery
  if (lower.includes('bread') || lower.includes('bagel') || lower.includes('sourdough') || lower.includes('croissant') || lower.includes('bun') || lower.includes('pita')) {
    return { category: 'Bakery', store: 'Other' };
  }

  // 4. Meat & Seafood
  if (lower.includes('chicken') || lower.includes('beef') || lower.includes('pork') || lower.includes('meat') || lower.includes('fish') || lower.includes('salmon')) {
    return { category: 'Meat & Seafood', store: 'Other' };
  }

  // 5. Rice & Wheat 
  if (lower.includes('flour') || lower.includes('atta') || lower.includes('besan') || lower.includes('rice') || lower.includes('wheat') || lower.includes('grain')) {
    return { category: 'Rice & Wheat', store: 'Other' };
  }

  // 6. Pasta & Noodles
  if (lower.includes('pasta') || lower.includes('noodle') || lower.includes('spaghetti') || lower.includes('macaroni') || lower.includes('ramen')) {
    return { category: 'Pasta & Noodles', store: 'Other' };
  }

  // 7. Breakfast & Cereal
  if (lower.includes('cereal') || lower.includes('granola') || lower.includes('oat')) {
    return { category: 'Breakfast & Cereal', store: 'Other' };
  }

  // 8. Cooking Essentials 
  if (lower.includes('sugar') || lower.includes('salt') || lower.includes('spice') || lower.includes('baking soda') || lower.includes('baking powder') || lower.includes('lentil') || lower.includes('dal') || lower.includes('oil') || lower.includes('soy sauce') || lower.includes('soya sauce')) {
    return { category: 'Cooking Essentials', store: 'Other' };
  }

  // 9. Dessert & Snacks
  if (lower.includes('cookie') || lower.includes('biscuit') || lower.includes('chip') || lower.includes('popcorn') || lower.includes('chocolate') || lower.includes('coconut')) {
    return { category: 'Dessert & Snacks', store: 'Other' };
  }

  // 10. Household & Cleaning
  if (lower.includes('towel') || lower.includes('soap') || lower.includes('tissue') || lower.includes('detergent') || lower.includes('cleaner') || lower.includes('paper')) {
    return { category: 'Household & Cleaning', store: 'Other' };
  }
  
  // 11. Pharmacy & Personal Care
  if (lower.includes('pill') || lower.includes('medicine') || lower.includes('vitamin') || lower.includes('shampoo') || lower.includes('toothpaste')) {
    return { category: 'Pharmacy & Personal Care', store: 'Other' };
  }

  // 12. Beverages
  if (lower.includes('water') || lower.includes('juice') || lower.includes('coffee') || lower.includes('tea') || lower.includes('soda')) {
    return { category: 'Beverages', store: 'Other' };
  }

  // 13. Frozen
  if (lower.includes('frozen') || lower.includes('ice cream')) {
    return { category: 'Frozen', store: 'Other' };
  }

  // Fallback for unrecognized items
  return { category: 'General', store: 'Other' };
}