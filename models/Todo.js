// Importa la connessione al database MySQL dalla cartella config.
// 'db' è un pool di connessioni che gestisce automaticamente le connessioni al database,
// migliorando le prestazioni e la scalabilità dell'applicazione.
const db = require('../config/db'); 

// Definisce l'oggetto Todo come modello (pattern Model in MVC).
// Questo oggetto contiene tutti i metodi per interagire con la tabella 'todos' nel database.
// Ogni metodo corrisponde a un'operazione CRUD (Create, Read, Update, Delete).
const Todo = {
   /**
    * Metodo per creare un nuovo TODO
    * 
    * Scopo: Inserire un nuovo task nella tabella 'todos'
    * 
    * Parametri (oggetto destrutturato):
    * - name (string): nome/descrizione del task (es: "Comprare il latte")
    * - listId (number): ID della lista a cui appartiene questo todo
    * - completed (boolean): stato di completamento, default false se non fornito
    * 
    * Ritorna: l'ID auto-generato del nuovo todo creato
    */
   async create({name, listId, completed = false}) {

        // Query SQL per inserire un nuovo todo.
        // NOW() è una funzione MySQL che inserisce automaticamente il timestamp corrente
        // nella colonna created_at, registrando quando il todo è stato creato.
        // I placeholder (?) prevengono SQL injection escapando automaticamente i valori.
        const sql = 'INSERT INTO todos (name, list_id, completed, created_at) VALUES (?, ?, ?, NOW())';

        // db.execute() esegue la query usando prepared statements per sicurezza.
        // I valori nell'array [name, listId, completed] sostituiscono i placeholder (?)
        // nell'ordine in cui appaiono nella query SQL.
        // 
        // Array destructuring [result]: prende solo il primo elemento del risultato,
        // che contiene informazioni sull'operazione eseguita (insertId, affectedRows, ecc.)
        const [result] = await db.execute(sql, [
            name,      // Primo ? nella query
            listId,    // Secondo ? nella query
            completed  // Terzo ? nella query
        ]);

        // result.insertId contiene l'ID auto-incrementato assegnato dal database
        // al record appena inserito. Questo valore è generato automaticamente
        // dalla colonna 'id' con AUTO_INCREMENT in MySQL.
        return result.insertId;
    },

    /**
     * Metodo per eliminare un TODO tramite ID
     * 
     * Scopo: Rimuovere definitivamente un task dal database
     * 
     * Parametri:
     * - id (number): ID univoco del todo da eliminare
     * 
     * Ritorna: numero di righe eliminate (1 se trovato ed eliminato, 0 se non trovato)
     * 
     * Nota: questo metodo NON verifica user_id, quindi permette di eliminare
     * qualsiasi todo conoscendone l'ID. Per maggiore sicurezza, considera
     * di aggiungere una verifica dell'utente proprietario.
     */
    async remove(id) {
        // Query SQL per eliminare il todo con l'ID specificato.
        // WHERE id = ? limita la cancellazione a un solo record specifico.
        const sql = 'DELETE FROM todos WHERE id = ?';

        // Esegue l'eliminazione passando l'ID come parametro sicuro.
        const [result] = await db.execute(sql, [id]);

        // result.affectedRows indica quante righe sono state eliminate:
        // - 1 se il todo esisteva ed è stato eliminato con successo
        // - 0 se nessun todo aveva quell'ID (nessuna eliminazione effettuata)
        return result.affectedRows;
    },

    /**
     * Metodo per aggiornare un TODO esistente
     * 
     * Scopo: Modificare i dati di un task esistente (nome, stato, lista)
     * 
     * Parametri (oggetto destrutturato):
     * - name (string): nuovo nome/descrizione del task
     * - completed (boolean): nuovo stato di completamento (true/false)
     * - id (number): ID del todo da aggiornare
     * - listId (number): ID della lista di destinazione (permette di spostare il todo)
     * 
     * Ritorna: numero di righe modificate (1 se successo, 0 se non trovato)
     */
    async update({name, completed, id, listId}) {
        // Query SQL per aggiornare il todo.
        // Template literal (backticks) permette di scrivere la query su più righe
        // per migliorare la leggibilità del codice.
        // 
        // SET aggiorna 4 campi:
        // - name: nuovo testo del task
        // - completed: nuovo stato (0 o 1, false o true)
        // - list_id: permette di spostare il todo in un'altra lista
        // - updated_at: timestamp automatico con NOW() per tracciare le modifiche
        // 
        // WHERE id = ? identifica quale todo modificare
        const sql = `
            UPDATE todos 
            SET name = ?, completed = ?, list_id = ?, updated_at = NOW() 
            WHERE id = ?
        `;

        // Esegue l'aggiornamento con i parametri nell'ordine corretto.
        // ATTENZIONE: l'ordine dei valori nell'array DEVE corrispondere
        // all'ordine dei placeholder (?) nella query SQL.
        const [result] = await db.execute(sql, [
            name,      // Primo ? (SET name = ?)
            completed, // Secondo ? (SET completed = ?)
            listId,    // Terzo ? (SET list_id = ?)
            id         // Quarto ? (WHERE id = ?)
        ]);

        // Log di debug: mostra il risultato dell'operazione nella console.
        // Utile durante lo sviluppo per verificare che l'update funzioni correttamente.
        // In produzione, potresti rimuovere o sostituire con un logger professionale.
        console.log(result);

        // result.affectedRows indica quante righe sono state modificate:
        // - 1 se il todo è stato trovato e aggiornato
        // - 0 se l'ID non esiste o i nuovi valori sono identici a quelli esistenti
        return result.affectedRows;
    },

    /**
     * Metodo per ottenere tutti i TODO appartenenti a una lista
     * 
     * Scopo: Recuperare tutti i task di una specifica lista
     * 
     * Parametri:
     * - listId (number): ID della lista di cui vogliamo recuperare i todos
     * 
     * Ritorna: array di oggetti todo, ogni oggetto rappresenta un task
     * (es: [{id: 1, name: "Task 1", completed: 0, list_id: 5}, {...}])
     */
    async findAllByListId(listId) {
        // Query SQL per selezionare tutti i todos di una lista specifica.
        // SELECT * recupera tutte le colonne della tabella 'todos'.
        // WHERE list_id = ? filtra solo i todos appartenenti alla lista richiesta.
        const sql = 'SELECT * FROM todos WHERE list_id = ?';

        // db.query() è ottimizzato per query di tipo SELECT.
        // Restituisce [rows, fields] dove:
        // - rows: array contenente tutti i record trovati
        // - fields: metadati sulle colonne (non usati qui, quindi scartati)
        // 
        // Usiamo array destructuring [rows] per prendere solo il primo elemento.
        const [rows] = await db.query(sql, [listId]);

        // Restituisce l'array di todos. Può essere:
        // - Un array vuoto [] se la lista non ha todos
        // - Un array con uno o più oggetti todo
        return rows;
    },

    /**
     * Metodo per ottenere un TODO tramite ID specifico
     * 
     * Scopo: Recuperare un singolo task conoscendone l'ID
     * 
     * Parametri:
     * - id (number): ID univoco del todo da recuperare
     * 
     * Ritorna: array contenente l'oggetto todo (se trovato) oppure array vuoto
     * 
     * Nota: restituisce un array per coerenza con gli altri metodi di ricerca,
     * anche se il risultato contiene al massimo un elemento (l'ID è univoco).
     * Il controller dovrà verificare rows.length per sapere se il todo esiste.
     */
    async getTodoById(id) {
        // Query SQL per selezionare UN singolo todo tramite il suo ID univoco.
        // WHERE id = ? limita il risultato a un solo record.
        const sql = 'SELECT * FROM todos WHERE id = ?';

        // Esegue la query passando l'ID come parametro sicuro.
        // db.query() previene SQL injection automaticamente.
        const [rows] = await db.query(sql, [id]);

        // Restituisce un array che può contenere:
        // - Un elemento [{ id: 5, name: "Task", completed: 0, ... }] se trovato
        // - Zero elementi [] se nessun todo ha quell'ID
        // 
        // Nel controller, userai:
        // if (!rows.length) { return errorResponse(..., 404); }
        // successResponse(res, rows[0]);
        return rows;
    }
};

// Esporta l'oggetto Todo per renderlo disponibile nei controller.
// 
// Esempio di utilizzo nei controller:
// const Todo = require('../models/Todo');
// const todos = await Todo.findAllByListId(listId);
// const todoId = await Todo.create({ name: "New Task", listId: 5, completed: false });
// 
// Questo pattern MVC separa la logica del database (model) dalla logica di business (controller),
// rendendo il codice più pulito, testabile e manutenibile.
module.exports = Todo;
