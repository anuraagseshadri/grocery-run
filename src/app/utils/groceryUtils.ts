import { GroceryItem, ItemStats } from '../types';

export function calculateAverageDaysBetweenPurchases(purchaseDates: string[]): number {
  if (purchaseDates.length < 2) return 0;

  const sortedDates = [...purchaseDates]
    .map(d => new Date(d).getTime())
    .sort((a, b) => a - b);

  let totalDays = 0;
  for (let i = 1; i < sortedDates.length; i++) {
    const daysDiff = (sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24);
    totalDays += daysDiff;
  }

  return totalDays / (sortedDates.length - 1);
}

export function getDaysSinceLastPurchase(purchaseDates: string[]): number {
  if (purchaseDates.length === 0) return 0;

  const lastPurchase = Math.max(...purchaseDates.map(d => new Date(d).getTime()));
  const now = new Date().getTime();
  return Math.floor((now - lastPurchase) / (1000 * 60 * 60 * 24));
}

export function getItemStats(items: GroceryItem[]): ItemStats[] {
  return items
    .filter(item => item.purchaseCount > 0)
    .map(item => ({
      name: item.name,
      purchases: item.purchaseCount,
      averageDays: calculateAverageDaysBetweenPurchases(item.purchaseDates),
      lastPurchaseDate: item.purchaseDates.length > 0 
        ? item.purchaseDates[item.purchaseDates.length - 1]
        : undefined,
    }));
}

export function getReminders(items: GroceryItem[]) {
  const reminders: Array<{
    itemName: string;
    daysSincePurchase: number;
    averageDays: number;
    status: 'overdue' | 'due-soon';
  }> = [];

  items.forEach(item => {
    if (item.checkedOut || item.purchaseCount < 2) return;

    const averageDays = calculateAverageDaysBetweenPurchases(item.purchaseDates);
    if (averageDays === 0) return;

    const daysSince = getDaysSinceLastPurchase(item.purchaseDates);

    if (daysSince >= averageDays) {
      reminders.push({
        itemName: item.name,
        daysSincePurchase: daysSince,
        averageDays: Math.round(averageDays),
        status: 'overdue',
      });
    } else if (daysSince >= averageDays * 0.8) {
      reminders.push({
        itemName: item.name,
        daysSincePurchase: daysSince,
        averageDays: Math.round(averageDays),
        status: 'due-soon',
      });
    }
  });

  return reminders.sort((a, b) => {
    if (a.status === 'overdue' && b.status !== 'overdue') return -1;
    if (a.status !== 'overdue' && b.status === 'overdue') return 1;
    return b.daysSincePurchase - a.daysSincePurchase;
  });
}

export function saveToLocalStorage(items: GroceryItem[]) {
  localStorage.setItem('groceryItems', JSON.stringify(items));
}

export function loadFromLocalStorage(): GroceryItem[] {
  const stored = localStorage.getItem('groceryItems');
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}
