// Importa la connessione al database MySQL dalla cartella config.
// 'db' è un pool di connessioni che gestisce le query al database.
const db = require('../config/db');

// Importa bcryptjs, una libreria per l'hashing sicuro delle password.
// bcrypt usa un algoritmo di hashing unidirezionale (irreversibile) basato su Blowfish
// che rende praticamente impossibile recuperare la password originale dall'hash.
const bcrypt = require('bcryptjs');

// Definisce l'oggetto User come modello per gestire gli utenti.
// Contiene metodi per creare utenti e trovarli tramite email.
const User = {
    /**
     * Metodo per creare un nuovo utente
     * 
     * Scopo: Registrare un nuovo utente nel database con password hashata
     * 
     * Parametri:
     * - name (string): nome completo dell'utente (es: "Mario Rossi")
     * - email (string): indirizzo email univoco (usato come username)
     * - password (string): password in chiaro fornita dall'utente
     * 
     * Ritorna: l'ID auto-generato del nuovo utente creato
     * 
     * Processo di sicurezza:
     * 1. La password viene hashata con bcrypt (NON salvata in chiaro)
     * 2. L'hash include automaticamente un salt unico per ogni utente
     * 3. Solo l'hash viene salvato nel database, mai la password originale
     */
    async create(name, email, password){
        // Query SQL per inserire un nuovo utente.
        // NOTA: usa $sql invece di sql (probabilmente un typo, dovrebbe essere 'sql').
        // I placeholder (?) prevengono SQL injection.
        // NOW() inserisce automaticamente il timestamp corrente.
        $sql = 'INSERT INTO users(name, email, password, created_at) VALUES(?, ?, ?, NOW())';
        
        // bcrypt.hash() crea un hash sicuro della password.
        // 
        // Parametri:
        // - password: la password in chiaro da hashare
        // - 10: numero di "salt rounds" (costo computazionale)
        // 
        // Cosa sono i salt rounds?
        // - Determinano quante volte l'algoritmo di hashing viene eseguito
        // - Più rounds = più sicuro, ma più lento
        // - 10 è il valore standard consigliato (circa 0.09 secondi per hash)
        // - Ogni incremento di 1 raddoppia il tempo di calcolo
        // - Range consigliato: 10-12 per applicazioni normali, 14+ per sistemi critici
        // 
        // Cosa fa bcrypt.hash():
        // 1. Genera un salt casuale univoco per questo utente
        // 2. Combina password + salt
        // 3. Applica l'algoritmo di hashing Blowfish 2^10 (1024) volte
        // 4. Restituisce un hash che include automaticamente il salt
        //    (formato: $2b$10$salthashvalue, dove $2b = versione bcrypt, $10 = rounds)
        // 
        // Risultato: una stringa di 60 caratteri tipo:
        // "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Esegue l'INSERT nel database.
        // IMPORTANTE: salva hashedPassword (l'hash), NON la password originale.
        // Questo significa che:
        // - Nemmeno gli amministratori del database possono vedere le password
        // - Se il database viene compromesso, le password sono protette
        // - L'unico modo per validare una password è ri-hasharla e confrontare
        const [result] = await db.execute($sql, [name, email, hashedPassword]);
        
        // Restituisce l'ID del nuovo utente appena creato.
        // Questo ID sarà usato per associare liste e todos all'utente.
        return result.insertId;
    },
    
    /**
     * Metodo per trovare un utente tramite email
     * 
     * Scopo: Recuperare i dati di un utente durante il login o per verificare
     *        se un'email è già registrata
     * 
     * Parametri:
     * - email (string): indirizzo email da cercare
     * 
     * Ritorna: oggetto utente completo (incluso password hash) oppure undefined
     * 
     * Uso tipico:
     * - Durante il login: recupera l'utente e confronta la password
     * - Durante la registrazione: verifica se l'email è già usata
     */
    findByEmail: async (email) => {
        // Query SQL per cercare un utente tramite email.
        // SELECT * recupera tutte le colonne (id, name, email, password hash, created_at).
        // 
        // NOTA DI SICUREZZA: questa query restituisce anche la colonna 'password'
        // che contiene l'hash. Questo è necessario per il login (per confrontare
        // le password), ma assicurati di NON inviare mai questo campo al client.
        // Nel controller, prima di inviare la risposta, rimuovi il campo password.
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        // Restituisce il primo (e unico) utente trovato, oppure undefined.
        // 
        // rows[0] può essere:
        // - Un oggetto utente: { id: 5, name: "Mario", email: "mario@test.it", 
        //                        password: "$2b$10$...", created_at: "2025-11-20..." }
        //   se l'email esiste nel database
        // - undefined se nessun utente ha quell'email
        // 
        // Nel controller di login, userai:
        // const user = await User.findByEmail(email);
        // if (!user) { return errorResponse(res, 'Invalid email or password', 401); }
        // const isPasswordValid = await bcrypt.compare(password, user.password);
        return rows[0];
    }
}

// Esporta l'oggetto User per usarlo nei controller di autenticazione.
// 
// Esempio di utilizzo:
// 
// REGISTRAZIONE:
// const userId = await User.create(name, email, password);
// 
// LOGIN:
// const user = await User.findByEmail(email);
// if (user && await bcrypt.compare(password, user.password)) {
//   // Login riuscito, genera JWT token
// }
// 
// VERIFICA EMAIL ESISTENTE:
// const existingUser = await User.findByEmail(email);
// if (existingUser) {
//   return errorResponse(res, 'Email already registered', 409);
// }
module.exports = User;
