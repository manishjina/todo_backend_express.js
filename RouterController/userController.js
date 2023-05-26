const jwt = require("jsonwebtoken");
const io = require('socket.io')()
const { dbConfig, connection, pool } = require("../db/db");
const mysql = require("mysql");
const { encryptPassword } = require("../middleware/password.encrypt");
const { decryptPassword } = require("../middleware/password.decrypt");
const {
  sendCredentialsEmail,
  sendEmail,
} = require("../middleware/email&pass.sender");
const util = require("util");
const { generateRandomPassword } = require("../middleware/generateRandomPassword");

//getting all user to user info;

const  handelGetAlluserSuggestion = (req, res) => {
  try {
   
    const token = req.headers.authorization;
    jwt.verify(token, process.env.secret_key, (err, Tenantuuid) => {
      if (err) {
        return res.status(500).send({ error: err });
      } else {
        const dbName = `tenant_${Tenantuuid.org_id}`;
        const userDbConfig = {
          ...dbConfig,
          database: dbName,
        };
        console.log(dbName);
        const pool1 = mysql.createPool(userDbConfig);
        const q = "SELECT firstname, lastname, email FROM user WHERE role = 0";
        pool1.query(q, (err, result) => {
          if (err) {
            return res.status(300).send(err);
          } else {
            res.status(200).send(result);
          }
        });
      }
    });
  } catch (error) {
    return res.status(500).send({ error });
  }
};


// const addUser = async (req, res) => {
//   try {
//     const { email, firstname, lastname, password } = req.body;
//     const token = req.headers.authorization;
//     if (
//       !email ||
//       !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) ||
//       !password ||
//       password.length < 6 ||
//       !firstname ||
//       firstname.trim().length === 0 ||
//       !lastname ||
//       lastname.trim().length === 0
//     ) {
//       return res.status(400).json({ error: "Invalid request data" });
//     }
//     let username = `${firstname} ${lastname}`;

//     jwt.verify(token, process.env.secret_key, async (err, result) => {
//       if (err) {
//         return res.status(401).send({ error: "cannot process req", err });
//       } else {
//         let hashpassword = await encryptPassword(password);

//         // Check if the user already exists
//         const checkUserQuery = "SELECT * FROM user_incomming WHERE email = ?";
//         pool.query(checkUserQuery, [email], async (err, userResult) => {
//           if (err) {
//             return res.status(401).send({ error: "cannot process req", err });
//           }
//           if (userResult.length > 0) {
//             return res.status(409).send({ message: "User already exists" });
//           }

//           const insertUserQuery =
//             "INSERT INTO user_incomming (email, firstname, lastname, password, role, org_id) VALUES (?, ?, ?, ?, ?, ?)";

//           res.cookie("useruuid", result.org_id, {
//             httpOnly: true,
//           });

//           const insertUserValues = [
//             email,
//             firstname,
//             lastname,
//             hashpassword,
//             0,
//             result.uuid,
//           ];
//           pool.query(insertUserQuery, insertUserValues, (err, resul) => {
//             if (err) {
//               return res.status(401).send({ error: "cannot process req", err });
//             }

//             const dbName = `tenant_${result.uuid}`;
//             const userDbConfig = {
//               ...dbConfig,
//               database: dbName,
//             };
//             const pool1 = mysql.createPool(userDbConfig);
//             pool1.getConnection(async(error, connection) => {
//               if (error) {
//                 return res
//                   .status(401)
//                   .send({ error: "error while connection to db", error });
//               }
//              let test=await sendEmail(email, password)
//  console.log(test);
//               const insertUserQuery =
//                 "INSERT INTO user (email, firstname, lastname, password, role, tenant_uuid) VALUES (?, ?, ?, ?, ?, ?)";
//               let uuid = result.uuid;
//               const insertUserValues = [
//                 email,
//                 firstname,
//                 lastname,
//                 hashpassword,
//                 0,
//                 uuid,
//               ];
//               connection.query(
//                 insertUserQuery,
//                 insertUserValues,
//                 (err, result) => {
//                   if (err) {
//                     connection.release();
//                     return res
//                       .status(401)
//                       .send({ error: "cannot process req", err });
//                   }
//                   connection.release();
//                   res.send({"message":"user added successfully"});
//                 }
//               );
//             });
//           });
//         });
//       }
//     });
//   } catch (error) {
//     console.log(error);
//     res.send("error");
//   }
// };

