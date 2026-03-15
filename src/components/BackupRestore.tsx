import React, { useState, useRef } from 'react';
import { Download, Upload, ShieldCheck, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

export const BackupRestore = () => {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const backupData = {
        items: localStorage.getItem('groceryItems'),
        categoryPrefs: localStorage.getItem('groceryCategoryPrefs'),
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `grocery-run-backup.json`;
      link.click();
      setIsOpen(false);
      toast.success("Backup downloaded!");
    } catch (e) { toast.error("Export failed"); }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (window.confirm("Restore this backup? This replaces your current list.")) {
          localStorage.setItem('groceryItems', data.items);
          window.location.reload();
        }
      } catch (err) { toast.error("Invalid backup file"); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="relative inline-block text-left">
      {/* COMPACT TRIGGER */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-primary flex items-center gap-1"
      >
        <ShieldCheck className="w-5 h-5" />
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* MOBILE-OPTIMIZED DROPDOWN */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-1">
              {/* BACKUP BUTTON */}
              <button 
                onClick={handleExport} 
                className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4 text-blue-500" />
                Backup List
              </button>

              {/* RESTORE BUTTON */}
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="w-full flex items-center gap-3 p-3 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
              >
                <Upload className="w-4 h-4 text-amber-500" />
                Restore List
              </button>
            </div>
          </div>
        </>
      )}
      <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
    </div>
  );
};
