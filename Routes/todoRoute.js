const express = require('express');
const { handelAddTodo, handleDeleteTodo, handleUpdateTodo, handleGetAllTodo, handleGetTodo, handelAddUserTodo, handleDeleteUserTodo, handleUpdateUserTodo, handelAddSubTask } = require('../RouterController/todoController');
const { validateAdmin } = require('../middleware/validateadmin');


const userTodoRoute = express.Router();

require('dotenv').config();

// Route for adding a todo
userTodoRoute.post('/addtodo', validateAdmin,handelAddTodo);
// Route for get todos
//userTodoRoute.post('/alltodo', handelAddTodo);
// Route for delete a todo
userTodoRoute.delete('/delete/:id',validateAdmin, handleDeleteTodo);
// Route for update a todo
userTodoRoute.patch('/update/:id',validateAdmin, handleUpdateTodo);
// Route to get all todo
userTodoRoute.get('/alltodo',validateAdmin,handleGetAllTodo);
//get perticular user todos
userTodoRoute.get('/useralltodo',handleGetTodo)

userTodoRoute.post('/useraddtodo',handelAddUserTodo)

userTodoRoute.patch('/userupdatetodo/:id',handleUpdateUserTodo)

userTodoRoute.delete('/userdeletetodo/:id',handleDeleteUserTodo)






module.exports={userTodoRoute}