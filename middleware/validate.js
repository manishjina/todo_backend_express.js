const { connection, pool } = require("../db/db");

// Middleware function to validate if a tenant already exists
const validate = (req, res, next) => {
  const { email } = req.body;

  // Check if the email exists in the 'registration' table
  const q = "SELECT `email` FROM registration WHERE email=?";
  pool.query(q, [email], (err, result) => {
    if (err) {
      return res.status(500).send({ "error": `Cannot process request ${err}` });
    }
    if (result.length > 0) {
      // If the email exists, send an error response
      res.status(300).send({ "error": "Tenant already exists. Please login." });
    } 
  
    else {
      // If the email does not exist, proceed to the next middleware or route handler
      
      next();
    }
  });
};
module.exports = {
  validate
};