const { connection, pool } = require("../db/db");

// Middleware function to validate if a tenant already exists
const validateisAdmin = (req, res, next) => {
  const  email  = req.headers.email;
 

  // Check if the email exists in the 'registration' table
  const q = "SELECT `email` FROM registration WHERE email=?";
  pool.query(q, [email], (err, result) => {
    if (err) {
      return res.status(500).send({ error: `Cannot process request ${err}` });
    }
    if (result.length > 0) {
      
      next();
    } else if (result.length === 0) {
      return res.status(301).send({ error: "you are not authorized" });
    }
  });
};
module.exports = {
  validateisAdmin,
};
