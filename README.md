# 📊 Expense Tracker Pro

> Una web app completa e moderna per gestire le tue spese mensili e abbonamenti con facilità

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

## ✨ Caratteristiche principali

- 📈 **Grafici dinamici** - Visualizza le tue spese con grafici a torta e a barre interattivi
- 🏷️ **Categorie personalizzabili** - Organizza le spese secondo le tue esigenze
- 📄 **Import/Export CSV** - Backup e sincronizzazione dati semplificata
- 🔄 **Modalità offline** - Funziona anche senza connessione internet
- 🎨 **Design moderno** - Interfaccia pulita e responsive con TailwindCSS
- ⚡ **Prestazioni ottimizzate** - Backend Express veloce e reattivo

---

## 🚀 Quick Start

### Prerequisiti

Assicurati di avere installato:
- [Node.js](https://nodejs.org/) v16 o superiore
- npm v8 o superiore

### Installazione

```bash
# 1. Clona il repository
git clone https://github.com/tuousername/expense-tracker-pro.git
cd expense-tracker-pro

# 2. Installa le dipendenze
npm install

# 3. Crea le cartelle necessarie (opzionale)
mkdir -p data uploads

# 4. Avvia l'applicazione
npm run dev
```

🎉 **Fatto!** L'app sarà disponibile su `http://localhost:3000`

---

## 🏗️ Struttura del progetto

```
expense-tracker-pro/
├── 📄 server.js                # Server Express
├── 📦 package.json             # Configurazione dipendenze
├── 📁 data/                    # Database CSV
│   ├── expenses.csv
│   └── categories.csv
├── 📁 public/
│   └── index.html              # Template HTML
├── 📁 src/                     # Codice sorgente React
│   ├── App.js
│   ├── ExpenseTracker.jsx
│   ├── index.js
│   └── index.css
└── 📁 uploads/                 # File temporanei
```

---

## 🔧 Comandi disponibili

| Comando | Descrizione |
|---------|-------------|
| `npm run dev` | Avvia frontend e backend in modalità sviluppo |
| `npm run server` | Avvia solo il server Express |
| `npm run client` | Avvia solo il client React |
| `npm start` | Alias per `npm run dev` |

---

## 🌐 API Reference

### Spese
- `GET /api/expenses` - Recupera tutte le spese
- `POST /api/expenses` - Crea una nuova spesa
- `DELETE /api/expenses/:id` - Elimina una spesa

### Categorie
- `GET /api/categories` - Lista tutte le categorie
- `POST /api/categories` - Crea una nuova categoria

### Utilità
- `GET /api/export` - Esporta dati in CSV
- `POST /api/import` - Importa dati da CSV

---

## 🐛 Troubleshooting

<details>
<summary><strong>❌ Errore: "Server non raggiungibile"</strong></summary>

**Soluzione:**
1. Verifica che il server sia attivo su `http://localhost:3001`
2. Controlla che il `proxy` in `package.json` sia impostato correttamente
3. Riavvia l'applicazione con `npm run dev`
</details>

<details>
<summary><strong>❌ Errore: "expenses.reduce is not a function"</strong></summary>

**Soluzione:**
Assicurati di utilizzare `.data` quando imposti lo stato:
```javascript
// ❌ Sbagliato
setExpenses(response);

// ✅ Corretto
setExpenses(response.data);
```
</details>

<details>
<summary><strong>❌ Porta già in uso</strong></summary>

**Soluzione:**
```bash
# Termina i processi sulla porta 3000 e 3001
npx kill-port 3000 3001
npm run dev
```
</details>

---

## 💾 Gestione dati

### Backup automatico
I dati vengono salvati automaticamente in formato CSV nella cartella `./data/`:
- `expenses.csv` - Tutte le spese registrate
- `categories.csv` - Categorie personalizzate

### Export manuale
Utilizza il pulsante **"Esporta CSV"** nell'interfaccia per scaricare i tuoi dati.

---

## 🔮 Roadmap futura

- [ ] 🔐 Autenticazione utenti
- [ ] ☁️ Sincronizzazione cloud (Google Drive/Dropbox)
- [ ] 📧 Notifiche email per abbonamenti in scadenza
- [ ] 📱 App mobile con React Native
- [ ] 🌍 Supporto multi-lingua
- [ ] 📊 Report avanzati e analytics

---

## 🤝 Contributing

Contributi, issues e feature requests sono benvenuti!

1. Fai un fork del progetto
2. Crea il tuo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit le tue modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push sul branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

---

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.

---

## 👨‍💻 Autore

**Elia Cinti**
- 💼 LinkedIn: [Elia Cinti - https://www.linkedin.com/in/elia-cinti-730191254/]
- 📧 Email: cintielia21@gmail.com

---

## 🙏 Ringraziamenti

- [React](https://reactjs.org/) - Per il framework frontend
- [Express](https://expressjs.com/) - Per il server backend
- [TailwindCSS](https://tailwindcss.com/) - Per il sistema di styling
- [Chart.js](https://www.chartjs.org/) - Per i grafici interattivi

---

<div align="center">

**Se questo progetto ti è stato utile, lascia una ⭐!**

</div>