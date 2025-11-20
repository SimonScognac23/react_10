🇮🇹 VERSIONE ITALIANA
API REST per gestione Todo List con autenticazione JWT

Ho sviluppato un'applicazione backend completa per gestire liste di attività (todo list) con un sistema di autenticazione sicuro. Il progetto è stato realizzato utilizzando Node.js, Express e MySQL.

Cosa fa l'applicazione:
L'applicazione permette agli utenti di registrarsi, fare login e gestire le proprie liste di attività in modo sicuro. Ogni utente può creare, modificare, visualizzare ed eliminare le proprie liste e i relativi task, senza poter accedere ai dati di altri utenti.

Tecnologie utilizzate:

Node.js ed Express: per creare il server web e gestire le richieste HTTP

MySQL: database relazionale per memorizzare utenti, liste e todo in modo strutturato

JWT (JSON Web Token): sistema di autenticazione moderno che genera token sicuri per identificare gli utenti

bcrypt: libreria per criptare le password in modo sicuro, rendendole impossibili da decifrare

CORS: configurazione per permettere l'accesso all'API da applicazioni frontend su domini diversi

Architettura del progetto:
Ho seguito il pattern MVC (Model-View-Controller) per separare la logica in moduli chiari e riutilizzabili:

Models: gestiscono la comunicazione con il database MySQL usando query SQL protette contro SQL injection

Controllers: contengono la logica di business e processano le richieste degli utenti

Routes: definiscono gli endpoint API e collegano le richieste HTTP ai controller appropriati

Middleware: includono autenticazione JWT per proteggere le rotte private

Funzionalità principali:

Autenticazione: registrazione con password hashate e login con generazione di token JWT

Gestione Liste: creazione, modifica, visualizzazione ed eliminazione di liste personali

Gestione Todo: aggiunta, modifica, completamento ed eliminazione di task all'interno delle liste

Sicurezza: ogni operazione verifica che l'utente possa accedere solo ai propri dati

Best practices applicate:

Uso di prepared statements per prevenire SQL injection

Password mai salvate in chiaro, sempre hashate con bcrypt

Token JWT con scadenza configurabile per sessioni sicure

Codice commentato in dettaglio per facilitare manutenzione e collaborazione

Separazione delle responsabilità seguendo principi SOLID

Gestione centralizzata degli errori con risposte HTTP standardizzate

Questo progetto dimostra la mia capacità di sviluppare API REST sicure, scalabili e ben strutturate, seguendo le best practices del settore.

🇬🇧 ENGLISH VERSION
REST API for Todo List Management with JWT Authentication

I developed a complete backend application to manage todo lists with a secure authentication system. The project was built using Node.js, Express, and MySQL.

What the application does:
The application allows users to register, log in, and manage their activity lists securely. Each user can create, edit, view, and delete their own lists and tasks, without being able to access other users' data.

Technologies used:

Node.js and Express: to create the web server and handle HTTP requests

MySQL: relational database to store users, lists, and todos in a structured way

JWT (JSON Web Token): modern authentication system that generates secure tokens to identify users

bcrypt: library to encrypt passwords securely, making them impossible to decrypt

CORS: configuration to allow API access from frontend applications on different domains

Project architecture:
I followed the MVC (Model-View-Controller) pattern to separate logic into clear and reusable modules:

Models: manage communication with the MySQL database using SQL queries protected against SQL injection

Controllers: contain business logic and process user requests

Routes: define API endpoints and connect HTTP requests to appropriate controllers

Middleware: include JWT authentication to protect private routes

Main features:

Authentication: registration with hashed passwords and login with JWT token generation

List Management: creation, editing, viewing, and deletion of personal lists

Todo Management: adding, editing, completing, and deleting tasks within lists

Security: every operation verifies that users can only access their own data

Best practices applied:

Use of prepared statements to prevent SQL injection

Passwords never saved in plain text, always hashed with bcrypt

JWT tokens with configurable expiration for secure sessions

Detailed code comments to facilitate maintenance and collaboration

Separation of concerns following SOLID principles

Centralized error handling with standardized HTTP responses

This project demonstrates my ability to develop secure, scalable, and well-structured REST APIs, following industry best practices.
