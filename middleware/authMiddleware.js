// Importa la libreria jsonwebtoken per creare e verificare i token JWT.
// JWT (JSON Web Token) è un metodo standard per autenticazione sicura e stateless.
const jwt = require('jsonwebtoken');

// Importa dotenv per leggere variabili d'ambiente dal file .env.
// Questo permette di mantenere dati sensibili (come JWT_SECRET) fuori dal codice.
const dotenv = require('dotenv');

// Importa la funzione helper errorResponse per formattare risposte di errore standardizzate.
// Questo mantiene le risposte API coerenti in tutta l'applicazione.
const { errorResponse } = require('../utils/responseHelper');

// Carica tutte le variabili d'ambiente dal file .env nel processo Node.js.
// Dopo questa chiamata, puoi accedere alle variabili con process.env.NOME_VARIABILE.
dotenv.config();

/**
 * Middleware di autenticazione JWT
 * 
 * Questo middleware protegge le rotte verificando che il client invii un token JWT valido.
 * Viene eseguito PRIMA del controller della rotta, intercettando ogni richiesta.
 * 
 * Funzionamento:
 * 1. Estrae il token dall'header Authorization
 * 2. Verifica che il token esista
 * 3. Verifica che il token sia valido e non scaduto
 * 4. Se tutto è OK, passa al prossimo middleware/controller
 * 5. Se c'è un errore, blocca la richiesta e restituisce 401 Unauthorized
 */
const authMiddleware = (req, res, next) => {
  // Estrae il token JWT dall'header 'Authorization' della richiesta HTTP.
  // L'header deve avere formato: "Authorization: Bearer TOKEN_QUI"
  // Il metodo .replace('Bearer ', '') rimuove la parola "Bearer " lasciando solo il token.
  // L'operatore ?. (optional chaining) previene errori se l'header non esiste.
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Verifica se il token è presente nella richiesta.
  // Se manca, significa che l'utente non è autenticato.
  if (!token) {
    // Blocca la richiesta e restituisce errore 401 (Unauthorized).
    // L'utente deve prima effettuare il login per ottenere un token valido.
    return errorResponse(res, 'Unauthorized', 401);
  }

  try {
    // Verifica la validità del token usando jwt.verify().
    // Questa funzione:
    // 1. Controlla che il token non sia stato modificato (verifica firma)
    // 2. Controlla che il token non sia scaduto (verifica expiresIn)
    // 3. Decodifica il payload del token (contiene id, email, ecc.)
    // 
    // process.env.JWT_SECRET è la chiave segreta usata per firmare il token.
    // DEVE essere la stessa chiave usata quando il token è stato creato.
    const tokenDecoded = jwt.verify(token, process.env.JWT_SECRET);

    // Salva i dati decodificati del token nell'oggetto req.user.
    // Questo rende i dati dell'utente (id, email) accessibili in tutti i controller successivi.
    // Esempio: nei controller puoi usare req.user.id per ottenere l'ID dell'utente loggato.
    req.user = tokenDecoded;

    // Chiama next() per passare il controllo al middleware successivo o al route handler.
    // Questo dice a Express: "tutto OK, continua a processare la richiesta".
    next();
    
  } catch (error) {
    // Se jwt.verify() lancia un errore, significa che:
    // 1. Il token è stato modificato (firma non valida)
    // 2. Il token è scaduto (superato il TTL - Time To Live)
    // 3. Il token ha un formato non valido
    // 4. La chiave segreta non corrisponde
    
    // Blocca la richiesta e restituisce errore 401 con messaggio personalizzato.
    // Il messaggio include anche il TTL configurato per aiutare il debugging.
    return errorResponse(
      res,
      'Invalid token, TTL:' + process.env.JWT_TTL, // Mostra anche il TTL dal .env per debug
      401,
      error // Passa l'oggetto errore completo per logging dettagliato
    );
  }
};

// Esporta il middleware per poterlo usare in app.js o nei file delle rotte.
// 
// Esempio di utilizzo nelle rotte protette:
// const authMiddleware = require('./middleware/authMiddleware');
// router.get('/profile', authMiddleware, getUserProfile);
// 
// In questo modo, getUserProfile viene eseguito SOLO se authMiddleware dà l'OK.
module.exports = authMiddleware;