//new
const addUser = async (req, res) => {
  try {
    const { email, firstname, lastname, password } = req.body;
    const token = req.headers.authorization;
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
      return res.status(400).json({ error: "Invalid request data" });
    }
    let username = `${firstname} ${lastname}`;

    jwt.verify(token, process.env.secret_key, async (err, result) => {
      if (err) {
        return res.status(401).send({ error: "cannot process req", err });
      } else {
        const random_password=await generateRandomPassword(10)
        let hashpassword = await encryptPassword(random_password);
        console.log(random_password)
        // Check if the user already exists
        const checkUserQuery = "SELECT * FROM user_incomming WHERE email = ?";
        pool.query(checkUserQuery, [email], async (err, userResult) => {
          if (err) {
            return res.status(401).send({ error: "cannot process req", err });
          }
          if (userResult.length > 0) {
            return res.status(409).send({ message: "User already exists" });
          }

          const insertUserQuery =
            "INSERT INTO user_incomming (email, firstname, lastname, password, role, org_id) VALUES (?, ?, ?, ?, ?, ?)";

          res.cookie("useruuid", result.org_id, {
            httpOnly: true,
          });

        await sendEmail(email,random_password)

          const insertUserValues = [
            email,
            firstname,
            lastname,
            hashpassword,
            0,
            result.uuid,
          ];
          pool.query(insertUserQuery, insertUserValues, (err, resul) => {
            if (err) {
              return res.status(401).send({ error: "cannot process req", err });
            }

            const dbName = `tenant_${result.uuid}`;
            const userDbConfig = {
              ...dbConfig,
              database: dbName,
            };
            const pool1 = mysql.createPool(userDbConfig);
            pool1.getConnection(async (error, connection) => {
              if (error) {
                return res
                  .status(401)
                  .send({ error: "error while connection to db", error });
              }

              // Get the user data
              const user = {
                email,
                firstname,
                lastname,
                password: hashpassword,
                role: 0,
                tenant_uuid: result.uuid,
              };

              // Insert user into the user table
              const insertUserQuery =
                "INSERT INTO user (email, firstname, lastname, password, role, tenant_uuid) VALUES (?, ?, ?, ?, ?, ?)";
              connection.query(
                insertUserQuery,
                Object.values(user),
                (err, result) => {
                  if (err) {
                    connection.release();
                    return res
                      .status(401)
                      .send({ error: "cannot process req", err });
                  }
                  connection.release();

                  // Update the user object with the inserted user ID
                  const { email, firstname, lastname, ...other } = user;
                  const id = result.insertId;

                  res.send({
                    message: "User added successfully",
                    email,
                    firstname,
                    lastname,
                    id,
                  });
                }
              );
            });
          });
        });
      }
    });
  } catch (error) {
    console.log(error);
    res.send("error");
  }
};

const getUser = (req, res) => {
  try {
    const { email } = req.query;
    const token = req.headers.authorization;
    const user_email = req.headers.email;

    jwt.verify(token, process.env.secret_key, (err, result) => {
      if (err)
        return res.status(401).send({ error: "cannot process req", err });

      const dbName = `tenant_${result.uuid}`;
      const userDbConfig = {
        ...dbConfig,
        database: dbName,
      };
      const pool1 = mysql.createPool(userDbConfig);

      pool1.getConnection((error, connection) => {
        if (error) {
          return res
            .status(401)
            .send({ error: "error while connection to db", error });
        }
        const selectUserQuery = "SELECT * FROM user WHERE email = ?";
        const selectUserValues = [email];

        connection.query(selectUserQuery, selectUserValues, (err, result) => {
          if (err) {
            connection.release();
            return res.status(401).send({ error: "cannot process req", err });
          }
          connection.release();
          res.send(result);
        });
      });
    });
  } catch (error) {
    console.log(error);
    res.send("error");
  }
};

