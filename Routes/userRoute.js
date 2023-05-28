const express = require("express");
const {
  addUser,
  deleteUser,
  updateUser,
  getUser,
  userLogin,
  handleGetAllUser,
  handleAssignToColleague,
  handelGetAlluserSuggestion,
  handelUpdateUserInfo,
} = require("../RouterController/userController");
const { validateAdmin } = require("../middleware/validateadmin");


const usersRoute = express.Router();
require("dotenv").config();
usersRoute.get("/info", handelGetAlluserSuggestion);
usersRoute.patch("/assignto/:id", handleAssignToColleague);
usersRoute.post("/login", userLogin);

usersRoute.get("/getuserdetail", getUser);
usersRoute.patch( "/updateuserinfo",handelUpdateUserInfo);
//below are routes which needs admin verification;
usersRoute.use("/", validateAdmin);
usersRoute.post("/adduser", addUser);

usersRoute.patch("/updateuser/:id", updateUser);
usersRoute.delete("/deleteuser/:id", deleteUser);
usersRoute.get("/alluser", handleGetAllUser);

module.exports = {
  usersRoute,
};
