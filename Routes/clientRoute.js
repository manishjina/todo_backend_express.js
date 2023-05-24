const nodemailer = require("nodemailer");
const express=require('express')
const {  handelClientLogin, handelClientRegister, handelClientAssignTodo } = require('../RouterController/clientController')
const { validate } = require('../middleware/validate');
const { validateisAdmin } = require("../middleware/validataisAdmin");
const clientRoute=express.Router()

clientRoute.post("/register" ,validate ,handelClientRegister)
clientRoute.post("/login", handelClientLogin)


clientRoute.post('/assigntodo',validateisAdmin ,handelClientAssignTodo)




module.exports={clientRoute}

