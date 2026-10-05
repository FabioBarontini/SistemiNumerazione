# THE LAST MACHINE — multiplayer senza database

## Struttura
- `index.html` — frontend, pronto per essere pubblicato su Vercel.
- `server/server.js` — server WebSocket. Tiene le room solo in RAM.
- `server/package.json` — dipendenza `ws`.

## Come provarlo in locale

### 1. Avvia il server
Serve Node.js 18+.

```bash
cd server
npm install
npm start
```

Il server ascolta sulla porta 8787.

### 2. Avvia il frontend
Puoi usare un server statico, ad esempio:

```bash
python -m http.server 5500
```

dalla cartella principale.

Apri `http://localhost:5500`.

### 3. Multiplayer sulla stessa rete
Per far entrare altri PC della LAN, il server WebSocket deve essere raggiungibile dall'indirizzo IP del computer che lo esegue. Il frontend può essere configurato con:

```js
window.LM_WS_URL = "ws://192.168.1.50:8787";
```

Prima di `index.html` oppure tramite una piccola modifica del file.

## Pubblicazione

Vercel è perfetto per il frontend statico, ma non è il posto giusto per mantenere un WebSocket Node persistente. Per il server usa un servizio che supporti processi WebSocket persistenti (per esempio Render, Railway, Fly.io o un tuo server).

Poi nel frontend imposta:

```js
window.LM_WS_URL = "wss://TUO-SERVER.example.com";
```

Il gioco non usa database: room, giocatori, punteggi e stato della missione vivono nella RAM del server e spariscono quando la room viene svuotata o il server viene riavviato.

## Meccaniche
- host crea una room;
- studenti entrano con codice + codename;
- host avvia la missione;
- tutti ricevono lo stesso frammento;
- il primo/uno studente che risponde correttamente recupera memoria;
- +100 al giocatore;
- +1 alla memoria collettiva;
- nessuna eliminazione;
- hint disponibili;
- 60 frammenti per completare la memoria;
- conversioni casuali 0–255 in entrambe le direzioni.
