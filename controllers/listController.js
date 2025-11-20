// Importa il modello List che contiene tutte le query SQL e funzioni
// per interagire con il database (es: findAllByUserId, create, update, remove).
// Questo modello incapsula la logica SQL e la connessione al DB.
const List = require('../models/List');

// Importa le funzioni helper per formattare le risposte JSON.
// successResponse() → risposta per richieste riuscite
// errorResponse()   → risposta per errori
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * Recupera tutte le liste dell'utente attualmente autenticato
 * Questo controller gestisce la richiesta GET /lists
 */
const getUserLists = async (req, res) => {
    // req.user viene aggiunto dal middleware di autenticazione JWT.
    // Contiene i dati dell'utente loggato, inclusi id, email, ecc.
    // Il middleware verifica il token prima che questa funzione venga eseguita.
    const userId = req.user.id;

    try {
        // Recupera tutte le liste dal database filtrate per userId.
        // Questa funzione si trova dentro models/List.js e fa una query SQL
        // tipo: SELECT * FROM lists WHERE user_id = ?
        const lists = await List.findAllByUserId(userId); // Restituisce un array di liste

        // Risposta di successo: restituisce un array di liste al client.
        // Il terzo parametro è un messaggio opzionale per il client.
        successResponse(res, lists, 'Lists fetched successfully');

    } catch (error) {
        // Se la query fallisce (es: errore di connessione al DB),
        // mostriamo l'errore in console per debug.
        console.error('Error fetching lists:', error);

        // Risposta di errore con status 500 (Internal Server Error)
        // e dettagli tecnici dell'errore.
        errorResponse(res, 'Error fetching lists', 500, error);
    }
};

/**
 * Recupera una singola lista tramite l'ID fornito nella rotta.
 * Gestisce richieste tipo GET /lists/5 (dove 5 è l'ID della lista)
 */
const getListById = async (req, res) => {
    // ID dell'utente autenticato (proprietario della lista)
    const userId = req.user.id;
    
    // Estrae l'ID della lista dai parametri della rotta (URL)
    // Se la rotta è GET /lists/5, id sarà uguale a "5"
    const { id } = req.params;

    try {
        // Recupera la lista dal DB, verificando che appartenga all'utente.
        // Questo previene che un utente veda le liste di un altro utente.
        // Query SQL tipo: SELECT * FROM lists WHERE id = ? AND user_id = ?
        const list = await List.getListById(id, userId);

        // Se la query non trova nulla, ritorna un array vuoto.
        // In questo caso, inviamo errore 404 (Not Found).
        if (!list.length) {
            return errorResponse(res, 'List not found', 404);
        }

        // list[0] perché la query restituisce un array con un solo elemento.
        // Prendiamo il primo (e unico) elemento dell'array.
        successResponse(res, list[0], 'List fetched successfully');

    } catch (error) {
        // Logga l'errore in console per debugging
        console.error('Error fetching list:', error);
        
        // Invia risposta di errore 500 al client
        errorResponse(res, 'Error fetching list', 500, error);
    }
};

/**
 * Crea una nuova lista nel database.
 * Gestisce richieste POST /lists con body JSON tipo: { "name": "Shopping" }
 */
const createList = async (req, res) => {
    // Estrae il nome della lista dal corpo della richiesta JSON.
    // Il client deve inviare un oggetto JSON con il campo "name".
    const { name } = req.body;

    // req.user.id → ID dell'utente loggato (aggiunto dal middleware JWT)
    // Questo associa la nuova lista all'utente che la sta creando.
    const userId = req.user.id;

    try {
        // Esegue INSERT nel database, ritorna l'ID della nuova riga creata.
        // Query SQL tipo: INSERT INTO lists (name, user_id) VALUES (?, ?)
        const listId = await List.create(name, userId);

        // Risposta di successo con i dati della nuova lista appena creata.
        // Restituiamo sia l'ID generato dal DB che il nome fornito.
        successResponse(res, { id: listId, name }, 'List created successfully');

    } catch (error) {
        // Se l'INSERT fallisce, logga l'errore
        console.error('Error creating list:', error);
        
        // Invia errore 500 al client
        errorResponse(res, 'Error creating list', 500, error);
    }
};

/**
 * Aggiorna una lista esistente nel database.
 * Gestisce richieste PUT /lists/5 con body JSON tipo: { "name": "New Name" }
 */
const updateList = async (req, res) => {
    // Estrae il nuovo nome dal body della richiesta
    const { name } = req.body;
    
    // Estrae l'ID della lista da aggiornare dai parametri della rotta
    const { id } = req.params;
    
    // ID dell'utente autenticato (per verificare che sia il proprietario)
    const userId = req.user.id;

    try {
        // Esegui UPDATE nel database.
        // Query SQL tipo: UPDATE lists SET name = ? WHERE id = ? AND user_id = ?
        // affectedRows indica il numero di righe modificate:
        // - 1 se l'aggiornamento è riuscito
        // - 0 se la lista non esiste o non appartiene all'utente
        const affectedRows = await List.update({ name, id, userId });

        // Se almeno una riga è stata aggiornata, successo
        if (affectedRows) {
            successResponse(res, { id, name }, 'List updated successfully');
        } else {
            // Se nessuna riga aggiornata: o la lista non esiste,
            // o non appartiene all'utente corrente
            errorResponse(res, 'List not found or update failed', 404);
        }

    } catch (error) {
        // Logga l'errore in console
        console.error('Error updating list:', error);
        
        // Invia errore 500 al client
        errorResponse(res, 'Error updating list', 500, error);
    }
};

/**
 * Elimina una lista dal database.
 * Gestisce richieste DELETE /lists/5 (dove 5 è l'ID della lista)
 */
const deleteList = async (req, res) => {
    // Estrae l'ID della lista da eliminare dai parametri della rotta
    const { id } = req.params;
    
    // ID dell'utente autenticato (per verificare che sia il proprietario)
    const userId = req.user.id;

    try {
        // Rimuovi la lista dal database (operazione DELETE).
        // Query SQL tipo: DELETE FROM lists WHERE id = ? AND user_id = ?
        // affectedRows indica quante righe sono state eliminate:
        // - 1 se la cancellazione è riuscita
        // - 0 se la lista non esiste o non appartiene all'utente
        const affectedRows = await List.remove(id, userId);

        // Se almeno una riga è stata eliminata, successo
        if (affectedRows) {
            // Nessun dato da restituire → null
            // Restituiamo solo un messaggio di conferma
            successResponse(res, null, 'List deleted successfully');
        } else {
            // Se nessuna riga eliminata: lista non trovata o non autorizzato
            errorResponse(res, 'List not found or deletion failed', 404);
        }

    } catch (error) {
        // Logga l'errore in console per debugging
        console.error('Error deleting list:', error);
        
        // Invia errore 500 al client
        errorResponse(res, 'Error deleting list', 500, error);
    }
};

// Esportiamo tutti i controller per usarli nelle rotte (routes/listRoutes.js)
// In questo modo, il file delle rotte può importare queste funzioni e
// associarle agli endpoint HTTP (GET, POST, PUT, DELETE)
module.exports = {
    getUserLists,    // GET /lists
    getListById,     // GET /lists/:id
    createList,      // POST /lists
    updateList,      // PUT /lists/:id
    deleteList,      // DELETE /lists/:id
};
