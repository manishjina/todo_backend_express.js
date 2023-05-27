
const { dbConfig, connection, pool } = require("../db/db");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const mysql = require("mysql");
const { generateToken } = require("../middleware/generateToken");
const { decryptPassword } = require("../middleware/password.decrypt");
const { setAccessTokenCookie } = require("../middleware/setAccesTokenCoockie");



const loginUser = async (req, res) => {
  console.log("login");
    try {
      const { email, password } = req.body;
  
      // Validate email and password
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const queryDatabase = (pool, query, params) => {
        return new Promise((resolve, reject) => {
          pool.query(query, params, (error, results) => {
            if (error) {
              reject(error);
            } else {
              resolve(results);
            }
          });
        });
      };
      // Create a MySQL connection pool
      const pool = mysql.createPool(dbConfig);
  
      // Check user_incomming table
      const userQuery = "SELECT * FROM user_incomming WHERE email = ?";
      const userResults = await queryDatabase(pool, userQuery, [email]);
  
      if (userResults.length > 0) {
        const user = userResults[0];
        const passwordMatch = await decryptPassword(password, user.password);
        if (passwordMatch) {
          const token = generateToken({ org_id: user.org_id });
          setAccessTokenCookie(res, token);
          return res.status(200).json({
            message: "Login successful",
            token,
            email: email,
            role: "user",
          });
        } else {
          return res.status(401).json({ wrong: "Invalid password" });
        }
      }
  
      // Check registration table
      const clientQuery = "SELECT * FROM registration WHERE email = ?";
      const clientResults = await queryDatabase(pool, clientQuery, [email]);
  
      if (clientResults.length > 0) {
        const client = clientResults[0];
        const passwordMatch = await decryptPassword(password, client.password);
        if (passwordMatch) {
          const token = generateToken({ uuid: client.tenant_uuid });
          setAccessTokenCookie(res, token);
          return res.status(200).json({
            message: "Login successful",
            token,
            email: email,
            role: "client",
          });
        } else {
          return res.status(401).json({ wrong: "Invalid password" });
        }
      }
  
      // User not found in either table
      return res.status(401).json({ error: "User not found" });
    } catch (error) {
      console.error("Error in user login:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  




  module.exports={loginUser}