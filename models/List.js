// Importa la configurazione del database dal file config/db.js
// 'db' contiene la connessione al database MySQL (connection pool) e i metodi per eseguire query.
// Il pool di connessioni migliora le prestazioni riutilizzando connessioni esistenti
// invece di crearne di nuove per ogni richiesta.
const db = require('../config/db');

// Definisce l'oggetto List come un modello (pattern Model in MVC)
// Questo oggetto contiene tutti i metodi per interagire con la tabella 'lists' nel database.
// Separare le query SQL in un modello migliora la manutenibilità e la riusabilità del codice.
const List = {

    /**
     * Metodo 'create'
     * 
     * Scopo: Creare una nuova lista associata a un utente specifico
     * 
     * Parametri:
     * - name (string): nome della lista da creare (es: "Shopping", "Work Tasks")
     * - userId (number): id dell'utente proprietario della lista
     * 
     * Ritorna: l'ID della lista appena creata (auto-incrementato dal database)
     */
    async create(name, userId){
        // Query SQL per inserire una nuova lista nella tabella 'lists'.
        // I punti interrogativi (?) sono PLACEHOLDER per prevenire SQL injection.
        // NOW() è una funzione MySQL che inserisce automaticamente il timestamp corrente.
        const sql = 'INSERT INTO lists (name, user_id, created_at) VALUES (?, ?, NOW())';
        
        // db.execute() esegue la query usando prepared statements.
        // Questo metodo:
        // 1. Sostituisce i placeholder (?) con i valori nell'array [name, userId]
        // 2. Escapa automaticamente i valori per prevenire SQL injection
        // 3. Restituisce un array: [result, fields] dove result contiene info sull'operazione
        // 
        // Usiamo array destructuring [result] per prendere solo il primo elemento.
        const [result] = await db.execute(sql, [name, userId]);

        // result.insertId contiene l'ID auto-generato dal database per la riga appena inserita.
        // MySQL assegna automaticamente questo valore se la colonna 'id' è AUTO_INCREMENT.
        return result.insertId;
    },

    /**
     * Metodo 'remove'
     * 
     * Scopo: Eliminare una lista specifica appartenente a un utente
     * 
     * Parametri:
     * - id (number): id della lista da eliminare
     * - userId (number): id dell'utente proprietario (per sicurezza)
     * 
     * Ritorna: numero di righe eliminate (1 se successo, 0 se non trovata)
     * 
     * Nota di sicurezza: la condizione AND user_id=? garantisce che un utente
     * possa eliminare SOLO le proprie liste, non quelle di altri utenti.
     */
    async remove(id, userId) {
        // Query SQL per cancellare la lista solo se appartiene all'utente specificato.
        // La clausola WHERE con due condizioni (id=? AND user_id=?) previene che
        // un utente possa eliminare liste di altri utenti anche conoscendone l'ID.
        const sql = 'DELETE FROM lists WHERE id=? AND user_id=?';
        
        // Esegue la query con i parametri id e userId
        const [result] = await db.execute(sql, [id, userId]);

        // result.affectedRows indica quante righe sono state effettivamente eliminate:
        // - 1 se la lista è stata trovata ed eliminata con successo
        // - 0 se nessuna lista corrisponde ai criteri (ID non esiste o non appartiene all'utente)
        return result.affectedRows;
    },

    /**
     * Metodo 'update'
     * 
     * Scopo: Aggiornare il nome di una lista esistente
     * 
     * Parametri: oggetto destrutturato contenente:
     * - name (string): nuovo nome da assegnare alla lista
     * - id (number): id della lista da aggiornare
     * - userId (number): id dell'utente proprietario (verifica autorizzazione)
     * 
     * Ritorna: numero di righe modificate (1 se successo, 0 se non trovata/non autorizzato)
     */
    async update({name, id, userId}) {
        // Query SQL per aggiornare il nome della lista.
        // Aggiorna anche il campo updated_at con il timestamp corrente usando NOW().
        // La clausola WHERE garantisce che solo il proprietario possa modificare la lista.
        const sql = 'UPDATE lists SET name=?, updated_at=NOW() WHERE id=? AND user_id=?';
        
        // Esegue la query sostituendo i placeholder nell'ordine: name, id, userId
        // L'ordine dei valori nell'array DEVE corrispondere all'ordine dei ? nella query.
        const [result] = await db.execute(sql, [name, id, userId]);

        // result.affectedRows indica quante righe sono state modificate:
        // - 1 se l'update è riuscito (lista trovata e modificata)
        // - 0 se nessuna lista corrisponde (ID non esiste, non appartiene all'utente,
        //   oppure il nuovo nome è identico a quello esistente)
        return result.affectedRows;
    },

    /**
     * Metodo 'findAllByUserId'
     * 
     * Scopo: Recuperare tutte le liste appartenenti a un utente specifico
     * 
     * Parametri:
     * - userId (number): id dell'utente di cui vogliamo le liste
     * 
     * Ritorna: array di oggetti, dove ogni oggetto rappresenta una lista
     * (es: [{id: 1, name: "Shopping", user_id: 5, ...}, {...}])
     */
    async findAllByUserId(userId){
        // Query SQL per selezionare tutte le liste dell'utente.
        // SELECT * recupera tutte le colonne della tabella 'lists'.
        // WHERE user_id = ? filtra solo le righe appartenenti all'utente specificato.
        const sql = 'SELECT * FROM lists WHERE user_id = ?';
        
        // db.query() esegue query di tipo SELECT e restituisce [rows, fields].
        // - rows: array contenente tutte le righe trovate
        // - fields: metadati sulle colonne (non usati qui, per questo li scartiamo)
        // 
        // Nota: db.query() è più efficiente di db.execute() per SELECT semplici,
        // ma entrambi prevengono SQL injection quando si usano placeholder.
        const [rows] = await db.query(sql, [userId]);

        // Restituisce l'array di liste. Può essere:
        // - Un array vuoto [] se l'utente non ha liste
        // - Un array con uno o più oggetti lista
        return rows;
    },

    /**
     * Metodo 'getListById'
     * 
     * Scopo: Recuperare una singola lista specifica di un utente
     * 
     * Parametri:
     * - id (number): id della lista da recuperare
     * - userId (number): id dell'utente proprietario (per autorizzazione)
     * 
     * Ritorna: array contenente un oggetto lista (se trovata) oppure array vuoto (se non trovata)
     * 
     * Nota: restituisce un array per coerenza con altre query, anche se il risultato
     * contiene al massimo un elemento (l'ID è univoco).
     */
    async getListById(id, userId){
        // Query SQL per selezionare UNA lista specifica.
        // La doppia condizione WHERE (id=? AND user_id=?) garantisce che:
        // 1. Viene recuperata la lista con l'ID richiesto
        // 2. La lista appartiene effettivamente all'utente che la richiede
        // 
        // Questo previene che un utente possa vedere le liste di altri utenti
        // anche se conosce (o indovina) i loro ID.
        const sql = 'SELECT * FROM lists WHERE id=? AND user_id = ?';
        
        // Esegue la query con i parametri id e userId
        const [rows] = await db.query(sql, [id, userId]);

        // Restituisce un array che può essere:
        // - Un array con un elemento [{ id: 5, name: "Shopping", ... }] se trovato
        // - Un array vuoto [] se la lista non esiste o non appartiene all'utente
        // 
        // Il controller dovrà controllare rows.length per verificare se la lista esiste.
        return rows;
    }

};

// Esporta l'oggetto List per renderlo disponibile ad altri file (es: controllers).
// 
// Esempio di utilizzo nei controller:
// const List = require('../models/List');
// const lists = await List.findAllByUserId(userId);
// 
// Questo pattern separa la logica del database (model) dalla logica di business (controller),
// seguendo il principio MVC (Model-View-Controller) per un codice più pulito e manutenibile.
module.exports = List;
