import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Calculator, Euro, Tag, TrendingUp, PieChart, BarChart3, X, Upload, Download, RefreshCw, AlertCircle, CheckCircle, Database } from 'lucide-react';
import { PieChart as RechartsPie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const ExpenseTracker = ({ isOnline, serverStatus, showNotification }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const fileInputRef = useRef(null);
  
  const [newExpense, setNewExpense] = useState({
    name: '',
    amount: '',
    categories: [],
    newCategory: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const pastelColors = ['#fbcfe8','#fef9c3','#d1fae5','#bfdbfe','#ddd6fe','#fde2e4','#ffe5d9','#fff1e6','#e2eafc','#d4e2d4'];
  const [newCategoryColor, setNewCategoryColor] = useState(pastelColors[0]);

  // Palette colori pastello per un look più morbido
  const categoryColors = {
    'Streaming': '#fecaca', // rosso chiaro
    'Software': '#bfdbfe',  // azzurro chiaro
    'Fitness': '#bbf7d0',   // verde chiaro
    'Alimentari': '#fde68a',
    'Trasporti': '#ddd6fe',
    'Casa': '#c7d2fe',
    'Telefonia': '#fbcfe8',
    'Assicurazioni': '#fdba74',
    'Banca': '#e5e7eb',
    'AI': '#99f6e4',
    'Altri': '#d9f99d'
  };

  const generateColor = (category) => {
    if (categoryColors[category]) return categoryColors[category];
    const colors = [
      '#fecaca', '#bfdbfe', '#bbf7d0', '#fde68a', '#ddd6fe',
      '#c7d2fe', '#fbcfe8', '#fdba74', '#99f6e4', '#d9f99d'
    ];
    const index = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

    const getCategoryColor = (name) => {
    const found = categories.find(c => c.name === name);
    return found ? found.color : generateColor(name);
  };

  // API Functions
  const api = {
    async fetchExpenses() {
      const response = await fetch('/api/expenses');
      if (!response.ok) throw new Error('Failed to fetch expenses');
      return response.json();
    },

    async addExpense(expense) {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense)
      });
      if (!response.ok) throw new Error('Failed to add expense');
      return response.json();
    },

    async deleteExpense(id) {
      const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete expense');
      return response.json();
    },

    async fetchCategories() {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },

    async addCategory(category) {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category)
      });
      if (!response.ok) throw new Error('Failed to add category');
      return response.json();
    },

    async deleteCategory(name) {
      const response = await fetch(`/api/categories/${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete category');
      return response.json();
    },

    async exportData() {
      const response = await fetch('/api/export');
      if (!response.ok) throw new Error('Failed to export data');
      return response.blob();
    },

    async importData(file) {
      const formData = new FormData();
      formData.append('csvFile', file);
      
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Failed to import data');
      return response.json();
    }
  };

  // Load initial data
  useEffect(() => {
  loadData();
}, [serverStatus]);

const loadData = async () => {
  if (serverStatus !== 'online') return;

  setLoading(true);
  try {
    const [expensesData, categoriesData] = await Promise.all([
      api.fetchExpenses(),
      api.fetchCategories()
    ]);

    setExpenses(expensesData.data);
    const fetchedCategories = categoriesData.data.map(cat =>
      typeof cat === 'string'
        ? { name: cat, color: generateColor(cat) }
        : { name: cat.name, color: cat.color || generateColor(cat.name) }
    );
    setCategories(fetchedCategories);
    setLastSync(new Date());
    showNotification('Dati caricati con successo', 'success');
  } catch (error) {
    console.error('Error loading data:', error);
    showNotification('Errore nel caricamento dei dati', 'error');
  } finally {
    setLoading(false);
  }
};

  const syncData = async () => {
    if (serverStatus !== 'online') {
      showNotification('Server non disponibile', 'warning');
      return;
    }

    setSyncing(true);
    try {
      await loadData();
      showNotification('Sincronizzazione completata', 'success');
    } catch (error) {
      showNotification('Errore nella sincronizzazione', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const totalMonthly = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);

  const addCategory = async () => {
    if (!newExpense.newCategory || categories.some(c => c.name === newExpense.newCategory)) return;
    const newCat = { name: newExpense.newCategory, color: newCategoryColor };
    if (serverStatus === 'online') {
      try {
        const result = await api.addCategory(newCat);
        const added = result.data || newCat;
        setCategories([...categories, added]);
        setSelectedCategories([...selectedCategories, added.name]);
        setNewExpense({ ...newExpense, newCategory: '' });
        setNewCategoryColor(pastelColors[0]);
        showNotification('Categoria aggiunta', 'success');
      } catch (error) {
        showNotification("Errore nell'aggiunta della categoria", 'error');
      }
    } else {
      // Offline mode
      setCategories([...categories, newCat]);
      setSelectedCategories([...selectedCategories, newCat.name]);
      setNewExpense({ ...newExpense, newCategory: '' });
      setNewCategoryColor(pastelColors[0]);
      showNotification('Categoria aggiunta (offline)', 'warning');
    }
  };

  const toggleCategory = (categoryName) => {
    if (selectedCategories.includes(categoryName)) {
      setSelectedCategories(selectedCategories.filter(c => c !== categoryName));
    } else {
      setSelectedCategories([...selectedCategories, categoryName]);
    }
  };

  const deleteCategory = async (name) => {
    if (serverStatus === 'online') {
      try {
        await api.deleteCategory(name);
        showNotification('Categoria eliminata', 'success');
      } catch (error) {
        showNotification("Errore nell'eliminazione della categoria", 'error');
        return;
      }
    } else {
      showNotification('Categoria eliminata (offline)', 'warning');
    }
    setCategories(categories.filter(c => c.name !== name));
    setSelectedCategories(selectedCategories.filter(c => c !== name));
  };

  const addExpense = async () => {
    if (!newExpense.name || !newExpense.amount || selectedCategories.length === 0) return;

    const expense = {
      name: newExpense.name,
      amount: parseFloat(newExpense.amount).toFixed(2),
      categories: [...selectedCategories],
      id: Date.now()
    };

    if (serverStatus === 'online') {
      try {
        const addedExpense = await api.addExpense(expense);
        setExpenses([...expenses, addedExpense]);
        showNotification('Spesa aggiunta con successo', 'success');
      } catch (error) {
        showNotification('Errore nell\'aggiunta della spesa', 'error');
        return;
      }
    } else {
      // Offline mode
      setExpenses([...expenses, expense]);
      showNotification('Spesa aggiunta (offline)', 'warning');
    }

    // Reset form
    setNewExpense({ name: '', amount: '', categories: [], newCategory: '' });
    setSelectedCategories([]);
    setNewCategoryColor(pastelColors[0]);
    setShowForm(false);
  };

  const deleteExpense = async (id) => {
    if (serverStatus === 'online') {
      try {
        await api.deleteExpense(id);
        setExpenses(expenses.filter(expense => expense.id !== id));
        showNotification('Spesa eliminata', 'success');
      } catch (error) {
        showNotification('Errore nell\'eliminazione della spesa', 'error');
      }
    } else {
      // Offline mode
      setExpenses(expenses.filter(expense => expense.id !== id));
      showNotification('Spesa eliminata (offline)', 'warning');
    }
  };

  const exportData = async () => {
    if (serverStatus !== 'online') {
      showNotification('Funzione disponibile solo online', 'warning');
      return;
    }

    try {
      const blob = await api.exportData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showNotification('Dati esportati con successo', 'success');
    } catch (error) {
      showNotification('Errore nell\'esportazione', 'error');
    }
  };

  const importData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (serverStatus !== 'online') {
      showNotification('Funzione disponibile solo online', 'warning');
      return;
    }

    try {
      const result = await api.importData(file);
      await loadData(); // Reload data after import
      showNotification(`Importati ${result.imported} elementi`, 'success');
    } catch (error) {
      showNotification('Errore nell\'importazione', 'error');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getCategoryTotal = (category) => {
    return expenses
      .filter(expense => Array.isArray(expense.categories) && expense.categories.includes(category))
      .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  };

  const getAllUsedCategories = () => {
  const allCategories = new Set();

  expenses.forEach(expense => {
    const categories = Array.isArray(expense.categories) ? expense.categories : [];
    categories.forEach(cat => allCategories.add(cat));
  });

  return Array.from(allCategories);
};

  const getCategoryData = () => {
    const usedCategories = getAllUsedCategories();
    return usedCategories.map(category => ({
      name: category,
      value: getCategoryTotal(category),
      color: getCategoryColor(category)
    })).filter(item => item.value > 0);
  };

  const getMonthlyStats = () => {
    const categoryData = getCategoryData();
    const avgExpense = expenses.length > 0 ? totalMonthly / expenses.length : 0;
    const maxExpense = expenses.length > 0 ? Math.max(...expenses.map(e => parseFloat(e.amount))) : 0;
    const minExpense = expenses.length > 0 ? Math.min(...expenses.map(e => parseFloat(e.amount))) : 0;
    
    return {
      totalExpenses: expenses.length,
      avgExpense: avgExpense.toFixed(2),
      maxExpense: maxExpense.toFixed(2),
      minExpense: minExpense.toFixed(2),
      categoriesUsed: categoryData.length,
      yearlyTotal: (totalMonthly * 12).toFixed(2)
    };
  };

  const stats = getMonthlyStats();
  const chartData = getCategoryData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Caricamento dati...</h2>
          <p className="text-gray-600">Connessione al server in corso</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <Calculator className="mr-3 text-blue-600" />
                Tracker Abbonamenti Pro
                {serverStatus === 'offline' && (
                  <span className="ml-3 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                    Modalità Offline
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-2">Gestione avanzata delle tue spese mensili</p>
              {lastSync && (
                <p className="text-xs text-gray-500 mt-1">
                  Ultimo aggiornamento: {lastSync.toLocaleString('it-IT')}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <button
                  onClick={syncData}
                  disabled={syncing || serverStatus !== 'online'}
                  className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-50"
                  title="Sincronizza dati"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                </button>
                <div className="flex items-center text-sm">
                  {serverStatus === 'online' ? (
                    <Database className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500 mr-1" />
                  )}
                  <span className={serverStatus === 'online' ? 'text-green-600' : 'text-yellow-600'}>
                    {serverStatus === 'online' ? 'Sincronizzato' : 'Offline'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500">Totale mensile</p>
              <p className="text-4xl font-bold text-blue-600 flex items-center">
                <Euro className="w-8 h-8 mr-1" />
                {totalMonthly.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Spese Totali</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalExpenses}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Spesa Media</p>
                <p className="text-2xl font-bold text-gray-800">€{stats.avgExpense}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center">
              <Tag className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Categorie</p>
                <p className="text-2xl font-bold text-gray-800">{stats.categoriesUsed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center">
              <PieChart className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Totale Anno</p>
                <p className="text-2xl font-bold text-gray-800">€{stats.yearlyTotal}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium flex items-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Aggiungi Spesa
          </button>
          
          <button
            onClick={exportData}
            disabled={serverStatus !== 'online'}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-medium flex items-center transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Download className="w-5 h-5 mr-2" />
            Esporta CSV
          </button>
          
          <label className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-medium flex items-center transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer">
            <Upload className="w-5 h-5 mr-2" />
            Importa CSV
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={importData}
              className="hidden"
              disabled={serverStatus !== 'online'}
            />
          </label>
        </div>

        {/* Add Expense Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-blue-100 slide-down">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Nuova Spesa</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                <input
                  type="text"
                  value={newExpense.name}
                  onChange={(e) => setNewExpense({...newExpense, name: e.target.value})}
                  placeholder="es. Netflix, Spotify..."
                  className="input-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Importo (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  placeholder="0.00"
                  className="input-primary"
                />
              </div>
            </div>

            {/* Create New Category */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Crea Nuova Categoria</label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newExpense.newCategory}
                  onChange={(e) => setNewExpense({ ...newExpense, newCategory: e.target.value })}
                  placeholder="Nome nuova categoria..."
                  className="input-primary flex-1"
                />
                <button onClick={addCategory} className="btn-success">
                  Aggiungi
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                {pastelColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCategoryColor(color)}
                    className={`w-6 h-6 rounded-full border-2 ${newCategoryColor === color ? 'border-gray-800' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  >
                    <span className="sr-only">{color}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Select Categories */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categorie ({selectedCategories.length} selezionate)
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <div key={cat.name} className="relative">
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat.name)}
                      className="px-3 py-2 rounded-lg text-sm font-medium"
                      style={{
                        backgroundColor: selectedCategories.includes(cat.name)
                          ? cat.color
                          : '#e5e7eb',
                        color: selectedCategories.includes(cat.name)
                          ? '#fff'
                          : '#374151'
                      }}
                    >
                      {cat.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCategory(cat.name)}
                      className="absolute -top-2 -right-2 text-red-500 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={addExpense}
                disabled={!newExpense.name || !newExpense.amount || selectedCategories.length === 0}
                className="btn-success disabled:bg-gray-400"
              >
                Aggiungi
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedCategories([]);
                  setNewExpense({ name: '', amount: '', categories: [], newCategory: '' });
                  setNewCategoryColor(pastelColors[0]);
                }}
                className="btn-secondary"
              >
                Annulla
              </button>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {chartData.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Pie Chart */}
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-blue-600" />
                Distribuzione per Categoria
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Spese per Categoria
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => [`€${value}`, 'Importo']} />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Category Summary */}
        {getAllUsedCategories().length > 0 && (
          <div className="card mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Riepilogo Dettagliato</h3>
            <div className="responsive-grid">
              {getAllUsedCategories().map(category => {
                const total = getCategoryTotal(category);
                const percentage = ((total / totalMonthly) * 100).toFixed(1);
                return (
                  <div key={category} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span
                        className="badge text-gray-800"
                        style={{ backgroundColor: getCategoryColor(category) }}
                      >
                        {category}
                      </span>
                      <span className="font-bold text-lg">€{total.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {percentage}% del totale • Annuale: €{(total * 12).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Expenses List */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Le Tue Spese ({expenses.length})
          </h3>
          
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Calculator className="w-16 h-16 mx-auto opacity-50" />
              </div>
              <p className="text-gray-500 text-lg">Nessuna spesa ancora registrata</p>
              <p className="text-gray-400">Aggiungi la tua prima spesa per iniziare!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(expense.categories) ? expense.categories : []).map(category => (
                        <span 
                          key={category}
                          className="badge text-gray-800 text-xs"
                          style={{ backgroundColor: getCategoryColor(category) }}
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                    <span className="font-medium text-gray-800">{expense.name}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="font-bold text-lg text-gray-800">€{expense.amount}</span>
                      <div className="text-xs text-gray-500">€{(expense.amount * 12).toFixed(2)}/anno</div>
                    </div>
                    <button
                      onClick={() => deleteExpense(expense.id)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Advanced Stats */}
        {expenses.length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-4">Statistiche Avanzate</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-blue-100">Spesa Massima</p>
                <p className="text-2xl font-bold">€{stats.maxExpense}</p>
              </div>
              <div className="text-center">
                <p className="text-blue-100">Spesa Minima</p>
                <p className="text-2xl font-bold">€{stats.minExpense}</p>
              </div>
              <div className="text-center">
                <p className="text-blue-100">Spesa Media</p>
                <p className="text-2xl font-bold">€{stats.avgExpense}</p>
              </div>
              <div className="text-center">
                <p className="text-blue-100">Categoria più Costosa</p>
                <p className="text-2xl font-bold">
                  {chartData.length > 0 ? chartData.reduce((max, cat) => cat.value > max.value ? cat : max).name : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseTracker;