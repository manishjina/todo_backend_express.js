const express = require("express");

const app = express();

app.use(express.json());
require("dotenv").config();
const cors = require("cors")
const cookieParser = require("cookie-parser");
const { connection, releaseConnectionPool } = require("./db/db");
const { clientRoute } = require("./Routes/clientRoute");
const { usersRoute } = require("./Routes/userRoute");
const { userTodoRoute } = require("./Routes/todoRoute");
const { sendEmail } = require("./middleware/email&pass.sender");
const { loginRouter } = require("./Routes/loginRoutes");
app.use(express.json())


app.use(cors())

//intial commit

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next()
});


app.get("/", (req, res) => {
  res.status(200).send({ result: "Home page" });
});

app.use(cookieParser());
app.use("/client", clientRoute);
app.use("/user", usersRoute);
app.use("/todo", userTodoRoute);
app.use("/bothlogin",loginRouter)



//checking;
// function getCurrentDateTime() {
//   const currentDateTime = new Date(); // Get the current date and time

//   const futureDateTime = new Date(
//     currentDateTime.getTime() + 24 * 60 * 60 * 1000
//   ); // Add 24 hours (24 * 60 * 60 * 1000 milliseconds) to the current date and time

//   const options = {
//     hour12: false, // Use 24-hour format
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//     hour: "2-digit",
//     minute: "2-digit",
//   };

//   const currentFormatted = currentDateTime.toLocaleString(options);
//   const futureFormatted = futureDateTime.toLocaleString(options);

//   return {
//     current: currentFormatted,
//     future: futureFormatted,
//   };
// }

// Example usage:

const server = app.listen(8090, async (err) => {
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

// Close the database connection when the server is closed
server.on("close", () => {
  releaseConnectionPool();
  console.log("Server closed. Connection pool released.");
});
