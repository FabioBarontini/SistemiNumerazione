# THE LAST MACHINE v2

Versione multiplayer senza database.

- Frontend statico su Vercel
- Server WebSocket su Render
- 24 frammenti invece di 60 domande
- 6 capitoli narrativi
- 4 tipi di sfida: conversione, conversione inversa, riparazione bit, ASCII
- eventi narrativi
- punteggio individuale privato
- memoria collettiva condivisa
- streak personale con bonus
- finale narrativo

## Vercel
Root del repository, Framework `Other`, Build Command vuoto, Output Directory `.`.

## Render
Root Directory `server`, Build Command `npm install`, Start Command `npm start`.

Il frontend usa `wss://sisteminumerazione.onrender.com`. Se cambi il nome del servizio Render, modifica `window.LM_WS_URL` in `index.html`.
