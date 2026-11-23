// ✏️  Personalizza qui il biglietto: nomi, testi, quiz e regalo.
// Tutto il resto dell'app legge da questo file.

const nome = 'Mariapia';
const anni = 26;
const firma = 'Giorgio';

export const CONFIG = {
  nome,
  anni,
  firma,

  // Righe "di sistema" scritte all'avvio, come in un vecchio terminale.
  boot: [
    '> avvio biglietto_auguri.exe',
    '> caricamento fiori ................... OK',
    `> accensione ${anni} candeline ............ OK`,
    '> occultamento regalo ................. OK',
    `> destinataria: ${nome}`,
    `> stato: oggi compie ${anni} anni`,
  ],

  // Il biglietto vero e proprio (viene scritto un carattere alla volta).
  messaggio: `Amore mio,

oggi compi ${anni} anni e ho deciso di fartelo sapere nel modo più nerd possibile: un carattere alla volta.

Ti ho preparato un mazzo di fiori che non appassirà mai (gli basta un po' di corrente), una torta a zero calorie e un piccolo gioco.

Grazie per ogni risata, ogni abbraccio e ogni giorno passato insieme. Che questo nuovo anno sia pieno di luce, di viaggi e di momenti da ricordare.

Buon compleanno ♥`,

  // Quiz: ogni risposta giusta regala una lettera della parola segreta e
  // gratta via un pezzo del pacco. Il regalo vero NON viene svelato: si consegna a mano.
  // `corretta` è l'indice (da 0) dell'opzione giusta, `lettera` la lettera sbloccata.
  quiz: [
    {
      domanda: 'Oggi tutti ti cantano «Tanti…»?',
      opzioni: ['Saluti', 'Auguri', 'Complimenti', 'Bis!'],
      corretta: 1,
      lettera: 'A',
      indizio: 'come Auguri',
    },
    {
      domanda: "All'inizio del biglietto ti ho regalato una cosa che non appassirà mai. Cos'era?",
      opzioni: ['Una pianta grassa', 'Un mazzo di fiori', 'Un orologio', 'Un pupazzo'],
      corretta: 1,
      lettera: 'M',
      indizio: 'come Mazzo di fiori',
    },
    {
      domanda: "Qual è il giorno più bello di tutto l'anno?",
      opzioni: ['Natale', 'Ferragosto', 'Il lunedì mattina', 'Oggi'],
      corretta: 3,
      lettera: 'O',
      indizio: 'come Oggi',
    },
    {
      domanda: 'Nel biglietto ti ringrazio per ogni abbraccio, ogni giorno insieme e ogni…',
      opzioni: ['Litigata', 'Messaggio vocale', 'Risata', 'Pizza (anche quella)'],
      corretta: 2,
      lettera: 'R',
      indizio: 'come Risata',
    },
    {
      domanda: 'Ti amo da qui fino a…',
      opzioni: ['Domani mattina', 'Il frigorifero', "L'eternità", 'La fermata del bus'],
      corretta: 2,
      lettera: 'E',
      indizio: "come Eternità",
    },
  ],

  rispostaGiusta: ['Esatto!', 'Brava!', 'Giusto!', 'Sì!', 'Perfetto!'],
  rispostaSbagliata: ['Acqua! 💧', 'Nope, riprova!', 'Fuochino... ma no.', 'Mmm, non proprio.', 'Quasi! (No.)'],

  // Ultimo livello: mettere in fila le lettere e scrivere la parola segreta.
  parolaSegreta: {
    domanda: 'Ultimo livello: metti in fila le lettere. Qual è la parola segreta?',
    // Parole (senza accenti) che contano come risposta giusta.
    paroleGiuste: ['amore'],
    suggerimento: 'Suggerimento: è quello che provo per te (5 lettere).',
    // Risposte "quasi" con il loro commento.
    quasi: [
      { parole: ['roma'], risposta: 'Roma è bellissima, ma manca una lettera!' },
      { parole: ['omero', 'morea', 'ramo', 'mare', 'more', 'oram'], risposta: 'Le lettere sono quelle, ma l’ordine no: riprova!' },
      { parole: ['amo', 'love', 'cuore'], risposta: 'Fuochino! Il senso è giusto, ma usa le lettere sbloccate.' },
    ],
  },

  // Dopo la parola segreta: il regalo resta un mistero, si consegna a mano.
  regalo: {
    titolo: 'Il tuo regalo non sta qui dentro…',
    messaggio: `…perché certe cose non si possono mandare in ASCII art.
Alza gli occhi dallo schermo, chiudili per un attimo e tendi le mani: il regalo te lo do io, adesso. 🎁

Quando l’hai scartato, torna qui: c’è un’ultima sorpresa.`,
    bottone: '[ ho scartato il regalo! → ]',
  },

  finale: {
    testo: `Foto 1 di ∞.
Ne faremo tantissime, insieme.

Buon compleanno, amore mio.`,
  },
};
