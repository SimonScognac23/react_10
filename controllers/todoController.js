// Importa il model Todo che contiene tutte le query SQL verso il database.
// Questo modulo gestisce la comunicazione con la tabella "todos" nel DB,
// includendo operazioni come create, read, update, delete (CRUD).
const Todo = require('../models/Todo');

// Importa funzioni helper per risposte HTTP standardizzate.
// successResponse() → formatta risposte di successo con status 200
// errorResponse()   → formatta risposte di errore con status personalizzato
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * Get all todos for a specific list.
 * Recupera tutti i TODO appartenenti a una determinata lista.
 * 
 * Questa funzione gestisce richieste tipo POST /todos/list
 * con body JSON: { "listId": 5 }
 */
const getTodos = async (req, res) => {
    // Estrae l'ID della lista dal body della richiesta.
    // Il client deve inviare un oggetto JSON con il campo "listId".
    const { listId } = req.body; 

    try {
        // Esegue query SQL tipo: SELECT * FROM todos WHERE list_id = ?
        // Ottiene tutti i todo collegati a quella specifica lista.
        const todos = await Todo.findAllByListId(listId);

        // Invia risposta di successo con l'array di todos recuperati.
        // Status code di default è 200 (OK).
        successResponse(res, todos, 'Todos fetched successfully');
        
    } catch (error) {
        // Se la query fallisce (es: errore di connessione al database),
        // logga l'errore completo nella console per debugging.
        console.error('Error fetching todos:', error);

        // Invia risposta di errore con status code 500 (Internal Server Error).
        // Include dettagli dell'errore per facilitare il debugging.
        errorResponse(res, 'Error fetching todos', 500, error);
    }
};

/**
 * Get a todo by ID.
 * Recupera un singolo TODO tramite il suo ID univoco.
 * 
 * Gestisce richieste tipo GET /todos/5 (dove 5 è l'ID del todo)
 */
const getTodoById = async (req, res) => {
    // Estrae l'ID del todo dai parametri dell'URL.
    // Se la rotta è GET /todos/5, id sarà uguale a "5".
    const { id } = req.params;  

    try {
        // Esegue query SQL tipo: SELECT * FROM todos WHERE id = ?
        // Restituisce un array (anche se contiene un solo elemento o nessuno).
        const todo = await Todo.getTodoById(id);

        // Controlla se il todo esiste verificando la lunghezza dell'array.
        // Se l'array è vuoto (!todo.length === true), il todo non esiste.
        if (!todo.length) {
            // Restituisce errore 404 (Not Found) se il todo non esiste.
            return errorResponse(res, 'Todo not found', 404);
        }

        // Restituisce il primo (e unico) elemento dell'array.
        // todo[0] contiene l'oggetto con i dati del todo richiesto.
        successResponse(res, todo[0], 'Todo fetched successfully');
        
    } catch (error) {
        // Logga l'errore in console per debugging.
        console.error('Error fetching todo:', error);

        // Invia errore 500 al client.
        errorResponse(res, 'Error fetching todo', 500, error);
    }
};

/**
 * Create a new todo.
 * Crea un nuovo TODO nel database.
 * 
 * Gestisce richieste POST /todos con body JSON tipo:
 * { "name": "Buy milk", "listId": 3, "completed": false }
 */
const createTodo = async (req, res) => {
    // Estrae i dati del nuovo todo dal body della richiesta.
    // Se "completed" non viene fornito, usa false come valore di default.
    // Questo evita errori se il client non invia il campo "completed".
    const { name, listId, completed = false } = req.body;

    try {
        // Esegue INSERT nel database.
        // Query SQL tipo: INSERT INTO todos (name, list_id, completed) VALUES (?, ?, ?)
        // Restituisce l'ID del record appena creato (generato automaticamente dal DB).
        const todoId = await Todo.create({ name, listId, completed });

        // Invia risposta di successo con tutti i dati del nuovo todo,
        // includendo l'ID appena generato dal database.
        successResponse(res, { id: todoId, name, listId, completed }, 'Todo created successfully');
        
    } catch (error) {
        // Logga l'errore se la creazione fallisce.
        console.error('Error creating todo:', error);

        // Invia errore 500 al client.
        errorResponse(res, 'Error creating todo', 500, error);
    }
};

