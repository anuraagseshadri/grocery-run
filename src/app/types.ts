export interface GroceryItem {
  id: string | number;
  name: string;
  category: string;
  store: string; // The primary store for this trip
  status: 'pending' | 'purchased';
  
  // Replaced camelCase with snake_case for Supabase compatibility
  purchase_count?: number;
  purchase_dates?: string[]; // ISO date strings
  checked_out?: boolean;
  is_history?: boolean;
  created_at?: string;
  
  // The new dismiss state field
  dismissed_at?: string | null;
}

export interface ItemStats {
  name: string;
  purchases: number;
  averageDays: number;
  lastPurchaseDate?: string;
}