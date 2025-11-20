const express = require('express');
const router = express.Router();
const { deleteTodo, updateTodo, createTodo, getTodoById, getTodos } = require ('../controllers/todoController');

router.get('/', getTodos);
router.get('/:id', getTodoById);
router.post('/', createTodo);
router.patch('/:id', updateTodo);
router.put('/:id', updateTodo);
router.delete('/:id', deleteTodo);

module.exports = router;