import { useState } from "react";
import { Plus } from "lucide-react";

interface AddItemFormProps {
  onAddItem: (name: string, category: string) => void;
  categories?: string[];
}

export function AddItemForm({ onAddItem, categories = [] }: AddItemFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddItem(name.trim(), category);
      setName("");
      setCategory("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        placeholder="Item name (e.g. Milk)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        // --- UPDATED: Added text visibility and focus classes ---
        className="flex-1 p-3 rounded-md border bg-background text-slate-900 placeholder-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      
      {categories.length > 0 && (
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          // --- UPDATED: Added text visibility and focus classes ---
          className="p-3 rounded-md border bg-background w-full sm:w-[180px] text-slate-900 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Category...</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      )}

      <button
        type="submit"
        className="bg-primary text-primary-foreground p-3 rounded-md hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="w-5 h-5" />
        <span className="sm:hidden">Add</span>
      </button>
    </form>
  );
}