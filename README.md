# 📊 Expense Tracker Pro

Una web app completa per tenere traccia delle tue spese mensili e abbonamenti, con funzionalità avanzate come:
- Grafici dinamici (a torta e a barre)
- Categorie personalizzabili
- Supporto a CSV per import/export
- Modalità offline automatica
- Backend in Node.js/Express
- Frontend in React + TailwindCSS

---

## 🖥️ Requisiti

- Node.js >= 16
- npm >= 8

---

## 🗂️ Struttura del progetto

```
expense-tracker-pro/
├── server.js                # Backend Express
├── package.json             # Configurazione progetto
│
├── data/                    # File CSV (verranno creati)
│   ├── expenses.csv
│   └── categories.csv
│
├── public/
│   └── index.html           # HTML principale
│
├── src/                     # Frontend React
│   ├── App.js
│   ├── ExpenseTracker.jsx
│   ├── index.js
│   └── index.css
│
└── uploads/                 # Cartella temporanea per CSV importati
```

---

## 🚀 Primo utilizzo (setup iniziale)

1. Clona il progetto o scaricalo
2. Apri il terminale nella cartella del progetto
3. Installa tutte le dipendenze:

```bash
npm install
```

4. (Facoltativo ma consigliato) Crea le cartelle:

```bash
mkdir -p data uploads
```

5. Verifica che `package.json` contenga:

```json
"proxy": "http://localhost:3001"
```

E che abbia questi script:

```json
"scripts": {
  "start": "concurrently \"npm run server\" \"npm run client\"",
  "server": "nodemon server.js",
  "client": "react-scripts start",
  "dev": "npm start"
}
```

6. Avvia tutto:

```bash
npm run dev
```

L'app sarà accessibile su:  
- `http://localhost:3000` (Frontend React)  
- `http://localhost:3001/api` (Backend API Express)

---

## 🔁 Secondo avvio in poi (riapertura del progetto)

1. Apri il terminale nella cartella `expense-tracker-pro`
2. Avvia il progetto con:

```bash
npm run dev
```

Tutto partirà automaticamente, senza reinstallare le dipendenze.

---

## 🌐 API disponibili

| Metodo | Rotta                | Descrizione                          |
|--------|----------------------|--------------------------------------|
| GET    | `/api/expenses`      | Ottieni tutte le spese               |
| POST   | `/api/expenses`      | Aggiungi una nuova spesa             |
| DELETE | `/api/expenses/:id`  | Elimina una spesa                    |
| GET    | `/api/categories`    | Elenco di tutte le categorie         |
| POST   | `/api/categories`    | Aggiungi una nuova categoria         |
| GET    | `/api/export`        | Esporta CSV                          |
| POST   | `/api/import`        | Importa CSV                          |

---

## 🧩 Problemi comuni

### ❌ Errore: "Server non raggiungibile"
✔️ Verifica che `server.js` sia attivo  
✔️ Controlla che `App.js` usi `/api/expenses` come test di connessione, NON `/api/health`

### ❌ Errore: `expenses.reduce is not a function`
✔️ Hai dimenticato di usare `.data` nel setState:
```js
setExpenses(response.data);
```

---

## 💾 Dati e backup

I dati vengono salvati in CSV in `./data/`:
- `expenses.csv`: tutte le spese
- `categories.csv`: categorie utente

Puoi esportare tutto da interfaccia tramite **"Esporta CSV"**

---

## 👨‍💻 Sviluppatore

Creato con ❤️ da **Elia Cinti** per uso personale.  
Licenza: MIT

---

## 🧪 Espandere il progetto

- Aggiungere autenticazione utente
- Sincronizzazione con Google Sheets
- Notifiche email per rinnovi imminenti

---

## 📦 Peso delle dipendenze

Dopo l'installazione (`npm install`), lo spazio occupato nella cartella `node_modules/` può variare da **200MB a 350MB**, a seconda delle versioni dei pacchetti.  
Questo è normale per progetti React + Express con sviluppo locale (`nodemon`, `concurrently`, `react-scripts`).

Per distribuzioni finali si può ottimizzare escludendo pacchetti di sviluppo.