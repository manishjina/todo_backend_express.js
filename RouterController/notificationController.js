const jwt = require("jsonwebtoken");
const { dbConfig } = require("../db/db");
const mysql = require("mysql");
const handleGetAllNotifications = (req, res) => {
  try {
    const token = req.headers.authorization;
    const email = req.headers.email;
    // Verify the token
    jwt.verify(token, process.env.secret_key, (err, decodedToken) => {
      if (err) {
        return res.status(401).send({ error: "Invalid token", err });
      }

      const tenantId = decodedToken.org_id || decodedToken.uuid;

      // Connect to the tenant database
      const dbName = `tenant_${tenantId}`;

      const notificationDbConfig = {
        ...dbConfig,
        database: dbName,
      };
      const pool = mysql.createPool(notificationDbConfig);

      pool.getConnection((error, connection) => {
        if (error) {
          return res
            .status(401)
            .send({ error: "Error while connecting to the database", error });
        }

        const query = "SELECT * FROM notifications WHERE email = ?";
        const values = [email];

        connection.query(query, values, (err, results) => {
          connection.release();
          if (err) {
            return res
              .status(401)
              .send({ error: "Cannot process request", err });
          }

          res.send(results);
        });
      });
    });
  } catch (error) {
    console.log(error);
    res.send("Error");
  }
};

const handlePostNotification = (req, res) => {
  try {
    const { message, email } = req.body;
    const token = req.headers.authorization;

    // Verify the token
    jwt.verify(token, process.env.secret_key, (err, decodedToken) => {
      if (err) {
        return res.status(401).send({ error: "Invalid token", err });
      }

      const tenantId = decodedToken.org_id || decodedToken.uuid;

      // Connect to the tenant database
      const dbName = `tenant_${tenantId}`;
      const userDbConfig = {
        ...dbConfig,
        database: dbName,
      };
      const pool1 = mysql.createPool(userDbConfig);

      pool1.getConnection((error, connection) => {
        if (error) {
          return res
            .status(401)
            .send({ error: "Error while connecting to the database", error });
        }

        const insertQuery =
          "INSERT INTO notifications (message, email) VALUES (?, ?)";
        const values = [message, email];

        connection.query(insertQuery, values, (err, result) => {
          connection.release();
          if (err) {
            return res
              .status(401)
              .send({ error: "Cannot process request", err });
          }

          res.send({ message: "Notification added successfully" });
        });
      });
    });
  } catch (error) {
    console.log(error);
    res.send("Error");
  }
};

module.exports = { handleGetAllNotifications, handlePostNotification };