/**
 * Update a todo by ID.
 * Aggiorna un TODO esistente tramite il suo ID.
 * 
 * Gestisce richieste PUT /todos/5 con body JSON tipo:
 * { "name": "Buy bread", "completed": true, "listId": 3 }
 */
const updateTodo = async (req, res) => {
    // Estrae i nuovi dati dal body della richiesta.
    // Questi sono i valori che sostituiranno quelli attuali nel DB.
    const { name, completed, listId } = req.body;
    
    // Estrae l'ID del todo da aggiornare dai parametri dell'URL.
    // Esempio: PUT /todos/5 → id = "5"
    const { id } = req.params;  

    try {
        // Esegue UPDATE nel database.
        // Query SQL tipo: UPDATE todos SET name = ?, completed = ?, list_id = ? WHERE id = ?
        // Restituisce affectedRows: numero di righe modificate
        // - 1 se l'update è riuscito
        // - 0 se l'ID non esiste o i dati sono già identici
        const affectedRows = await Todo.update({ name, completed, id, listId });

        // Verifica se almeno una riga è stata modificata.
        if (affectedRows) {
            // Se affectedRows > 0, l'update è riuscito.
            // Restituisce i dati aggiornati al client per conferma.
            successResponse(res, { id, name, completed, listId }, 'Todo updated successfully');
        } else {
            // Se affectedRows === 0, significa che:
            // 1. L'ID non esiste nel database, oppure
            // 2. I nuovi dati sono identici a quelli esistenti (nessuna modifica necessaria)
            errorResponse(res, 'Todo not found or update failed', 404);
        }
        
    } catch (error) {
        // Logga l'errore in console.
        console.error('Error updating todo:', error);

        // Invia errore 500 al client.
        errorResponse(res, 'Error updating todo', 500, error);
    }
};

/**
 * Delete a todo by ID.
 * Elimina un TODO dal database tramite il suo ID.
 * 
 * Gestisce richieste DELETE /todos/5 (dove 5 è l'ID del todo da eliminare)
 */
const deleteTodo = async (req, res) => {
    // Estrae l'ID del todo da eliminare dai parametri dell'URL.
    const { id } = req.params;

    try {
        // Esegue DELETE nel database.
        // Query SQL tipo: DELETE FROM todos WHERE id = ?
        // Restituisce affectedRows: numero di righe eliminate
        // - 1 se la cancellazione è riuscita
        // - 0 se l'ID non esiste
        const affectedRows = await Todo.remove(id);

        // Verifica se almeno una riga è stata eliminata.
        if (affectedRows) {
            // Se affectedRows > 0, la cancellazione è riuscita.
            // Restituiamo null come dato perché non c'è più nulla da mostrare.
            successResponse(res, null, 'Todo deleted successfully');
        } else {
            // Se affectedRows === 0, l'ID non esiste nel database.
            errorResponse(res, 'Todo not found or deletion failed', 404);
        }
        
    } catch (error) {
        // Logga l'errore in console per debugging.
        console.error('Error deleting todo:', error);

        // Invia errore 500 al client.
        errorResponse(res, 'Error deleting todo', 500, error);
    }
};

// Esporta tutti i controller per usarli nel file delle rotte (routes/todoRoutes.js).
// Ogni funzione qui esportata sarà associata a un endpoint HTTP specifico:
// - getTodos      → POST /todos/list (o simile)
// - getTodoById   → GET /todos/:id
// - createTodo    → POST /todos
// - updateTodo    → PUT /todos/:id
// - deleteTodo    → DELETE /todos/:id
module.exports = {
    getTodos,
    getTodoById,
    createTodo,
    updateTodo,
    deleteTodo,
};
