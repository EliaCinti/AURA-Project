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
            categories.push(row.name);
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
    // Categorie di default
    return [
      'Streaming', 'Software', 'Fitness', 'Alimentari', 'Trasporti', 
      'Casa', 'Telefonia', 'Assicurazioni', 'Banca', 'AI', 'Altri'
    ];
  }
}

// Funzione per scrivere le categorie nel CSV
async function writeCategoriesToCSV(categories) {
  const CATEGORIES_CSV_PATH = path.join(__dirname, 'data', 'categories.csv');
  const csvWriter = createObjectCsvWriter({
    path: CATEGORIES_CSV_PATH,
    header: [
      { id: 'name', title: 'name' }
    ]
  });

  const csvData = categories.map(category => ({ name: category }));
  await csvWriter.writeRecords(csvData);
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
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Il nome della categoria è obbligatorio' 
      });
    }

    const categories = await readCategoriesFromCSV();
    const categoryName = name.trim();
    
    if (categories.includes(categoryName)) {
      return res.status(400).json({ 
        success: false, 
        error: 'La categoria esiste già' 
      });
    }

    categories.push(categoryName);
    await writeCategoriesToCSV(categories);

    res.json({ success: true, data: categoryName });
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
    const categories = new Set(await readCategoriesFromCSV());

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
            await writeCategoriesToCSV(Array.from(categories));

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