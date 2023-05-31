const mysql=require("mysql")
require("dotenv").config()
// const dbConfig = {
//   host:"localhost",
//   user: "root",
//   password: "root", 
//   database:"common_db",
//   connectionLimit: 5,
// }


const dbConfig={
  host:process.env.host,
  user:process.env.database_user,
  password:process.env.database_password,
  database:process.env.database_name,
  connectionLimit:5
}


  const pool = mysql.createPool(dbConfig);
// Function to release the connection pool
const releaseConnectionPool = () => {
  pool.end((err) => {
    if (err) {
      console.log("Error while releasing the connection pool:", err);
    } else {
      console.log("Connection pool released");
    }
  });
};

// Function to get a connection from the pool
const connection = () => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.log("Error while connecting to the database:", err);
        reject(err);
      } else {
        console.log("Successfully connected to the database. Connection ID:", connection.threadId,connection.config.database);
      
        resolve(connection);
      }
    });
  });
};


  module.exports={dbConfig,connection,pool,releaseConnectionPool,}




  
//   function setCookie(name, value, days) {
//     const expirationDate = new Date();
//     expirationDate.setDate(expirationDate.getDate() + days);
  
//     const cookieValue = encodeURIComponent(value) + "; expires=" + expirationDate.toUTCString() + "; path=/";
//     document.cookie = name + "=" + cookieValue;
//   }
  
//   setCookie("myCookie", "Hellobal, Cookie!", 7)


//   function getCookie(name) {
//     const cookieName = name + "=";
//     const cookieArray = document.cookie.split(";");
  
//     for (let i = 0; i < cookieArray.length; i++) {
//       let cookie = cookieArray[i];
//       while (cookie.charAt(0) === " ") {
//         cookie = cookie.substring(1);
//       }
//       if (cookie.indexOf(cookieName) === 0) {
//         return decodeURIComponent(cookie.substring(cookieName.length));
//       }
//     }
//     return null;
//   }
  
//   const myCookieValue = getCookie("myCookie");
//   console.log(myCookieValue);