import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Project } from '@/types';
import { useState } from 'react';
import { TrendingUp, Calendar } from 'lucide-react';

interface MonthlyProjectsChartProps {
  projects: Project[];
}

export default function MonthlyProjectsChart({ projects }: MonthlyProjectsChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  // Generate last 6 months of data
  const generateMonthlyData = () => {
    const months: { month: string; monthKey: string; created: number; completed: number; inProgress: number; total: number; }[] = [];
    const now = new Date();
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      months.push({
        month: monthName,
        monthKey: monthKey,
        created: 0,
        completed: 0,
        inProgress: 0,
        total: 0
      });
    }

    // Count projects by month
    projects.forEach(project => {
      const createdDate = new Date(project.createdAt);
      const createdMonthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
      
      const monthData = months.find(m => m.monthKey === createdMonthKey);
      if (monthData) {
        monthData.created++;
        monthData.total++;
        
        // Count by status
        if (project.status?.toLowerCase().includes('complete') || project.status?.toLowerCase().includes('done')) {
          monthData.completed++;
        } else if (project.status?.toLowerCase().includes('progress') || project.status?.toLowerCase().includes('active')) {
          monthData.inProgress++;
        }
      }
    });

    return months;
  };

  const data = generateMonthlyData();
  const totalCreated = data.reduce((sum, d) => sum + d.created, 0);
  const totalCompleted = data.reduce((sum, d) => sum + d.completed, 0);
  const avgPerMonth = (totalCreated / 6).toFixed(1);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Project Activity
            </CardTitle>
            <CardDescription>
              Project creation and completion trends over the last 6 months
            </CardDescription>
          </div>
          <div className="flex gap-1 rounded-lg border p-1">
            <button
              onClick={() => setChartType('bar')}
              className={`rounded px-3 py-1 text-sm transition-colors ${
                chartType === 'bar'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Bar
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`rounded px-3 py-1 text-sm transition-colors ${
                chartType === 'line'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Line
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Summary */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Total Created</p>
            <p className="text-2xl font-bold">{totalCreated}</p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-600">{totalCompleted}</p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Avg/Month</p>
            <p className="text-2xl font-bold">{avgPerMonth}</p>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Bar 
                dataKey="created" 
                fill="hsl(var(--primary))" 
                name="Created"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="completed" 
                fill="hsl(142, 76%, 36%)" 
                name="Completed"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="inProgress" 
                fill="hsl(47, 96%, 53%)" 
                name="In Progress"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Line 
                type="monotone" 
                dataKey="created" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Created"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="hsl(142, 76%, 36%)" 
                strokeWidth={2}
                name="Completed"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="inProgress" 
                stroke="hsl(47, 96%, 53%)" 
                strokeWidth={2}
                name="In Progress"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}