// const updateUser = (req, res) => {
//   try {
//     const { email, firstname, lastname, password } = req.body;
//     const userId = req.params.id;
//     const token = req.headers.authorization;
//     const user_email = req.headers.email;

//     jwt.verify(token, process.env.secret_key, async (err, result) => {
//       if (err)
//         return res.status(401).send({ error: "cannot process req", err });

//       const dbName = `tenant_${result.uuid}`;
//       const userDbConfig = {
//         ...dbConfig,
//         database: dbName,
//       };
//       const pool1 = mysql.createPool(userDbConfig);

//       pool1.getConnection(async (error, connection) => {
//         if (error) {
//           return res
//             .status(401)
//             .send({ error: "error while connection to db", error });
//         }

//         let hashpassword = await encryptPassword(password);

//         const updateUserQuery =
//           "UPDATE user SET firstname = ?, lastname = ?, password = ? WHERE id = ?";
//         const updateUserValues = [firstname, lastname, hashpassword, userId];

//         connection.query(updateUserQuery, updateUserValues, (err, result) => {
//           connection.release();
//           if (err) {
//             return res.status(401).send({ error: "cannot process req", err });
//           }
//           if (result.affectedRows === 0) {
//             return res.status(404).send({ message: "User not found" });
//           } else {
//             res.send({ message: "User updated successfully" });
//           }
//         });
//       });
//     });
//   } catch (error) {
//     console.log(error);
//     res.send("error");
//   }
// };

//new function for updateing code from admin

const updateUser = (req, res) => {
  try {
    const { email, firstname, lastname, password } = req.body;
    const userId = req.params.id;
    const token = req.headers.authorization;
    const user_email = req.headers.email;
    console.log(password, firstname, lastname);
    jwt.verify(token, process.env.secret_key, async (err, result) => {
      if (err)
        return res.status(401).send({ error: "cannot process req", err });

      const commonDbConfig = {
        ...dbConfig,
        database: "common_db", // Update with the common_db name
      };
      const tenantDbConfig = {
        ...dbConfig,
        database: `tenant_${result.uuid}`,
      };
      const commonPool = mysql.createPool(commonDbConfig);
      const tenantPool = mysql.createPool(tenantDbConfig);

      commonPool.getConnection(async (commonError, commonConnection) => {
        if (commonError) {
          return res
            .status(401)
            .send({ error: "error while connecting to common_db", commonError });
        }

        let hashpassword = await encryptPassword(password);
        console.log(hashpassword);

        const updateCommonQuery =
          "UPDATE user_incomming SET firstname = ?, lastname = ?, password = ?  WHERE email = ?";
        const updateCommonValues = [firstname, lastname, hashpassword, email];

        commonConnection.query(updateCommonQuery, updateCommonValues, (updateCommonError, updateCommonResult) => {
          if (updateCommonError) {
            commonConnection.release();
            return res.status(401).send({ error: "cannot process req", updateCommonError });
          }

          tenantPool.getConnection(async (tenantError, tenantConnection) => {
            if (tenantError) {
              commonConnection.release();
              return res
                .status(401)
                .send({ error: "error while connecting to tenant_db", tenantError });
            }

            const updateTenantQuery =
              "UPDATE user SET firstname = ?, lastname = ?, password = ?  WHERE id = ?";
            const updateTenantValues = [firstname, lastname, hashpassword, userId];

            tenantConnection.query(updateTenantQuery, updateTenantValues, (updateTenantError, updateTenantResult) => {
              commonConnection.release();
              tenantConnection.release();

              if (updateTenantError) {
                return res.status(401).send({ error: "cannot process req", updateTenantError });
              }
              if (updateTenantResult.affectedRows === 0) {
                return res.status(404).send({ message: "User not found in tenant_db" });
              } else {
                // Retrieve the updated user from the database
                const getUserQuery = "SELECT * FROM user WHERE id = ?";
                const getUserValues = [userId];

                tenantConnection.query(getUserQuery, getUserValues, (getUserError, updatedUser) => {
                  if (getUserError) {
                    return res.status(401).send({ error: "cannot process req", getUserError });
                  }
                  if (updatedUser.length === 0) {
                    return res.status(404).send({ message: "User not found in tenant_db" });
                  }

                  const updatedUserResult = updatedUser[0];
                  return res.send({ message: "User updated successfully", user: updatedUserResult });
                });
              }
            });
          });
        });
      });
    });
  } catch (error) {
    console.log(error);
    res.send("error");
  }
};

