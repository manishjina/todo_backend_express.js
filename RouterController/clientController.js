const { dbConfig, connection, pool } = require("../db/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
const mysql = require("mysql");

const cookieParser = require("cookie-parser");
const { encryptPassword } = require("../middleware/password.encrypt");
// Register handeler function;


//new

const handelClientRegister = async (req, res) => {
  try {
    const dateTime = getCurrentDateTime();
    console.log("date time",dateTime);

    const { email, password, firstname, lastname } = req.body;
    if (
      !email ||
      !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) ||
      !password ||
      password.length < 6 ||
      !firstname ||
      firstname.trim().length === 0 ||
      !lastname ||
      lastname.trim().length === 0
    ) {
      // At least one of the fields is missing or invalid
      return res.status(400).json({ error: "Invalid request data" });
    }
    console.log("register");

    const time_stamp = Date.now(); // Get current timestamp
    const random_no = Math.random().toString(36).substring(2,8);
    // creating a random database name for client;
    const tenant_uuid = `${time_stamp}_${random_no}`;
    console.log(tenant_uuid);

    let hashedPassword = await encryptPassword(password);
    const registrationQuery =
      "INSERT INTO registration (`email`, `password`, `tenant_uuid`) VALUES (?, ?, ?)";
    const registrationValues = [email, hashedPassword, tenant_uuid];

    pool.query(
      registrationQuery,
      registrationValues,
      async (err, registrationResult) => {
        if (err) {
          console.error("Error while inserting into registration table:", err);
          return res
            .status(500)
            .send({ error: `Cannot process request: ${err}` });
        }

        // Creating the database
        const createDbQuery = `CREATE DATABASE tenant_${tenant_uuid}`;

        pool.query(createDbQuery, async (err, createDbResult) => {
          if (err) {
            console.error("Error creating database:", err);
            return res
              .status(500)
              .send({ error: `Cannot process request: ${err}` });
          }

          const userDbConfig = {
            ...dbConfig,
            database: `tenant_${tenant_uuid}`,
          };
          const pool1 = mysql.createPool(userDbConfig);

          pool1.getConnection(async (error, connection) => {
            if (error) {
              console.error(
                "Error getting connection to user database:",
                error
              );
              return res
                .status(500)
                .send({ error: `Cannot process request: ${error}` });
            }
            try {
              await createUserTableIfNotExists(pool1);
              await createTodoTableIfNotExists(pool1);
              await createSubTaskTable(pool1)
            } catch (error) {
              console.error("Error creating tables:", error);
              return res
                .status(500)
                .send({ error: "Error while creating the table", err: error });
            } // Check and create 'user' table if not exists

            // Hash the password
            bcrypt.hash(
              password,
              Number(process.env.saltround),
              (err, hashedPassword) => {
                if (err) {
                  console.error("Error hashing password:", err);
                  return res
                    .status(500)
                    .send({ error: "Error hashing password" });
                }

                const userQuery =
                  "INSERT INTO user (`email`, `firstname`, `lastname`, `password`, `tenant_uuid`) VALUES (?, ?, ?, ?, ?)";
                const userValues = [
                  email,
                  firstname,
                  lastname,
                  hashedPassword,
                  tenant_uuid,
                ];
                pool1.query(userQuery, userValues, (err, userResult) => {
                  if (err) {
                    console.error("Error inserting into user table:", err);
                    return res.status(500).send({
                      error: `Error whileinserting data into user table`,
                      err: err,
                    });
                  }
                  return res.status(200).send({
                    result: `Inserted data into tenant_${tenant_uuid} successfully`,
                  });
                });
              }
            );

            connection.release();
            // Release the connection
          });
        });
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Cannot process request", error });
  }
};

// Login handler function

const handelClientLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("login")

    // Authenticate user and retrieve user's database information
    const isEmailPresentQ = "SELECT * FROM registration WHERE email = ? ";
    const value = [email];
    pool.query(isEmailPresentQ, value, (err, result) => {
      if (err) {
        return res.status(500).send({ error: "cannot process req", err });
      } else if (result.length === 0) {
        return res.status(401).send({ error: "please sign up first" });
      } else {
        // Perform password verification here
        // ...
        bcrypt.compare(password, result[0].password, (err, resul) => {
          if (err) {
            return res.status(500).json({ error: "Login again.", err });
          } else if (!resul) {
            return res
              .status(500)
              .json({ wrong: "Plese enter correct password", err });
          } else {
            // Generate a JWT token
            let uuid = result[0].tenant_uuid;

            const token = jwt.sign({ uuid }, process.env.secret_key);

            return res
              .cookie("access_token", token, {
                httpOnly: true,
              })
              .status(200)
              .send({
                message: "Login successful",
                token,
                email,
                role: "client",
              });
            // Return the token in the response
          }
        });
      }
    });
  } catch (err) {
    // Handle authentication errors
    console.log(err);
    return res.status(500).send({ error: "Internal server error", err });

   
  }
};

//assigning task to individual user;

