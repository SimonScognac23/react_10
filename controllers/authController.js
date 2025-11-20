// Importa il modello User per interagire con il database
const User = require('../models/User');

// Importa il pacchetto per creare e verificare JWT (JSON Web Token)
const jwt = require('jsonwebtoken');

// Importa dotenv per caricare le variabili d'ambiente da .env
const dotenv = require('dotenv');

// Importa helper per formattare le risposte di successo o errore
const { successResponse, errorResponse } = require('../utils/responseHelper');

// Importa bcryptjs per hashare e verificare le password
const bcrypt = require('bcryptjs');

// Carica le variabili d'ambiente definite nel file .env
dotenv.config();

/**
 * Funzione per registrare un nuovo utente
 * Riceve i dati dal client, verifica che l'email non sia già registrata,
 * crea l'utente nel database e restituisce un token JWT
 */
const register = async (req, res) => { // Funzione asincrona per gestire la registrazione, riceve richiesta e risposta
    try {
        // Estrae i dati inviati dal client nel body della richiesta (nome, email, password)
        const { name, email, password } = req.body;

        // Cerca nel database se esiste già un utente con questa email
        const existingUser = await User.findByEmail(email);
        
        // Se l'email è già registrata, restituisce un errore 409 (conflitto)
        if (existingUser) {
            return errorResponse(res, 'Email is already registered', 409);
        }

        // Crea il nuovo utente nel database e ottiene l'ID del nuovo record
        const userId = await User.create(name, email, password);

        // Prende la chiave segreta per firmare il JWT dal file .env
        // Se non esiste, usa un valore di fallback (solo per sviluppo, MAI in produzione!)
        const secret = process.env.JWT_SECRET || 'dsfsdfdsfsfdsf4332432432432432432';

        // Prende il tempo di vita del token (in secondi) dal file .env
        const ttl = process.env.JWT_TTL;

        // Crea il token JWT contenente id e email dell'utente
        // Il token sarà valido per il tempo specificato in ttl
        const token = jwt.sign({ id: userId, email }, secret, { expiresIn: ttl });// sign firma il token con il payload, la chiave segreta e le opzioni

        // Calcola la data di scadenza del token in millisecondi
        // Date.now() restituisce il timestamp corrente in millisecondi
        // ttl * 1000 converte i secondi in millisecondi
        const expiryDate = new Date(Date.now() + ttl * 1000);

        // Invia risposta di successo al client con il token e la data di scadenza
        successResponse(res, { token, expiresAt: expiryDate });
    } catch (error) {
        // Se si verifica un errore durante la registrazione, invia errore 500 (errore del server)
        errorResponse(res, "Error registering user", 500, error);
    }
};

/**
 * Funzione per effettuare il login di un utente esistente
 * Verifica che l'email esista, controlla la password,
 * e se tutto è corretto restituisce un token JWT
 */
const login = async (req, res) => {
    // Estrae email e password dal body della richiesta
    const { email, password } = req.body;

    try {
        // Cerca l'utente nel database tramite email
        const user = await User.findByEmail(email);

        // Se l'utente non esiste, restituisce errore 401 (non autorizzato)
        // Per sicurezza, non specifichiamo se è l'email o la password a essere errata
        if (!user) {
            return errorResponse(res, 'Invalid email or password', 401);
        }

        // Confronta la password inserita con quella hashata salvata nel database
        // bcrypt.compare restituisce true se le password corrispondono, false altrimenti
        const isPasswordValid = await bcrypt.compare(password, user.password);

        // Se la password non è valida, restituisce errore 401
        if (!isPasswordValid) {
            return errorResponse(res, 'Invalid email or password', 401);
        }

        // Prende la chiave segreta dal file .env (con fallback, solo per sviluppo)
        const secret = process.env.JWT_SECRET || 'dsfsdfdsfsfdsf4332432432432432432';

        // Prende il tempo di vita del token dal file .env
        const ttl = process.env.JWT_TTL;

        // Genera un nuovo token JWT contenente id e email dell'utente loggato
        const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: ttl });

        // Calcola la data di scadenza del token convertendo TTL da secondi a millisecondi
        const expiryDate = new Date(Date.now() + ttl * 1000);

        // Restituisce risposta di successo con il token e la data di scadenza
        return successResponse(res, { token, expiresAt: expiryDate });
    } catch (error) {
        // Logga l'errore nella console per debug
        console.error('Error logging in user:', error);
        
        // Invia risposta di errore 500 (errore del server)
        return errorResponse(res, 'Error logging in user', 500, error);
    }
};

// Esporta le funzioni register e login per poterle usare nelle rotte
module.exports = {
    register,
    login,
};
