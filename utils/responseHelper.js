// Funzione per inviare una risposta di successo standardizzata
const successResponse = (res, data = [], message = "Request completed successfully") =>{
  return res.status(200).json({
          success: true,   // Indica che la richiesta è andata a buon fine
          data,            // Dati restituiti al client
          message,         // Messaggio informativo
      }
  );
}

// Funzione per inviare una risposta di errore standardizzata
const errorResponse = (res,  message = "An error occurred", status = 500, error = {}) => {
    return res.status(status).json({
        success: false,  // Indica che la richiesta è fallita
        message,         // Messaggio descrittivo dell’errore
        error            // Dettagli tecnici dell’errore (opzionale)
    }
    );
}

// Esportiamo entrambe le funzioni per usarle nei controller
module.exports = {successResponse, errorResponse};
