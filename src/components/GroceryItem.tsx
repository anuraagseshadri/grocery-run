import { Trash2, CheckSquare, Square, ChevronDown } from 'lucide-react';
import { GroceryItem as GroceryItemType } from '../types';

interface GroceryItemProps {
  item: GroceryItemType;
  onCheckout: (id: string) => void;
  onDelete: (id: string) => void;
  // New props for category updating
  onUpdateCategory?: (id: string, newCategory: string) => void;
  categories?: string[];
  averageDays?: number;
  daysSinceLastPurchase?: number;
}

export function GroceryItem({
  item,
  onCheckout,
  onDelete,
  onUpdateCategory,
  categories = [],
  averageDays,
  daysSinceLastPurchase,
}: GroceryItemProps) {
  const currentCategory = item.category || "📦 Other";

  return (
    <div className="flex items-center justify-between p-3 sm:p-4 bg-card border rounded-lg group transition-all hover:shadow-sm">
      <div className="flex items-center gap-3 flex-1 overflow-hidden">
        <button 
          onClick={() => onCheckout(item.id)} 
          className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
          title="Mark as checked out"
        >
          <Square className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <span className="font-medium truncate">{item.name}</span>
            
            {/* --- NEW: Category Dropdown --- */}
            {onUpdateCategory && categories.length > 0 ? (
              <div className="relative inline-block flex-shrink-0">
                <select
                  value={currentCategory}
                  onChange={(e) => onUpdateCategory(item.id, e.target.value)}
                  className="appearance-none bg-muted/50 text-xs font-medium pl-2.5 pr-6 py-1 rounded-full cursor-pointer hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50 border-0"
                  title="Change category"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              </div>
            ) : (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-muted flex-shrink-0">
                {currentCategory}
              </span>
            )}
          </div>
          
          {/* Stats and Details */}
          <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {daysSinceLastPurchase !== undefined && (
              <span>Last bought: {daysSinceLastPurchase} days ago</span>
            )}
            {averageDays !== undefined && (
              <span>Buy every ~{averageDays} days</span>
            )}
          </div>
        </div>
      </div>
      
      <button
        onClick={() => onDelete(item.id)}
        className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2"
        title="Delete item"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}

// --- CheckedOutItem Component ---
// This remains largely the same but is included for a complete file replacement.

interface CheckedOutItemProps {
  item: GroceryItemType;
  onUncheck: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CheckedOutItem({ item, onUncheck, onDelete }: CheckedOutItemProps) {
  return (
    <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 border rounded-lg group transition-all">
      <div className="flex items-center gap-3 overflow-hidden">
        <button 
          onClick={() => onUncheck(item.id)} 
          className="text-primary transition-colors flex-shrink-0"
          title="Move back to list"
        >
          <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <div className="min-w-0">
          <span className="font-medium line-through text-muted-foreground truncate block">{item.name}</span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground inline-block mt-1">
            {item.category}
          </span>
        </div>
      </div>
      <button
        onClick={() => onDelete(item.id)}
        className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2"
        title="Delete item"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}