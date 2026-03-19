import { Bell, AlertCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

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
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Reminders</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          You're all stocked up! No reminders at the moment.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Reminders</h2>
        <Badge variant="destructive" className="ml-auto">
          {reminders.length}
        </Badge>
      </div>

      <div className="space-y-4">
        {overdueReminders.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              Likely Running Low
            </h3>
            <div className="space-y-2">
              {overdueReminders.map((reminder, index) => (
                <div 
                  key={index}
                  className="flex items-start justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                >
                  <div>
                    <p className="font-medium">{reminder.itemName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last purchased {reminder.daysSincePurchase} days ago
                    </p>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {reminder.daysSincePurchase - reminder.averageDays} days overdue
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {dueSoonReminders.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Bell className="w-4 h-4 text-yellow-500" />
              Due Soon
            </h3>
            <div className="space-y-2">
              {dueSoonReminders.map((reminder, index) => (
                <div 
                  key={index}
                  className="flex items-start justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
                >
                  <div>
                    <p className="font-medium">{reminder.itemName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last purchased {reminder.daysSincePurchase} days ago
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Due in ~{reminder.averageDays - reminder.daysSincePurchase} days
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
