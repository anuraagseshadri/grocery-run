import { Bell, AlertCircle } from 'lucide-react';

interface Reminder {
  itemName: string;
  daysSincePurchase: number;
  averageDays: number;
  status: 'overdue' | 'due-soon';
}

interface RemindersPanelProps {
  reminders: Reminder[];
}

export function RemindersPanel({ reminders }: RemindersPanelProps) {
  const overdueReminders = reminders.filter(r => r.status === 'overdue');
  const dueSoonReminders = reminders.filter(r => r.status === 'due-soon');

  if (reminders.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-bold text-slate-800">Reminders</h2>
        </div>
        <p className="text-sm font-medium text-slate-500">
          You're all stocked up! No reminders at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-slate-800" />
        <h2 className="text-lg font-bold text-slate-800">Reminders</h2>
        <span className="ml-auto px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
          {reminders.length}
        </span>
      </div>

      <div className="space-y-4">
        {overdueReminders.length > 0 && (
          <div>
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2 text-slate-700">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Likely Running Low
            </h3>
            <div className="space-y-2">
              {overdueReminders.map((reminder, index) => (
                <div 
                  key={index}
                  className="flex items-start justify-between p-3 rounded-xl bg-red-50 border border-red-100"
                >
                  <div>
                    <p className="font-bold text-slate-800">{reminder.itemName}</p>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      Last purchased {reminder.daysSincePurchase} days ago
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                    {reminder.daysSincePurchase - reminder.averageDays}d overdue
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {dueSoonReminders.length > 0 && (
          <div>
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2 text-slate-700">
              <Bell className="w-4 h-4 text-amber-500" />
              Due Soon
            </h3>
            <div className="space-y-2">
              {dueSoonReminders.map((reminder, index) => (
                <div 
                  key={index}
                  className="flex items-start justify-between p-3 rounded-xl bg-amber-50 border border-amber-100"
                >
                  <div>
                    <p className="font-bold text-slate-800">{reminder.itemName}</p>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      Last purchased {reminder.daysSincePurchase} days ago
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                    Due in ~{reminder.averageDays - reminder.daysSincePurchase}d
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}