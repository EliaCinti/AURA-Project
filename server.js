const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configurazione multer per upload file
const upload = multer({ dest: 'uploads/' });

// Default category colors and list
const DEFAULT_CATEGORY_COLORS = {
  Streaming: '#ef4444',
  Software: '#3b82f6',
  Fitness: '#10b981',
  Alimentari: '#f59e0b',
  Trasporti: '#8b5cf6',
  Casa: '#6366f1',
  Telefonia: '#ec4899',
  Assicurazioni: '#f97316',
  Banca: '#6b7280',
  AI: '#14b8a6',
  Altri: '#84cc16'
};

const DEFAULT_CATEGORIES = Object.entries(DEFAULT_CATEGORY_COLORS).map(
  ([name, color]) => ({ name, color })
);

function generateColor(name) {
  const colors = [
    '#ef4444',
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#6366f1',
    '#ec4899',
    '#f97316',
    '#14b8a6',
    '#84cc16'
  ];
  const index =
    name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length;
  return colors[index];
}

// Path per il file CSV delle spese
const EXPENSES_CSV_PATH = path.join(__dirname, 'data', 'expenses.csv');
const DATA_DIR = path.join(__dirname, 'data');

// Assicurati che la directory data esista
async function ensureDataDirectory() {
  try {
    await fs.access(DATA_DIR);
  } catch (error) {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Funzione per leggere le spese dal CSV
async function readExpensesFromCSV() {
  try {
    await fs.access(EXPENSES_CSV_PATH);
    const expenses = [];
    
    return new Promise((resolve, reject) => {
      require('fs').createReadStream(EXPENSES_CSV_PATH)
        .pipe(csv())
        .on('data', (row) => {
          // Parsing delle categorie (salvate come stringa separata da virgole)
          const categories = row.categories ? row.categories.split(',').map(cat => cat.trim()) : [];
          
          expenses.push({
            id: parseInt(row.id) || Date.now(),
            name: row.name || '',
            amount: parseFloat(row.amount) || 0,
            categories: categories,
            createdAt: row.createdAt || new Date().toISOString()
          });
        })
        .on('end', () => {
          resolve(expenses);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  } catch (error) {
    // Se il file non esiste, ritorna array vuoto
    return [];
  }
}

// Funzione per scrivere le spese nel CSV
async function writeExpensesToCSV(expenses) {
  const csvWriter = createObjectCsvWriter({
    path: EXPENSES_CSV_PATH,
    header: [
      { id: 'id', title: 'id' },
      { id: 'name', title: 'name' },
      { id: 'amount', title: 'amount' },
      { id: 'categories', title: 'categories' },
      { id: 'createdAt', title: 'createdAt' }
    ]
  });

  // Converti le categorie in stringa per il CSV
  const csvData = expenses.map(expense => ({
    ...expense,
    categories: expense.categories.join(', ')
  }));

  await csvWriter.writeRecords(csvData);
}

// Funzione per leggere le categorie dal CSV
async function readCategoriesFromCSV() {
  const CATEGORIES_CSV_PATH = path.join(__dirname, 'data', 'categories.csv');
  
  try {
    await fs.access(CATEGORIES_CSV_PATH);
    const categories = [];
    
    return new Promise((resolve, reject) => {
      require('fs').createReadStream(CATEGORIES_CSV_PATH)
        .pipe(csv())
        .on('data', (row) => {
          if (row.name) {
            categories.push({
              name: row.name,
              color:
                row.color ||
                DEFAULT_CATEGORY_COLORS[row.name] ||
                generateColor(row.name)
            });
          }
        })
        .on('end', () => {
          resolve(categories);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  } catch (error) {
    // Categorie di default con colore
    return DEFAULT_CATEGORIES;
  }
}

// Funzione per scrivere le categorie nel CSV
async function writeCategoriesToCSV(categories) {
  const CATEGORIES_CSV_PATH = path.join(__dirname, 'data', 'categories.csv');
  const csvWriter = createObjectCsvWriter({
    path: CATEGORIES_CSV_PATH,
    header: [
      { id: 'name', title: 'name' },
      { id: 'color', title: 'color' }
    ]
  });

  await csvWriter.writeRecords(categories);
}

// Routes API

// GET /api/expenses - Ottieni tutte le spese
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await readExpensesFromCSV();
    res.json({ success: true, data: expenses });
  } catch (error) {
    console.error('Errore nel leggere le spese:', error);
    res.status(500).json({ success: false, error: 'Errore nel leggere le spese' });
  }
});

// DELETE /api/categories/:name - Elimina una categoria
app.delete('/api/categories/:name', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const categories = await readCategoriesFromCSV();
    const filtered = categories.filter(cat => cat.name !== name);

    if (filtered.length === categories.length) {
      return res.status(404).json({ success: false, error: 'Categoria non trovata' });
    }

    await writeCategoriesToCSV(filtered);
    res.json({ success: true, message: 'Categoria eliminata con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminare la categoria:', error);
    res.status(500).json({ success: false, error: 'Errore nell\'eliminare la categoria' });
  }
});

// POST /api/expenses - Aggiungi una nuova spesa
app.post('/api/expenses', async (req, res) => {
  try {
    const { name, amount, categories } = req.body;

    if (!name || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Nome e importo sono obbligatori'
      });
    }

    const expenses = await readExpensesFromCSV();

    const newExpense = {
      id: Date.now(),
      name: name.trim(),
      amount: parseFloat(amount),
      categories: Array.isArray(categories) ? categories : [],
      createdAt: new Date().toISOString()
    };

    expenses.push(newExpense);
    await writeExpensesToCSV(expenses);

    res.json({ success: true, data: newExpense });
  } catch (error) {
    console.error('Errore nell\'aggiungere la spesa:', error);
    res.status(500).json({ success: false, error: 'Errore nell\'aggiungere la spesa' });
  }
});

// DELETE /api/expenses/:id - Elimina una spesa
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const expenseId = parseInt(req.params.id);
    const expenses = await readExpensesFromCSV();
    
    const filteredExpenses = expenses.filter(expense => expense.id !== expenseId);
    
    if (filteredExpenses.length === expenses.length) {
      return res.status(404).json({ success: false, error: 'Spesa non trovata' });
    }

    await writeExpensesToCSV(filteredExpenses);
    res.json({ success: true, message: 'Spesa eliminata con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminare la spesa:', error);
    res.status(500).json({ success: false, error: 'Errore nell\'eliminare la spesa' });
  }
});

// GET /api/categories - Ottieni tutte le categorie
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await readCategoriesFromCSV();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Errore nel leggere le categorie:', error);
    res.status(500).json({ success: false, error: 'Errore nel leggere le categorie' });
  }
});

