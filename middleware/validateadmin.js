const mysql = require("mysql");
const { pool } = require("../db/db");


// Assuming you have a connection pool defined as 'pool'
const validateAdmin = (req, res, next) => {
 // Assuming the email is sent in the 'email' header
  const userEmail=req.headers.email
  // Query to retrieve the user's role from the database based on the email
  const query = "SELECT * FROM registration WHERE email = ?";
  pool.query(query, [userEmail], (error, results) => {
    if (error) {
      return res.status(500).send({ error: "Internal Server Error",error });
    }
    if (results.length === 0) {
 
      return res.status(404).send({ error: "You are not authorized" });
    }
    else {  
        req.headers.tenant_uuid=results[0].tenant_uuid
        next()
        ;}
  });
};
module.exports = {validateAdmin};
