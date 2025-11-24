import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { Category, Expense, ExpenseType, Frequency } from './types';
import { Badge, Button, Card, SmartIcon } from './components/UIComponents';
import { ExpenseForm } from './components/ExpenseForm';
import { SpendingPieChart } from './components/Visualization';

const DEFAULT_EXPENSES: Expense[] = [
  { id: '1', title: 'Netflix', amount: 12.99, currency: 'EUR', type: ExpenseType.SUBSCRIPTION, frequency: Frequency.MONTHLY, categories: [Category.ENTERTAINMENT], dateAdded: new Date().toISOString() },
  { id: '2', title: 'ChatGPT Plus', amount: 20.00, currency: 'USD', type: ExpenseType.SUBSCRIPTION, frequency: Frequency.MONTHLY, categories: [Category.AI_TOOLS, Category.WORK], dateAdded: new Date().toISOString() },
  { id: '3', title: 'Palestra', amount: 45.00, currency: 'EUR', type: ExpenseType.SUBSCRIPTION, frequency: Frequency.MONTHLY, categories: [Category.HEALTH], dateAdded: new Date().toISOString() },
  { id: '4', title: 'Amazon Prime', amount: 49.90, currency: 'EUR', type: ExpenseType.SUBSCRIPTION, frequency: Frequency.YEARLY, categories: [Category.SHOPPING, Category.ENTERTAINMENT], dateAdded: new Date().toISOString() },
];

