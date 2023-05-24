const express = require("express");
const {
  addUser,
  deleteUser,
  updateUser,
  getUser,
  userLogin,
  handleGetAllUser,
 
  handleAssignToColleague,
 
  handelgetAllUserToUSer,
} = require("../RouterController/userController");
const { validateAdmin } = require("../middleware/validateadmin");

const usersRoute = express.Router();
require("dotenv").config();
usersRoute.patch("/assignto/:id", handleAssignToColleague);
usersRoute.post("/login", userLogin);

usersRoute.get('/usertouser', handelgetAllUserToUSer)
//below are routes which needs admin verification;
usersRoute.use("/", validateAdmin);
usersRoute.post("/adduser", addUser);
usersRoute.get("/getuser/:id", getUser);
usersRoute.patch("/updateuser/:id", updateUser);
usersRoute.delete("/deleteuser/:id", deleteUser);
usersRoute.get("/alluser", handleGetAllUser);

module.exports = {
  usersRoute,
};
