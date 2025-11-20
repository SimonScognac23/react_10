// Importa il middleware di autenticazione personalizzato.
// Questo deve essere dichiarato PRIMA di usarlo nelle rotte più in basso.
// Il middleware verifica che l'utente abbia un token JWT valido prima di
// permettere l'accesso alle rotte protette (liste e todos).
const authMiddleware = require('./middleware/authMiddleware');

// Importa il framework Express.js
// Express è un framework web minimale e flessibile per Node.js che semplifica
// la creazione di server HTTP e la gestione delle richieste/risposte.
// È il framework più popolare per costruire API REST in Node.js.
const express = require('express');

// Crea un'istanza dell'applicazione Express.
// 'app' rappresenta l'intera applicazione web e verrà usata per:
// - Definire rotte (endpoint API)
// - Applicare middleware (funzioni che processano le richieste)
// - Configurare il server
// - Gestire errori
const app = express();

/**
 * Middleware built-in di Express per parsare JSON
 * 
 * express.json() è un middleware che:
 * 1. Intercetta TUTTE le richieste in arrivo
 * 2. Controlla se il Content-Type è application/json
 * 3. Se sì, legge il body della richiesta e lo converte da JSON a oggetto JavaScript
 * 4. Rende l'oggetto disponibile in req.body
 * 
 * Senza questo middleware, req.body sarebbe undefined quando il client
 * invia dati JSON, impedendo di leggere email, password, name, ecc.
 * 
 * Esempio:
 * Client invia: { "email": "test@test.com", "password": "123" }
 * Dopo express.json(): req.body = { email: "test@test.com", password: "123" }
 */
app.use(express.json());

// Importa i router delle varie funzionalità dell'applicazione.
// Ogni router gestisce un gruppo specifico di endpoint correlati,
// seguendo il principio di separazione delle responsabilità (Separation of Concerns).
// Questo rende il codice più organizzato, manutenibile e testabile.
const listRoutes = require('./routes/listRoutes');   // Route per gestire le liste (CRUD)
const todoRoutes = require('./routes/todoRoutes');   // Route per gestire i todo (CRUD)
const authRoutes = require('./routes/authRoutes');   // Route per autenticazione (login/register)

// Importa il middleware per l'autenticazione JWT
// Questo middleware verifica che l'utente sia loggato (abbia un token valido)
// prima di permettere l'accesso a certe route protette.
// È stato commentato qui perché è già stato importato all'inizio del file (riga 1).
//const authMiddleware = require('./middleware/authMiddleware');

// Importa il pacchetto CORS (Cross-Origin Resource Sharing)
// CORS è un middleware di terze parti che gestisce la sicurezza cross-origin.
// 
// Cos'è il problema cross-origin?
// I browser implementano una Same-Origin Policy che blocca richieste JavaScript
// da un dominio (es: http://localhost:3000) verso un altro (es: http://localhost:5000).
// Questo previene attacchi XSS (Cross-Site Scripting) ma blocca anche app legittime.
// 
// CORS risolve questo problema dicendo al browser: "È OK, questo server
// permette richieste da questi domini specifici".
const cors = require('cors');

/**
 * Configurazione CORS
 * 
 * corsOptions è un oggetto che definisce le regole di sicurezza CORS.
 * Queste regole controllano quali client possono accedere all'API.
 */
const corsOptions = {
    // origin: lista di domini (origini) che possono fare richieste all'API
    // 
    // process.env.CORS_ALLOW_ORIGINS è una variabile d'ambiente che contiene
    // una stringa tipo: "http://localhost:3000,http://localhost:3001"
    // 
    // .split(',') divide la stringa in un array:
    // ["http://localhost:3000", "http://localhost:3001"]
    // 
    // Solo i domini in questa lista riceveranno l'header Access-Control-Allow-Origin,
    // permettendo al browser di completare la richiesta.
    // Tutti gli altri domini riceveranno un errore CORS.
    origin: process.env.CORS_ALLOW_ORIGINS.split(','),
    
    // methods: lista di metodi HTTP permessi per le richieste cross-origin
    // 
    // process.env.CORS_ALLOW_METHODS potrebbe contenere: "GET,POST,PUT,DELETE"
    // .split(',') lo converte in: ["GET", "POST", "PUT", "DELETE"]
    // 
    // Se un client prova a fare una richiesta PATCH e PATCH non è nella lista,
    // il browser blocca la richiesta con un errore CORS.
    methods: process.env.CORS_ALLOW_METHODS.split(','),
    
    // credentials: true permette al client di inviare credenziali nelle richieste
    // 
    // Credenziali includono:
    // - Cookie (es: session cookies)
    // - Header di autenticazione (es: Authorization: Bearer TOKEN)
    // - Certificati TLS client
    // 
    // Con credentials: true, il browser permette a JavaScript di inviare
    // l'header Authorization con il token JWT nelle richieste cross-origin.
    // Senza questo, il token non verrebbe inviato e l'autenticazione fallirebbe.
    credentials: true
};