type ViewBasis = 'monthly' | 'yearly';

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // State for handling deletion confirmation
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'list'>('overview');
  
  // New state for Annual vs Monthly view
  const [viewBasis, setViewBasis] = useState<ViewBasis>('monthly');

  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data with migration for old 'category' string field
  useEffect(() => {
    // Try to load from new key first, then fall back to old key for migration
    const savedAura = localStorage.getItem('aura-data');
    const savedOld = localStorage.getItem('eco-finanza-data');
    
    const saved = savedAura || savedOld;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration logic: if 'category' exists but 'categories' doesn't, convert it
        const migrated = parsed.map((item: any) => ({
          ...item,
          categories: item.categories || (item.category ? [item.category] : [Category.OTHER])
        }));
        setExpenses(migrated);
      } catch (e) {
        setExpenses(DEFAULT_EXPENSES);
      }
    } else {
      setExpenses(DEFAULT_EXPENSES);
    }
  }, []);

  // Save data on change
  useEffect(() => {
    localStorage.setItem('aura-data', JSON.stringify(expenses));
  }, [expenses]);

  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const handleSaveExpense = (expenseData: Omit<Expense, 'id' | 'dateAdded'>) => {
    if (editingExpense) {
      // Update existing
      setExpenses(prev => prev.map(e => 
        e.id === editingExpense.id 
          ? { ...e, ...expenseData } 
          : e
      ));
    } else {
      // Create new
      const newExpense: Expense = {
        ...expenseData,
        id: generateId(),
        dateAdded: new Date().toISOString()
      };
      setExpenses(prev => [newExpense, ...prev]);
    }
    
    closeForm();
  };

  // Step 1: Request Deletion (Open Modal)
  const requestDelete = (expense: Expense, e?: React.MouseEvent) => {
    if (e) {
        e.stopPropagation();
        e.preventDefault();
    }
    setExpenseToDelete(expense);
  };

  // Step 2: Confirm Deletion (Actual Logic)
  const confirmDelete = () => {
    if (expenseToDelete) {
        setExpenses(prev => prev.filter(expense => expense.id !== expenseToDelete.id));
        setExpenseToDelete(null);
    }
  };

  const cancelDelete = () => {
    setExpenseToDelete(null);
  };

  const openAddForm = () => {
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  const openEditForm = (expense: Expense, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setTimeout(() => setEditingExpense(null), 300); // Wait for animation
  };

  const exportData = () => {
    const dataStr = JSON.stringify(expenses, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aura_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === 'string') {
          const importedData = JSON.parse(result);
          
          // Basic validation: check if array
          if (Array.isArray(importedData)) {
            // We could verify structure here, but for now let's trust the array
            if (window.confirm(`Trovate ${importedData.length} spese nel backup. Vuoi sovrascrivere i dati attuali?`)) {
               setExpenses(importedData);
               alert('Importazione completata con successo!');
            }
          } else {
            alert('Il file selezionato non è un backup valido di AURA.');
          }
        }
      } catch (err) {
        console.error(err);
        alert('Errore durante la lettura del file. Assicurati che sia un JSON valido.');
      }
      // Reset input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Calculations
  const calculateTotal = useCallback((basis: ViewBasis) => {
    return expenses.reduce((acc, curr) => {
      let amount = 0;
      
      // Calculate based on requested view basis
      if (basis === 'monthly') {
        if (curr.frequency === Frequency.MONTHLY) amount = curr.amount;
        else if (curr.frequency === Frequency.YEARLY) amount = curr.amount / 12;
        else if (curr.frequency === Frequency.WEEKLY) amount = curr.amount * 4;
      } else { // yearly
        if (curr.frequency === Frequency.MONTHLY) amount = curr.amount * 12;
        else if (curr.frequency === Frequency.YEARLY) amount = curr.amount;
        else if (curr.frequency === Frequency.WEEKLY) amount = curr.amount * 52;
      }

      // One-time expenses are usually ignored for recurring projections, 
      // but let's leave them out for now to show "Run Rate"
      if (curr.type === ExpenseType.ONE_TIME) amount = 0; 
      
      return acc + amount;
    }, 0);
  }, [expenses]);

  const totalAmount = calculateTotal(viewBasis);

  // Calculate Top Category
  const topCategoryData = useMemo(() => {
    if (expenses.length === 0) return null;
    
    const totals: Record<string, number> = {};
    expenses.forEach(e => {
        let monthlyAmount = e.amount;
        if (e.frequency === Frequency.YEARLY) monthlyAmount = e.amount / 12;
        if (e.frequency === Frequency.WEEKLY) monthlyAmount = e.amount * 4;
        if (e.frequency === Frequency.ONCE) monthlyAmount = 0;

        if (monthlyAmount > 0) {
            const splitAmount = monthlyAmount / e.categories.length;
            e.categories.forEach(cat => {
                totals[cat] = (totals[cat] || 0) + splitAmount;
            });
        }
    });

    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;
    
    return {
        name: sorted[0][0],
        amount: sorted[0][1]
    };
  }, [expenses]);

  // Group expenses by frequency for the list view
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, Expense[]> = {
        [Frequency.WEEKLY]: [],
        [Frequency.MONTHLY]: [],
        [Frequency.YEARLY]: [],
        [Frequency.ONCE]: [],
    };
    
    // Sort logic within groups could go here (e.g. by amount)
    expenses.forEach(e => {
        if (!groups[e.frequency]) groups[e.frequency] = [];
        groups[e.frequency].push(e);
    });

    // Clean up empty groups
    return Object.fromEntries(Object.entries(groups).filter(([_, items]) => items.length > 0));
  }, [expenses]);

  const frequencyLabels: Record<string, string> = {
    [Frequency.WEEKLY]: 'Settimanali',
    [Frequency.MONTHLY]: 'Mensili',
    [Frequency.YEARLY]: 'Annuali',
    [Frequency.ONCE]: 'Una Tantum'
  };

  const frequencyIcons: Record<string, string> = {
    [Frequency.WEEKLY]: '📅',
    [Frequency.MONTHLY]: '🗓️',
    [Frequency.YEARLY]: '📆',
    [Frequency.ONCE]: '💎'
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      {/* Hidden File Input for Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportFile} 
        className="hidden" 
        accept=".json"
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
            <h1 className="text-xl font-bold text-slate-800">AURA</h1>
          </div>
          
          <div className="flex items-center gap-2">
             {/* Import/Export Buttons Desktop */}
             <div className="hidden md:flex gap-2">
                <Button 
                    variant="ghost" 
                    onClick={triggerImport} 
                    className="text-sm text-slate-500 hover:text-emerald-600" 
                    title="Importa backup JSON"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    Importa
                </Button>
                <Button 
                    variant="secondary" 
                    onClick={exportData} 
                    className="text-sm" 
                    title="Scarica backup JSON"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    Esporta
                </Button>
            </div>

            {/* Mobile Actions */}
            <div className="md:hidden flex">
                <button 
                    onClick={triggerImport}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Importa dati"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                </button>
                <button 
                    onClick={exportData}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Esporta dati"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                </button>
            </div>

            <div className="hidden md:block border-l border-slate-200 pl-2 ml-2">
                <Button onClick={openAddForm} className="text-sm">
                + Nuova Spesa
                </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none">
            <div className="flex flex-col h-full justify-between">
              <div className="flex justify-between items-start">
                  <span className="text-emerald-100 font-medium mb-1">
                    Totale Stimato ({viewBasis === 'monthly' ? 'Mensile' : 'Annuale'})
                  </span>
                  
                  {/* View Toggle */}
                  <div className="bg-emerald-700/50 p-0.5 rounded-lg flex text-xs">
                    <button 
                        onClick={() => setViewBasis('monthly')}
                        className={`px-2 py-1 rounded-md transition-all ${viewBasis === 'monthly' ? 'bg-white text-emerald-700 font-bold shadow-sm' : 'text-emerald-100 hover:text-white'}`}
                    >
                        Mese
                    </button>
                    <button 
                        onClick={() => setViewBasis('yearly')}
                        className={`px-2 py-1 rounded-md transition-all ${viewBasis === 'yearly' ? 'bg-white text-emerald-700 font-bold shadow-sm' : 'text-emerald-100 hover:text-white'}`}
                    >
                        Anno
                    </button>
                  </div>
              </div>

              <span className="text-4xl font-bold tracking-tight mt-2">€{totalAmount.toFixed(2)}</span>
              
              <span className="text-sm text-emerald-100 mt-2 opacity-80">
                Basato su abbonamenti e costi ricorrenti
              </span>
            </div>
          </Card>

          <Card className="bg-white border-slate-200" title="Dove spendi di più?">
             {topCategoryData ? (
               <div className="flex items-center gap-4 h-full pb-2">
                 <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
                    {/* Simple fallback emoji logic based on category name */}
                    {topCategoryData.name === Category.ENTERTAINMENT ? '🎮' : 
                     topCategoryData.name === Category.FOOD ? '🍔' : 
                     topCategoryData.name === Category.TRANSPORT ? '🚗' : 
                     topCategoryData.name === Category.AI_TOOLS ? '🤖' : '🏷️'}
                 </div>
                 <div>
                    <h4 className="font-semibold text-slate-800">{topCategoryData.name}</h4>
                    <p className="text-slate-500 text-sm">
                        Circa <span className="font-bold text-slate-700">€{topCategoryData.amount.toFixed(2)}</span> al mese
                    </p>
                 </div>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center h-full text-center py-2 text-slate-400">
                 <p>Nessun dato sufficiente</p>
               </div>
             )}
          </Card>
        </div>

        {/* Mobile Tabs */}
        <div className="flex md:hidden bg-white p-1 rounded-xl border border-slate-200">
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}
            onClick={() => setActiveTab('overview')}
          >
            Panoramica
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}
            onClick={() => setActiveTab('list')}
          >
            Lista Spese
          </button>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Column: List (On Desktop takes 2 cols, on mobile hidden if tab is overview) */}
          <div className={`lg:col-span-2 ${activeTab === 'overview' ? 'hidden md:block' : 'block'}`}>
            <div className="flex justify-between items-center mb-4 md:hidden">
               <h3 className="font-bold text-slate-700">Le tue Spese</h3>
               <span className="text-xs text-slate-400">{expenses.length} voci</span>
            </div>

            <div className="space-y-6">
              {expenses.length === 0 && (
                <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300">
                  <p className="text-slate-400">Nessuna spesa aggiunta.</p>
                </div>
              )}
              
              {Object.entries(groupedExpenses).map(([freq, items]) => (
                <div key={freq} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="flex items-center gap-2 mb-3 ml-1">
                     <span className="text-xl">{frequencyIcons[freq]}</span>
                     <h3 className="font-semibold text-slate-700">{frequencyLabels[freq]}</h3>
                     <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{items.length}</span>
                   </div>
                   
                   <div className="space-y-3">
                        {items.map((expense) => (
                            <div key={expense.id} className="group bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between transition-all hover:shadow-md hover:border-emerald-100 gap-3">
                                <div className="flex items-center gap-4">
                                    <SmartIcon 
                                        title={expense.title} 
                                        categories={expense.categories} 
                                        className="w-12 h-12 sm:w-10 sm:h-10"
                                    />
                                    <div>
                                        <h4 className="font-semibold text-slate-800">{expense.title}</h4>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {expense.categories.map(cat => (
                                                <span key={cat} className="text-xs bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-100">{cat}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pl-16 sm:pl-0">
                                    <div className="font-bold text-slate-900 whitespace-nowrap">€{expense.amount.toFixed(2)}</div>
                                    
                                    <div className="flex gap-1">
                                        <button 
                                            type="button"
                                            onClick={(e) => openEditForm(expense, e)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                            title="Modifica"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={(e) => requestDelete(expense, e)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                            title="Rimuovi"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Column: Chart (On Desktop takes 1 col, on mobile hidden if tab is list) */}
          <div className={`lg:col-span-1 space-y-6 ${activeTab === 'list' ? 'hidden md:block' : 'block'}`}>
            <Card title="Analisi Spese">
               <SpendingPieChart expenses={expenses} />
            </Card>

            <Card className="bg-indigo-50 border-indigo-100">
              <h4 className="font-semibold text-indigo-800 mb-2">Nuova Categoria!</h4>
              <p className="text-sm text-indigo-700">
                Ora puoi tracciare i tuoi strumenti AI (come ChatGPT o Midjourney) usando la categoria <strong>Software AI</strong>.
              </p>
            </Card>
          </div>
        </div>

      </main>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <button 
          onClick={openAddForm}
          className="w-14 h-14 bg-emerald-600 rounded-full text-white shadow-lg shadow-emerald-300 flex items-center justify-center text-3xl hover:bg-emerald-700 transition-transform hover:scale-105 active:scale-95"
        >
          +
        </button>
      </div>

      {/* Modal / Slide-over for Add/Edit Expense */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">
                {editingExpense ? 'Modifica Spesa' : 'Nuova Spesa'}
              </h2>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <ExpenseForm 
                initialData={editingExpense || undefined}
                onSave={handleSaveExpense} 
                onCancel={closeForm} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6">
                <div className="text-center">
                    <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Elimina Spesa</h3>
                    <p className="text-slate-500 mb-6">
                        Sei sicuro di voler eliminare <strong>{expenseToDelete.title}</strong>? <br/>
                        Questa azione non può essere annullata.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={cancelDelete} className="flex-1">
                            Annulla
                        </Button>
                        <Button variant="danger" onClick={confirmDelete} className="flex-1">
                            Elimina
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

export default App;