// POST /api/categories - Aggiungi una nuova categoria
app.post('/api/categories', async (req, res) => {
  try {
    
    const { name, color } = req.body;    
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Il nome della categoria è obbligatorio'
      });
    }

    const categories = await readCategoriesFromCSV();
    const categoryName = name.trim();
    
    if (categories.some(cat => cat.name === categoryName)) {
      return res.status(400).json({
        success: false,
        error: 'La categoria esiste già'
      });
    }

    const newCategory = {
      name: categoryName,
      color: color || generateColor(categoryName)
    };

    categories.push(newCategory);
    await writeCategoriesToCSV(categories);

    res.json({ success: true, data: newCategory });
  } catch (error) {
    console.error('Errore nell\'aggiungere la categoria:', error);
    res.status(500).json({ success: false, error: 'Errore nell\'aggiungere la categoria' });
  }
});

// GET /api/export - Esporta i dati in CSV
app.get('/api/export', async (req, res) => {
  try {
    const expenses = await readExpensesFromCSV();
    
    // Crea un CSV con tutti i dati delle spese
    const csvData = expenses.map(expense => ({
      Nome: expense.name,
      Importo: expense.amount,
      Categorie: expense.categories.join(', '),
      'Data Creazione': new Date(expense.createdAt).toLocaleDateString('it-IT'),
      'Costo Annuale': (expense.amount * 12).toFixed(2)
    }));

    // Imposta gli header per il download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="spese-export.csv"');
    
    // Converti in CSV
    const csv = require('csv-stringify');
    csv(csvData, { 
      header: true,
      columns: ['Nome', 'Importo', 'Categorie', 'Data Creazione', 'Costo Annuale']
    }, (err, output) => {
      if (err) {
        console.error('Errore nell\'esportazione:', err);
        return res.status(500).json({ success: false, error: 'Errore nell\'esportazione' });
      }
      res.send(output);
    });
  } catch (error) {
    console.error('Errore nell\'esportazione:', error);
    res.status(500).json({ success: false, error: 'Errore nell\'esportazione' });
  }
});

// POST /api/import - Importa dati da CSV
app.post('/api/import', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Nessun file caricato' });
    }

    const expenses = [];
    const existingCats = await readCategoriesFromCSV();
    const categories = new Set(existingCats.map(c => c.name));

    return new Promise((resolve, reject) => {
      require('fs').createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          // Parsing flessibile del CSV importato
          const name = row.Nome || row.name || row.Name || '';
          const amount = parseFloat(row.Importo || row.amount || row.Amount || 0);
          const categoriesStr = row.Categorie || row.categories || row.Categories || '';
          const expenseCategories = categoriesStr.split(',').map(cat => cat.trim()).filter(cat => cat);

          if (name && amount > 0 && expenseCategories.length > 0) {
            expenses.push({
              id: Date.now() + Math.random(),
              name: name.trim(),
              amount: amount,
              categories: expenseCategories,
              createdAt: new Date().toISOString()
            });

            // Aggiungi nuove categorie
            expenseCategories.forEach(cat => categories.add(cat));
          }
        })
        .on('end', async () => {
          try {
            // Unisci con le spese esistenti
            const existingExpenses = await readExpensesFromCSV();
            const allExpenses = [...existingExpenses, ...expenses];
            
            // Salva tutto
            await writeExpensesToCSV(allExpenses);
            const categoryObjects = Array.from(categories).map(name => ({
              name,
              color: DEFAULT_CATEGORY_COLORS[name] || generateColor(name)
            }));
            await writeCategoriesToCSV(categoryObjects);

            // Pulisci il file temporaneo
            await fs.unlink(req.file.path);

            res.json({ 
              success: true, 
              message: `Importate ${expenses.length} spese con successo`,
              data: { imported: expenses.length, total: allExpenses.length }
            });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  } catch (error) {
    console.error('Errore nell\'importazione:', error);
    res.status(500).json({ success: false, error: 'Errore nell\'importazione' });
  }
});

// Inizializza il server
async function startServer() {
  try {
    await ensureDataDirectory();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server avviato su http://localhost:${PORT}`);
      console.log(`📊 API disponibili su http://localhost:${PORT}/api/`);
      console.log(`📁 File CSV salvati in: ${DATA_DIR}`);
    });
  } catch (error) {
    console.error('Errore nell\'avvio del server:', error);
    process.exit(1);
  }
}

// Gestione graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Arresto del server...');
  process.exit(0);
});

// Avvia il server
startServer();