/**
 * Applica il middleware CORS a TUTTE le richieste
 * 
 * app.use(cors(corsOptions)) fa sì che Express:
 * 1. Intercetti OGNI richiesta in arrivo
 * 2. Controlli l'header Origin della richiesta
 * 3. Verifichi se l'origine è nella allowlist
 * 4. Se sì, aggiunga gli header CORS appropriati alla risposta:
 *    - Access-Control-Allow-Origin: http://localhost:3000
 *    - Access-Control-Allow-Methods: GET,POST,PUT,DELETE
 *    - Access-Control-Allow-Credentials: true
 * 5. Se no, non aggiunga gli header (il browser blocca la richiesta)
 * 
 * Questo middleware deve essere applicato PRIMA delle rotte per funzionare.
 */
app.use(cors(corsOptions));

/**
 * Definisce le route principali dell'API
 * 
 * app.use() monta i router su percorsi specifici.
 * Ogni router gestisce tutte le richieste che iniziano con quel percorso.
 */

/**
 * Route per le liste - PROTETTA
 * 
 * app.use('/api/lists', authMiddleware, listRoutes)
 * 
 * Questa riga fa 3 cose:
 * 1. Monta listRoutes su /api/lists
 * 2. Applica authMiddleware PRIMA di listRoutes
 * 3. Crea la catena di middleware: richiesta → authMiddleware → listRoutes → risposta
 * 
 * Flusso di una richiesta GET /api/lists:
 * 1. Express riceve GET /api/lists
 * 2. Trova il mount point /api/lists
 * 3. Esegue authMiddleware:
 *    - Controlla se esiste un token JWT valido
 *    - Se sì, estrae i dati utente e li mette in req.user
 *    - Chiama next() per passare al prossimo middleware
 *    - Se no, restituisce errore 401 e blocca la richiesta
 * 4. Se authMiddleware dà l'OK, esegue listRoutes
 * 5. listRoutes trova la rotta GET / e chiama getUserLists controller
 * 6. Il controller usa req.user.id per recuperare solo le liste dell'utente loggato
 * 7. Invia la risposta al client
 */
app.use('/api/lists', authMiddleware, listRoutes);

/**
 * Route per i todos - PROTETTA
 * 
 * Stesso meccanismo delle liste.
 * authMiddleware garantisce che solo utenti autenticati possano
 * creare, leggere, aggiornare o eliminare todos.
 * 
 * Endpoints disponibili (esempi):
 * - POST /api/todos/list → getTodos (tutti i todos di una lista)
 * - GET /api/todos/:id → getTodoById
 * - POST /api/todos → createTodo
 * - PUT /api/todos/:id → updateTodo
 * - DELETE /api/todos/:id → deleteTodo
 */
app.use('/api/todos', authMiddleware, todoRoutes);

/**
 * Route per l'autenticazione - PUBBLICA
 * 
 * app.use('/api/auth', authRoutes)
 * 
 * NON ha authMiddleware perché le rotte di autenticazione DEVONO essere pubbliche:
 * - Gli utenti non loggati devono poter fare /api/auth/register
 * - Gli utenti non loggati devono poter fare /api/auth/login
 * 
 * Se applicassimo authMiddleware qui, gli utenti non potrebbero mai registrarsi
 * o fare login perché non avrebbero ancora un token!
 * 
 * Endpoints disponibili:
 * - POST /api/auth/register → register controller (crea utente e restituisce token)
 * - POST /api/auth/login → login controller (valida credenziali e restituisce token)
 */
app.use('/api/auth', authRoutes);

/**
 * Imposta la porta su cui il server ascolta
 * 
 * process.env.PORT legge la variabile d'ambiente PORT dal file .env
 * Se non esiste (es: file .env mancante), usa 5000 come default (|| = OR logico)
 * 
 * In produzione (es: Heroku, AWS), il provider imposta automaticamente PORT.
 * In sviluppo locale, la leggi dal file .env (es: PORT=5000)
 */
const PORT = process.env.PORT || 5000;

/**
 * Avvia il server HTTP
 * 
 * app.listen() fa partire il server Express che:
 * 1. Inizia ad ascoltare richieste HTTP sulla porta specificata
 * 2. Esegue la callback quando il server è pronto
 * 
 * Parametri:
 * - PORT: numero della porta (es: 5000)
 * - callback: funzione eseguita quando il server è attivo
 * 
 * Una volta avviato, il server rimane in ascolto fino a quando:
 * - Premi Ctrl+C nella console
 * - Il processo viene terminato
 * - Si verifica un errore critico
 * 
 * Dopo questa chiamata, puoi accedere all'API da:
 * http://localhost:5000/api/auth/login
 * http://localhost:5000/api/lists
 * http://localhost:5000/api/todos
 */
app.listen(PORT, () => {
    // Stampa un messaggio nella console per confermare che il server è attivo.
    // Questo è utile durante lo sviluppo per sapere quando l'app è pronta.
    console.log("listening on port " + PORT);
});
