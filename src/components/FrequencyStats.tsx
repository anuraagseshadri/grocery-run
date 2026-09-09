import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface FrequencyData {
  name: string;
  purchases: number;
  averageDays: number;
}

interface FrequencyStatsProps {
  data: FrequencyData[];
}

const COLORS = ['#7d9d7c', '#8db597', '#a2c8b0', '#b8d0c0', '#d3e3d8'];

export function FrequencyStats({ data }: FrequencyStatsProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-bold text-slate-800">Popular Items</h2>
        </div>
        <p className="text-sm font-medium text-slate-500">
          Start purchasing items to see frequency data
        </p>
      </div>
    );
  }

  const topItems = [...data]
    .sort((a, b) => b.purchases - a.purchases)
    .slice(0, 5);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-slate-800" />
        <h2 className="text-lg font-bold text-slate-800">Most Popular Items</h2>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topItems} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
            <XAxis 
              dataKey="name" 
              className="text-xs font-medium"
              tick={{ fill: '#64748b' }}
            />
            <YAxis 
              className="text-xs font-medium"
              tick={{ fill: '#64748b' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                fontWeight: 'bold',
                color: '#0f172a'
              }}
              cursor={{ fill: '#f8fafc' }}
            />
            <Bar dataKey="purchases" radius={[8, 8, 0, 0]}>
              {topItems.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 space-y-3">
        {topItems.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span>{item.name}</span>
            </div>
            <div className="text-slate-500 font-medium">
              {item.purchases} purchases • Every ~{Math.round(item.averageDays)} days
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}