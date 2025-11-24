import React, { useMemo, useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Expense, Frequency } from '../types';

interface VisualizationProps {
  expenses: Expense[];
}

type ViewMode = 'category' | 'type' | 'frequency';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#64748b', '#14b8a6', '#f43f5e'];

export const SpendingPieChart: React.FC<VisualizationProps> = ({ expenses }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('category');

  const data = useMemo(() => {
    const totals: Record<string, number> = {};

    expenses.forEach(expense => {
      // Normalize to monthly
      let monthlyAmount = expense.amount;
      if (expense.frequency === Frequency.YEARLY) monthlyAmount = expense.amount / 12;
      if (expense.frequency === Frequency.WEEKLY) monthlyAmount = expense.amount * 4;
      if (expense.frequency === Frequency.ONCE) monthlyAmount = 0; // Exclude one-time from monthly view

      if (monthlyAmount > 0) {
        if (viewMode === 'category') {
            // Split amount across categories
            const splitAmount = monthlyAmount / expense.categories.length;
            expense.categories.forEach(cat => {
                totals[cat] = (totals[cat] || 0) + splitAmount;
            });
        } else if (viewMode === 'type') {
            totals[expense.type] = (totals[expense.type] || 0) + monthlyAmount;
        } else if (viewMode === 'frequency') {
            totals[expense.frequency] = (totals[expense.frequency] || 0) + monthlyAmount;
        }
      }
    });

    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); 
  }, [expenses, viewMode]);

  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/></svg>
        <p>Aggiungi spese ricorrenti per vedere il grafico</p>
      </div>
    );
  }

  return (
    <div className="w-full">
        {/* View Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
            <button 
                className={`flex-1 text-xs py-1.5 rounded-md transition-all ${viewMode === 'category' ? 'bg-white text-slate-800 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setViewMode('category')}
            >
                Categoria
            </button>
            <button 
                className={`flex-1 text-xs py-1.5 rounded-md transition-all ${viewMode === 'type' ? 'bg-white text-slate-800 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setViewMode('type')}
            >
                Tipo
            </button>
            <button 
                className={`flex-1 text-xs py-1.5 rounded-md transition-all ${viewMode === 'frequency' ? 'bg-white text-slate-800 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setViewMode('frequency')}
            >
                Frequenza
            </button>
        </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
            <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
            >
                {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
            </Pie>
            <Tooltip 
                formatter={(value: number) => `€${value.toFixed(2)}`}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};