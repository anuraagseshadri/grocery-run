export interface GroceryItem {
  id: string;
  name: string;
  category: string;
  store: string;
  inCart: boolean;
  createdAt?: string;
  trackHabit?: boolean; // NEW ADDITION: Optional flag for selective habit tracking
}

export interface PurchaseHistoryRecord {
  id: string;
  date: string;
  items: GroceryItem[];
}

export interface StoreOption {
  name: string;
  color?: string;
  logo?: string;
}

export interface CategoryOption {
  name: string;
}