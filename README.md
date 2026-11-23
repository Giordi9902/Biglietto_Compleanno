# Biglietto di compleanno in ASCII art 💐

Single page application React (Vite) con:

1. **Avvio** in stile terminale
2. **Biglietto**: titoli FIGlet, mazzo di fiori ASCII animato (cresce, sboccia, ondeggia, perde petali) e messaggio scritto a macchina
3. **Torta** con 26 candeline: si spengono toccando la torta, col bottone o soffiando nel microfono; suona "Tanti auguri" in chiptune
4. **Caccia al regalo**: 5 indovinelli; ogni risposta giusta gratta via un pezzo del regalo nascosto, poi si indovina scrivendo
5. **Prima foto** sul display della macchina fotografica

## Avvio

```bash
npm install
npm run dev        # http://localhost:5173
```

## Personalizzare

Testi, nome, età, firma, domande del quiz e risposte accettate stanno tutti in **`src/config.js`**.
Il campo `regalo.doveTrovarlo` mostra un indizio sul nascondiglio (se il regalo è nascosto).

## Pubblicare

```bash
npm run build      # crea la cartella dist/
```

`dist/` è un sito statico: si può trascinare su [Netlify Drop](https://app.netlify.com/drop) o pubblicare su GitHub Pages / Vercel.
Il microfono funziona solo su HTTPS (o su localhost). L'audio parte dopo il primo tocco.

## Struttura

- `src/lib/bouquet.js`, `cake.js`, `camera.js`, `photo.js`: disegni ASCII procedurali (puro JS, senza React)
- `src/lib/grid.js`: griglia di caratteri + colori → HTML
- `src/lib/audio.js`: suoni sintetizzati con Web Audio; `src/lib/blow.js`: rilevamento del soffio
- `src/components/`: le schermate
