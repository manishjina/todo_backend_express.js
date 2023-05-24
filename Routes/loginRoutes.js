const express = require('express');
const { loginUser } = require('../RouterController/loginController');


const loginRouter=express.Router()

loginRouter.post("/login",loginUser)


module.exports={loginRouter}