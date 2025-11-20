// Importa il framework Express.js, necessario per creare il router.
// Express è un framework web minimale e flessibile per Node.js
// che semplifica la gestione delle richieste HTTP e delle rotte.
const express = require('express');

// Importa le funzioni controller per la gestione della registrazione e del login.
// Queste funzioni contengono la logica di business per autenticare gli utenti.
// La destrutturazione { register, login } estrae solo le funzioni che ci servono
// dall'oggetto esportato da authController.js.
const { register, login } = require('../controllers/authController');

// Crea un'istanza del Router di Express.
// express.Router() è una mini-applicazione Express che gestisce solo le rotte.
// Questo permette di organizzare le rotte in moduli separati invece di
// definirle tutte nel file principale app.js, rendendo il codice più modulare e manutenibile.
// 
// Vantaggi del Router:
// 1. Separazione delle responsabilità: ogni file router gestisce un dominio specifico
// 2. Codice più pulito: puoi avere file router separati per auth, users, todos, lists
// 3. Middleware specifici: puoi applicare middleware solo a un gruppo di rotte
// 4. Facilità di testing: ogni router può essere testato indipendentemente
const router = express.Router();

/**
 * Rotta POST per il login
 * 
 * Endpoint: POST /auth/login (quando montato in app.js con app.use('/auth', authRoutes))
 * 
 * Scopo: Autenticare un utente esistente e restituire un token JWT
 * 
 * Body richiesto (JSON):
 * {
 *   "email": "utente@example.com",
 *   "password": "password123"
 * }
 * 
 * Risposta di successo (200):
 * {
 *   "status": "success",
 *   "data": {
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *     "expiresAt": "2025-11-20T10:30:00.000Z"
 *   }
 * }
 * 
 * Risposta di errore (401):
 * {
 *   "status": "error",
 *   "message": "Invalid email or password"
 * }
 * 
 * Metodo HTTP:
 * - POST: usato per inviare dati sensibili (email/password) nel body
 *   invece che nell'URL, garantendo maggiore sicurezza
 */
router.post('/login', login);

/**
 * Rotta POST per la registrazione
 * 
 * Endpoint: POST /auth/register (quando montato in app.js con app.use('/auth', authRoutes))
 * 
 * Scopo: Creare un nuovo account utente e restituire un token JWT
 * 
 * Body richiesto (JSON):
 * {
 *   "name": "Mario Rossi",
 *   "email": "mario@example.com",
 *   "password": "password123"
 * }
 * 
 * Risposta di successo (200):
 * {
 *   "status": "success",
 *   "data": {
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *     "expiresAt": "2025-11-20T10:30:00.000Z"
 *   }
 * }
 * 
 * Risposta di errore (409 - Conflict):
 * {
 *   "status": "error",
 *   "message": "Email is already registered"
 * }
 * 
 * Metodo HTTP:
 * - POST: appropriato per la creazione di nuove risorse (nuovo utente)
 *   secondo le convenzioni REST API
 */
router.post('/register', register);

// Esporta il router per renderlo disponibile in altri file.
// 
// Questo router sarà importato e montato nel file principale app.js in questo modo:
// 
// const authRoutes = require('./routes/authRoutes');
// app.use('/auth', authRoutes);
// 
// Quando monti il router con app.use('/auth', authRoutes), Express aggiunge
// automaticamente il prefisso '/auth' a tutte le rotte definite qui:
// - router.post('/login') diventa accessibile come POST /auth/login
// - router.post('/register') diventa accessibile come POST /auth/register
// 
// Struttura URL completa:
// http://localhost:3000/auth/login
// http://localhost:3000/auth/register
// 
// Flusso di una richiesta:
// 1. Client invia POST /auth/login con email e password
// 2. Express riceve la richiesta
// 3. Controlla se c'è un router montato su /auth
// 4. Trova questo router e cerca una rotta POST /login
// 5. Esegue la funzione 'login' dal controller
// 6. La funzione login valida le credenziali e restituisce un JWT
// 7. La risposta viene inviata al client
module.exports = router;
