const express = require("express");
const mysql = require("mysql");
const util = require("util");
const app = express();
const jwt = require("jsonwebtoken");
const socketIO = require('socket.io');

app.use(express.json());
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connection, releaseConnectionPool, dbConfig } = require("./db/db");
const { clientRoute } = require("./Routes/clientRoute");
const { usersRoute } = require("./Routes/userRoute");
const { userTodoRoute } = require("./Routes/todoRoute");
const { sendEmail } = require("./middleware/email&pass.sender");
const { loginRouter } = require("./Routes/loginRoutes");
const { validateAdmin } = require("./middleware/validateadmin");
const { taskRouter } = require("./Routes/taskRoutes");

app.use(express.json());
app.use(cors());

// Middleware for CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get("/", (req, res) => {
  res.status(200).send({ result: "Home page" });
});

app.use(cookieParser());
app.use("/task",taskRouter)
app.use("/client", clientRoute);
app.use("/user", usersRoute);

app.use("/todo", userTodoRoute);
app.use("/bothlogin", loginRouter);

// Create server and socket.io instance
const server = app.listen(8080, async (err) => {
  if (err) {
    console.log(err);
  } else {
    try {
      await connection(); // Connect to the database
    } catch (error) {
      console.log("Error while connecting to the database:", error);
      server.close();
    }
  }
});

const io = socketIO(server, {
  cors: {
    origin: "*", // Replace with the actual URL of your frontend application
    methods: ["GET", "POST", "PATCH", "PUT"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

// Socket.io event handler
io.on('connection', (socket) => {
  console.log('A client connected');
  socket.on('todoAssigned', (data) => {
    console.log('Todo assigned:', data);
    // Handle the todoAssigned event
  });


  socket.on('disconnect', () => {
    console.log('A client disconnected');
  });
});



app.patch("/users/assignto/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const assignee_email = req.headers.email;
    const token = req.headers.authorization;
    const { email } = req.body;

    if (!token) {
      return res.status(401).send({ error: "Cannot process request without token" });
    }

    const tenantId = jwt.verify(token, process.env.secret_key);
    const dbName = `tenant_${tenantId.org_id||tenantId.uuid}`;

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
      console.log(user);
      return res.status(500).send({ error: "Cannot process request" });
    }

    // Checking if the ID is valid or not
    var [specific_todo] = tenantId.org_id?  await util
      .promisify(connection.query)
      .call(connection, "SELECT * FROM todo WHERE user_id = ? AND id = ?", [
        user.id,
        id,
      ]): await util
      .promisify(connection.query)
      .call(connection, "SELECT * FROM todo WHERE id = ?", [
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
      // Emit a socket event to notify the frontend
      io.emit('todoAssigned', { email,assignee_email, result: specific_todo,assignby:"user" });
      res.status(200).send({ message: `Assigned task to ${result1.email}` });
    } else {
      connection.release();
      return res.status(400).send({ error: "Invalid request" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Cannot process request", error });
  }
});

// Close the database connection when the server is closed
server.on("close", () => {
  releaseConnectionPool();
  console.log("Server closed. Connection pool released.");
});


app.post("/clients/assigntodo", validateAdmin, async (req, res) => {
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
              "INSERT INTO todo (title, description,status,assignby_admin,deadline_time,user_id) VALUES(?,?,?,?,?,?)";

            connection.query(
              insert_q,
              [title, description, status || 0, 1,deadline_time, response[0].id],
              (err, result) => {
                if (err) {
                  connection.release();
                  res.status(401).send({ error: "cannot process req", err });
                } else {
                  connection.release();
                  io.emit('todoAssigned', { email:specific_user_email,result:result,assignby:"client" });
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
});