# 🟡 Banana Padel Tour

Sito web per la gestione di un torneo di padel con tabellone, giocatori, statistiche e area amministratore.

## 🏗️ Architettura

- **Frontend**: React SPA con Vite
- **Backend**: Node.js/Express API REST
- **Database**: SQLite
- **Reverse Proxy**: Traefik con Let's Encrypt per HTTPS
- **Deployment**: Docker Compose

## 🚀 Setup Locale (Sviluppo)

### Prerequisiti

- Node.js 18+
- npm

### Backend

```bash
cd backend
npm install
npm run seed  # Popola il database con dati iniziali
npm run dev   # Avvia server su http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # Avvia dev server su http://localhost:5173
```

## 🐳 Deployment con Docker

### Prerequisiti

- Docker
- Docker Compose
- Dominio configurato per puntare all'IP del server

### Configurazione

1. Copia il file `.env.example` in `.env`:
```bash
cp .env.example .env
```

2. Modifica `.env` con i tuoi valori:
```env
DOMAIN=bananapadeltour.duckdns.org
ACME_EMAIL=your-email@example.com
```

3. Assicurati che il dominio punti all'IP del server

### Avvio

```bash
docker-compose up -d
```

Il sito sarà disponibile su:
- `https://bananapadeltour.duckdns.org` (HTTPS)
- `http://bananapadeltour.duckdns.org` (redirect automatico a HTTPS)

### Comandi Utili

```bash
# Visualizza log
docker-compose logs -f

# Riavvia servizi
docker-compose restart

# Ferma servizi
docker-compose down

# Ricostruisci immagini
docker-compose build --no-cache
docker-compose up -d
```

## 📁 Struttura Progetto

```
padel/
├── frontend/          # React frontend
├── backend/           # Express API
├── traefik/           # Configurazione Traefik
├── docker-compose.yml # Orchestrazione Docker
└── README.md
```

## 🔧 Funzionalità

- ✅ Pagina di benvenuto
- ✅ Home page con menu
- ✅ Tabellone torneo (Quarti, Semifinali, Finali)
- ✅ Lista giocatori
- ✅ Dettaglio giocatore con statistiche
- ✅ Area amministratore (CRUD giocatori, reset torneo)
- ✅ Calcolo automatico vincitori
- ✅ Popolamento automatico fasi successive
- ✅ Upload immagini giocatori
- ✅ HTTPS con Let's Encrypt

## 📝 Note

- Il database SQLite viene salvato in un volume Docker per persistenza
- Le immagini caricate vengono salvate in `backend/uploads/`
- I certificati SSL vengono salvati in un volume Traefik
- Il reset del torneo azzera partite e statistiche ma mantiene i giocatori

## 🛠️ Sviluppo

Per modifiche al codice:

1. Modifica i file nel progetto
2. Per frontend: `docker-compose build frontend && docker-compose up -d frontend`
3. Per backend: `docker-compose build backend && docker-compose up -d backend`

## 📄 Licenza

ISC
