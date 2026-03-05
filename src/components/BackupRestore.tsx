import React, { useRef } from 'react';
import { Download, Upload, ShieldCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export const BackupRestore = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. EXPORT DATA ---
  const handleExport = () => {
    try {
      const backupData = {
        items: localStorage.getItem('groceryItems'),
        categoryPrefs: localStorage.getItem('groceryCategoryPrefs'),
        storePrefs: localStorage.getItem('groceryStorePrefs'),
        emojiPrefs: localStorage.getItem('groceryEmojiPrefs'),
        categoryOrder: localStorage.getItem('groceryCategoryOrder'),
        theme: localStorage.getItem('groceryTheme'),
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `grocery-run-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Backup downloaded successfully!");
    } catch (error) {
      toast.error("Failed to create backup.");
    }
  };

  // --- 2. IMPORT DATA ---
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Safety check: Ensure this looks like our data
        if (!data.items) throw new Error("Invalid backup file");

        if (window.confirm("This will replace your current list and history. Continue?")) {
          if (data.items) localStorage.setItem('groceryItems', data.items);
          if (data.categoryPrefs) localStorage.setItem('groceryCategoryPrefs', data.categoryPrefs);
          if (data.storePrefs) localStorage.setItem('groceryStorePrefs', data.storePrefs);
          if (data.emojiPrefs) localStorage.setItem('groceryEmojiPrefs', data.emojiPrefs);
          if (data.categoryOrder) localStorage.setItem('groceryCategoryOrder', data.categoryOrder);
          if (data.theme) localStorage.setItem('groceryTheme', data.theme);

          toast.success("Data restored! Reloading app...");
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (err) {
        toast.error("Could not read backup file. Ensure it is a valid Grocery Run JSON.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="mt-8 p-6 rounded-2xl border border-dashed border-primary/30 bg-primary/5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-tight">Data Resiliency</h3>
          <p className="text-[10px] text-muted-foreground font-medium">Protect your shopping history and custom categories.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={handleExport}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-black uppercase tracking-wider hover:border-primary transition-all active:scale-95 shadow-sm"
        >
          <Download className="w-4 h-4 text-primary" /> Backup
        </button>

        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-black uppercase tracking-wider hover:border-primary transition-all active:scale-95 shadow-sm"
        >
          <Upload className="w-4 h-4 text-primary" /> Restore
        </button>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImport} 
        className="hidden" 
        accept=".json"
      />

      <div className="flex items-start gap-2 pt-2 opacity-60">
        <AlertTriangle className="w-3 h-3 mt-0.5 text-amber-500" />
        <p className="text-[9px] leading-tight">Restoring data will overwrite your current list. Keep your backup files in a safe place.</p>
      </div>
    </div>
  );
};
