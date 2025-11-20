const express = require('express');
const List = require('../models/List');
const router = express.Router();


// Importa le funzioni del controller delle liste
// Queste funzioni gestiscono la logica per CRUD: create, read, update, delete
const { deleteList, updateList, createList, getListById, getUserLists } = require('../controllers/listController');

// Rotta GET per ottenere tutte le liste dell'utente
router.get('/', getUserLists);

// Rotta GET per ottenere una lista specifica tramite il suo ID
router.get('/:id', getListById);

// Rotta POST per creare una nuova lista
router.post('/', createList);

// Rotta PATCH per aggiornare parzialmente una lista esistente
router.patch('/:id', updateList);

// Rotta PUT per aggiornare completamente una lista esistente
router.put('/:id', updateList);

// Rotta DELETE per eliminare una lista specifica tramite il suo ID
router.delete('/:id', deleteList);

// Esporta il router così da poterlo utilizzare in app.js
module.exports = router;
