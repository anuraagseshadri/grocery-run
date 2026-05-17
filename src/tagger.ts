// src/tagger.ts
export function autoTagItem(itemName: string) {
  const lower = itemName.toLowerCase();
  
  if (lower.includes('milk') || lower.includes('egg') || lower.includes('cheese') || lower.includes('yogurt')) {
    return { category: 'Dairy & Eggs', icon: 'local_drink', store: 'Loblaws' };
  }
  if (lower.includes('apple') || lower.includes('banana') || lower.includes('onion') || lower.includes('avocado') || lower.includes('tomato')) {
    return { category: 'Produce', icon: 'eco', store: 'Loblaws' };
  }
  if (lower.includes('bread') || lower.includes('bagel') || lower.includes('sourdough') || lower.includes('croissant')) {
    return { category: 'Bakery', icon: 'bakery_dining', store: 'Local Bakery' };
  }
  if (lower.includes('towel') || lower.includes('soap') || lower.includes('tissue') || lower.includes('detergent') || lower.includes('cleaner')) {
    return { category: 'Household', icon: 'cleaning_services', store: 'Costco' };
  }
  if (lower.includes('chicken') || lower.includes('beef') || lower.includes('pork') || lower.includes('meat') || lower.includes('fish')) {
    return { category: 'Meat', icon: 'set_meal', store: 'Loblaws' };
  }
  
  // The fallback for unrecognized items
  return { category: 'General', icon: 'shopping_bag', store: 'Other' };
}