const deleteUser = (req, res) => {
  try {
    const userId = req.params.id;
    const token = req.headers.authorization;
    const user_email = req.headers.email;

    jwt.verify(token, process.env.secret_key, (err, result) => {
      if (err)
        return res.status(401).send({ error: "cannot process req", err });

      const dbName = `tenant_${result.uuid}`;
      const userDbConfig = {
        ...dbConfig,
        database: dbName,
      };
      const pool1 = mysql.createPool(userDbConfig);

      pool1.getConnection((error, connection) => {
        if (error) {
          return res
            .status(401)
            .send({ error: "error while connection to db", error });
        }

        const deleteUserQuery = "DELETE FROM user WHERE id = ?";
        const deleteUserValues = [userId];

        connection.query(deleteUserQuery, deleteUserValues, (err, result) => {
          connection.release();
          if (err) {
            return res.status(401).send({ error: "cannot process req", err });
          }

          if (result.affectedRows === 0) {
            return res.status(404).send({ message: "User not found" });
          } else {
            res.send({ message: "User delete successfully" });
          }
        });
      });
    });
  } catch (error) {
    console.log(error);
    res.send("error");
  }
};

// User login handler function
const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    // Create a MySQL connection pool
    const pool = mysql.createPool(dbConfig);

    // Retrieve the user from the database based on email
    const query = "SELECT * FROM user_incomming WHERE email = ?";
    pool.query(query, [email], async (error, results) => {
      if (error) {
        console.error("Error retrieving user:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
      // Check if the user exists
      if (results.length === 0) {
        return res.status(401).json({ error: "User not found pleae signup" });
      }
      const user = results[0];
      // Compare the provided password with the hashed password stored in the database
      const passwordMatch = await decryptPassword(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ wrong: "Invalid email or password" });
      }
      // Generate a token using the user ID

      // const decryptuuid = await decryptPassword(useruuid, user.org_id);
      const token = jwt.sign({ org_id: user.org_id }, process.env.secret_key);
      // Set the token as a cookie using the 'access_token' name
      res.cookie("user_acces_token", token, {
        httpOnly: true,
        // Set to true if using HTTPS
      });

      res.cookie("user_email", results[0].email, {
        httpOnly: true,
        // Set to true if using HTTPS
      });

      // Return a success response
      res.status(200).json({
        message: "Login successful",
        token,
        email: email,
        role: "user",
      });
    });
  } catch (error) {
    console.error("Error in user login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const handleGetAllUser = (req, res) => {
  try {
    const tenantId = req.headers.tenant_uuid;

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
          .send({ error: "error while connecting to the database", error });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const query = `SELECT * FROM user LIMIT ${limit} OFFSET ${offset}`;

      connection.query(query, (err, results) => {
        connection.release();

        if (err) {
          return res.status(401).send({ error: "cannot process request", err });
        }

        res.send(results);
      });
    });
  } catch (error) {
    console.log(error);
    res.send("error");
  }
};

// const handleAssignToColleague = async (req, res) => {
//   try {

//     const id = req.params.id;
//     const assignee_email = req.headers.email;
//     const token = req.headers.authorization;
//     const email=req.body
//     if (!token) {
//       return res.status(401).send({ error: "Cannot process request without token" });
//     }
//     const tenantId = jwt.verify(token, process.env.secret_key);
//     const dbName = `tenant_${tenantId.org_id}`;
//     const userDbConfig = {
//       ...dbConfig,
//       database: dbName,
//     };
//     const pool1 = mysql.createPool(userDbConfig);
//     const connection = await util.promisify(pool1.getConnection).call(pool1);

