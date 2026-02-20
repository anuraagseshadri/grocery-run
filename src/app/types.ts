export interface GroceryItem {
  id: string;
  name: string;
  category?: string;
  purchaseCount: number;
  purchaseDates: string[]; // ISO date strings
  checkedOut: boolean;
  addedAt: string;
}

export interface ItemStats {
  name: string;
  purchases: number;
  averageDays: number;
  lastPurchaseDate?: string;
}
