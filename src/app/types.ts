export interface GroceryItem {
  id: string | number;
  name: string;
  category: string;
  store: string; // Restores the missing store property
  status: 'pending' | 'purchased';
  
  // Restores Supabase snake_case compatibility
  purchase_count?: number;
  purchase_dates?: string[]; 
  checked_out?: boolean;
  is_history?: boolean;
  created_at?: string;
  dismissed_at?: string | null;
}