const handelClientAssignTodo = (req, res) => {
  try {
    const specific_user_email = req.headers.specific_user_email;
    const token = req.headers.authorization;

    if (!specific_user_email)
      return res.status(301).send({ error: "email need to pass of user" });

    //decrypt the token and connect to the specific database;

    const tenant_uuid = jwt.verify(token, process.env.secret_key);
    if (!tenant_uuid.uuid)
      return res.status(401).send({ error: "invalid token" });

    //after getting the tennant_uuid we can establish a connection with specific db;

    const dbName = `tenant_${tenant_uuid.uuid}`;
    const userDbConfig = {
      ...dbConfig,
      database: dbName,
    };
    const pool1 = mysql.createPool(userDbConfig);

    pool1.getConnection((err, connection) => {
      if (err)
        return res
          .status(401)
          .send({ error: "error while establish connection with db" });
      else {
        console.log(` connected to  ${connection.config.database}`);
        //after established connection with db;
        //we need to find the specefic user with specific_user_email;

        const q = "SELECT email,id from user WHERE email=?";
        connection.query(q, [specific_user_email], (err, response) => {
          if (err) {
            return res.status(401).send({ error: "cannot process req", err });
          } else if (response.length === 0) {
            connection.release();
            return res.status(401).send({ error: "no user found" });
          } else {
            //now we have got the user with specific email add and the user id;
            //now we have to create a todo with the specific information and insert it to todo table;
            const { title, description, status,deadline_time } = req.body;
            // console.log(response[0])

            const insert_q =
              "INSERT INTO todo (title, description,status,deadline_time,assignby_admin,user_id) VALUES(?,?,?,?,?,?)";

            connection.query(
              insert_q,
              [title, description, status || 0, 1,deadline_time, response[0].id],
              (err, result) => {
                if (err) {
                  connection.release();
                  res.status(401).send({ error: "cannot process req", err });
                } else {
                  connection.release();
                  res
                    .status(200)
                    .send({ message: `task assigned to ${specific_user_email}` });
                }
              }
            );
          }
        });
      }
    });
  } catch (error) {
    return res.status(500).send({ error: "cannot process req", error });
  }
};

//creating a subtask Table in which all the subtask of main task will be stored;

const createSubTaskTable = (pool1) => {
  return new Promise((resolve, reject) => {
    const query = `CREATE TABLE IF NOT EXISTS subtask (
      subtask_id INT AUTO_INCREMENT PRIMARY KEY,
      main_task_id INT NOT NULL,
      sub_task VARCHAR(55) NOT NULL,
      status TINYINT(1) NOT NULL DEFAULT 0,
      color_code VARCHAR(10) DEFAULT NULL,
      custom_status VARCHAR(55) DEFAULT NULL
    )`;

    pool1.query(query, (err, result) => {
      if (err) {
        console.log("Error while creating the table", err);
        reject(err);
      } else {
        console.log("subTask Table created successfully!");
        resolve();
      }
    });
  });
};


// Check if table exists and create if not
const createTodoTableIfNotExists = (pool1) => {
  return new Promise((resolve, reject) => {
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS todo (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(55),
      description VARCHAR(155),
      status TINYINT(1) NOT NULL DEFAULT 0,
      user_id INT(55),
      assignby_admin TINYINT(1) DEFAULT 0,
      assignby_user_email VARCHAR(20),
      time_at_created DATETIME  DEFAULT CURRENT_TIMESTAMP,
      deadline_time VARCHAR(25) NULL,
      custom_status VARCHAR(10) DEFAULT NULL,
      color_code VARCHAR(10) DEFAULT NULL
    )`;

    // Check if the table exists
    pool1.query(`SHOW TABLES LIKE 'todo'`, (error, results) => {
      if (error) {
        console.error("Error checking if todo table exists:", error);
        reject(error);
      } else {
        if (results.length === 0) {
          // Table does not exist, create it
          pool1.query(createTableQuery, (error) => {
            if (error) {
              console.error("Error creating todo table:", error);
              reject(error);
            } else {
              console.log("Todo table created successfully");
              resolve();
            }
          });
        } else {
          // Table already exists
          console.log("Todo table already exists");
          resolve();
        }
      }
    });
  });
};

// Check if table exists and create if not
const createUserTableIfNotExists = (pool1) => {
  return new Promise((resolve, reject) => {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS user (
        id INT AUTO_INCREMENT PRIMARY KEY,
        firstname VARCHAR(255),
        lastname VARCHAR(255),
        email VARCHAR(255),
        password VARCHAR(255),
        role INT DEFAULT 1,
        tenant_uuid VARCHAR(255)
      )`;

    // Check if the table exists
    pool1.query(`SHOW TABLES LIKE 'user'`, (error, results) => {
      if (error) {
        console.error("Error checking if user table exists:", error);
        reject(error);
      } else {
        if (results.length === 0) {
          // Table does not exist, create it
          pool1.query(createTableQuery, (error) => {
            if (error) {
              console.error("Error creating user table:", error);
              reject(error);
            } else {
              console.log("User table created successfully");
              resolve();
            }
          });
        } else {
          // Table already exists
          console.log("User table already exists");
          resolve();
        }
      }
    });
  });
};
function getCurrentDateTime() {
  const currentDateTime = new Date(); // Get the current date and time

  const futureDateTime = new Date(
    currentDateTime.getTime() + 24 * 60 * 60 * 1000
  ); // Add 24 hours (24 * 60 * 60 * 1000 milliseconds) to the current date and time

  const options = {
    hour12: false, // Use 24-hour format
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  };

  const currentFormatted = currentDateTime.toLocaleString(options);
  const futureFormatted = futureDateTime.toLocaleString(options);

  return {
    current: currentFormatted,
    future: futureFormatted,
  };
}

module.exports = {
  handelClientLogin,
  handelClientRegister,
  handelClientAssignTodo,
};