//     // Checking if entered email is present or not

//     const [result1] = await util.promisify(connection.query).call(
//       connection,
//       "SELECT email, id FROM user WHERE email = ? AND role = 0",
//       [email]
//     );
//     console.log(email)
//     if (!result1) {
//       return res.status(401).send({ error: "User not found" });
//     }

//     // Searching for the ID of the user who created the todo
//     const [user] = await util.promisify(connection.query).call(
//       connection,
//       "SELECT id FROM user WHERE email = ?",
//       [assignee_email]
//     );

//     if (!user) {
//       return res.status(500).send({ error: "Cannot process request" });
//     }

//     // Checking if the ID is valid or not
//     const specific_todo = await util.promisify(connection.query).call(
//       connection,
//       "SELECT * FROM todo WHERE user_id = ?",
//       [user.id]
//     );

//     const check = specific_todo.find(elm => +elm.id === Number(id));

//     if (check) {
//       // Updating the todo with the assigned user
//       await util.promisify(connection.query).call(
//         connection,
//         "UPDATE todo SET user_id = ?, assignby_user_email = ? WHERE id = ?",
//         [result1.id, assignee_email, id]
//       );
//       connection.release();
//       res.status(200).send({ message: `Assigned task to ${result1.email}` });
//     } else {
//       return res.status(400).send({ error: "Invalid request" });
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({ error: "Cannot process request", error });
//   }
// };
//new
const handleAssignToColleague = async (req, res) => {
  try {
    const id = req.params.id;
    const assignee_email = req.headers.email;
    const token = req.headers.authorization;
    const { email } = req.body;

    if (!token) {
      return res
        .status(401)
        .send({ error: "Cannot process request without token" });
    }

    const tenantId = jwt.verify(token, process.env.secret_key);
    const dbName = `tenant_${tenantId.org_id}`;
    const userDbConfig = {
      ...dbConfig,
      database: dbName,
    };
    const pool1 = mysql.createPool(userDbConfig);
    const connection = await util.promisify(pool1.getConnection).call(pool1);

    // Checking if entered email is present or not
    const [result1] = await util
      .promisify(connection.query)
      .call(
        connection,
        "SELECT email, id FROM user WHERE email = ? AND role = 0",
        [email]
      );

    if (!result1) {
      connection.release();
      return res.status(401).send({ error: "User not found" });
    }

    // Searching for the ID of the user who created the todo
    const [user] = await util
      .promisify(connection.query)
      .call(connection, "SELECT id FROM user WHERE email = ?", [
        assignee_email,
      ]);

    if (!user) {
      connection.release();
      return res.status(500).send({ error: "Cannot process request" });
    }

    // Checking if the ID is valid or not
    const [specific_todo] = await util
      .promisify(connection.query)
      .call(connection, "SELECT * FROM todo WHERE user_id = ? AND id = ?", [
        user.id,
        id,
      ]);

    

    if (specific_todo) {
      // Updating the todo with the assigned user
      await util
        .promisify(connection.query)
        .call(
          connection,
          "UPDATE todo SET user_id = ?, assignby_user_email = ? WHERE id = ?",
          [result1.id, assignee_email, id]
        );

      connection.release();
      const userSocketId =email;
      if (userSocketId) {
        io.to(userSocketId).emit('todoAssigned', assignedTodo);
      }
      
      res.status(200).send({ message: `Assigned task to ${result1.email}` });
    } else {
      connection.release();
      return res.status(400).send({ error: "Invalid request" });
    }
  } catch (error) {
    console.log(error)
    res.status(500).send({ error: "Cannot process request", error });
  }
};

module.exports = {
  addUser,
  deleteUser,
  updateUser,
  getUser,
  userLogin,
  handleGetAllUser,
  handleAssignToColleague,
  handelGetAlluserSuggestion,
};
