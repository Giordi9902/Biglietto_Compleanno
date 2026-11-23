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

  // Quiz: ogni risposta giusta sblocca un indizio e scopre un pezzo del regalo.
  // `corretta` è l'indice (da 0) dell'opzione giusta.
  quiz: [
    {
      domanda: 'Ti accompagno in viaggio, ma non sono una valigia. Torno a casa più piena di quando sono partita, ma non peso un grammo di più. Cosa porto con me?',
      opzioni: ['Souvenir', 'Ricordi', 'Sabbia nelle scarpe', 'Calzini spaiati'],
      corretta: 1,
      indizio: 'serve a conservare i ricordi',
    },
    {
      domanda: 'Vivo di luce: senza di lei non combino niente. Quando è buio chiedo aiuto a un lampo tutto mio. Come si chiama?',
      opzioni: ['Il fulmine', 'La torcia', 'Il flash', "L'abat-jour"],
      corretta: 2,
      indizio: 'ha un lampo tutto suo',
    },
    {
      domanda: 'Ho un occhio solo, di vetro, e lo uso per mettere a fuoco le cose belle (tipo te). Come si chiama il mio occhio?',
      opzioni: ["L'obiettivo", 'Il monocolo', "L'oblò", 'Il cannocchiale'],
      corretta: 0,
      indizio: "ha un occhio di vetro che mette a fuoco",
    },
    {
      domanda: 'Quando lavoro dico sempre la stessa parolina, e tutti si mettono in posa. Che verso faccio?',
      opzioni: ['Bip!', 'Drin!', 'Click!', 'Muuu!'],
      corretta: 2,
      indizio: 'fa «click!»',
    },
    {
      domanda: 'Niente rullino: i miei ricordi sono fatti di milioni di puntini colorati. Come si chiamano?',
      opzioni: ['Coriandoli', 'Pixel', 'Pois', 'Brillantini'],
      corretta: 1,
      indizio: 'è digitale: ragiona in pixel',
    },
  ],

  rispostaGiusta: ['Esatto!', 'Brava!', 'Giusto!', 'Sì!', 'Perfetto!'],
  rispostaSbagliata: ['Acqua! 💧', 'Nope, riprova!', 'Fuochino... ma no.', 'Mmm, non proprio.', 'Quasi! (No.)'],

  regalo: {
    titolo: 'Una macchina fotografica digitale!',
    messaggio: `Perché i tuoi ${anni} anni meritano di essere ricordati in alta definizione.
Portala ovunque: viaggi, cene, tramonti... e qualche selfie insieme (prometto di non chiudere gli occhi).`,
    // Se il regalo è nascosto da qualche parte, scrivilo qui (lascia '' per non mostrarlo).
    doveTrovarlo: '',
    suggerimento: 'Suggerimento: inizia con «macchina f…»',
    // Parole (anche parziali, senza accenti) che contano come risposta giusta.
    paroleGiuste: ['fotocamer', 'fotografic', 'macchinett', 'camera', 'digicam', 'reflex', 'mirrorless', 'compatta'],
    // Risposte "quasi", controllate PRIMA di quelle giuste...
    quasi: [
      { parole: ['videocamer', 'webcam', 'gopro', 'go pro', 'telecamer'], risposta: 'Fuochino! Sa fare anche i video, ma il suo mestiere principale è un altro...' },
      { parole: ['polaroid', 'istantane'], risposta: 'Quasi! Ma questa è digitale: niente foto che escono dalla fessura.' },
      { parole: ['telefon', 'cellular', 'smartphone', 'iphone'], risposta: 'Fuochino! Il telefono ce l’hai già: questo fa una cosa sola, ma la fa benissimo.' },
    ],
    // ...e queste DOPO.
    fuochino: [
      { parole: ['macchina', 'auto'], risposta: 'Una macchina?! Magari... è molto più piccola. Ma «macchina» è un ottimo inizio.' },
      { parole: ['foto', 'scatt', 'rullin', 'obiettiv', 'flash', 'pixel'], risposta: 'Ci sei quasi! Ma con cosa si fanno le foto?' },
    ],
  },

  finale: {
    testo: `Foto 1 di ∞.
Ne faremo tantissime, insieme.

Buon compleanno, amore mio.`,
  },
};
