import React, { useState, useEffect } from 'react';
import { Category, Expense, ExpenseType, Frequency } from '../types';
import { Button, Input, Select } from './UIComponents';

interface ExpenseFormProps {
  initialData?: Expense;
  onSave: (data: Omit<Expense, 'id' | 'dateAdded'>) => void;
  onCancel: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ initialData, onSave, onCancel }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [type, setType] = useState<ExpenseType>(initialData?.type || ExpenseType.SUBSCRIPTION);
  const [frequency, setFrequency] = useState<Frequency>(initialData?.frequency || Frequency.MONTHLY);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(initialData?.categories || [Category.ENTERTAINMENT]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || selectedCategories.length === 0) return;

    onSave({
      title,
      amount: parseFloat(amount),
      currency: 'EUR',
      type,
      frequency,
      categories: selectedCategories
    });
  };

  const toggleCategory = (cat: Category) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) { // Prevent removing the last one
        setSelectedCategories(prev => prev.filter(c => c !== cat));
      }
    } else {
      setSelectedCategories(prev => [...prev, cat]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-1 space-y-4">
        <Input 
          label="Nome Spesa" 
          placeholder="es. ChatGPT, Netflix..." 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          required 
        />
        
        <Input 
          label="Importo (€)" 
          type="number" 
          placeholder="0.00" 
          step="0.01" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)}
          required 
        />

        <div className="grid grid-cols-2 gap-4">
            <Select 
            label="Tipologia"
            value={type}
            onChange={(e) => setType(e.target.value as ExpenseType)}
            options={Object.values(ExpenseType).map(v => ({ label: v, value: v }))}
            />

            <Select 
            label="Frequenza"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as Frequency)}
            options={Object.values(Frequency).map(v => ({ label: v, value: v }))}
            />
        </div>

        <div>
            <label className="text-sm font-medium text-slate-600 mb-2 block">Categorie</label>
            <div className="flex flex-wrap gap-2">
                {Object.values(Category).map((cat) => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => toggleCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border 
                                ${isSelected 
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200 ring-1 ring-emerald-500/20' 
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                        >
                            {cat} {isSelected && '✓'}
                        </button>
                    )
                })}
            </div>
            {selectedCategories.length === 0 && (
                <p className="text-xs text-rose-500 mt-1">Seleziona almeno una categoria</p>
            )}
        </div>
      </div>

      <div className="mt-6 flex gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Annulla
        </Button>
        <Button type="submit" variant="primary" className="flex-1" disabled={!title || !amount || selectedCategories.length === 0}>
          {initialData ? 'Aggiorna Spesa' : 'Salva Spesa'}
        </Button>
      </div>
    </form>
  );
};