const cron = require("node-cron");
const { connection } = require("../db/db");

cron.schedule('0 9 * * *', () => {
  // Get the tasks from the database that match the condition for sending email notifications
  const query = `SELECT * FROM tasks WHERE status = 0 AND deadline <= NOW() + INTERVAL 2 DAY`;
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching tasks from the database:', error);
      return;
    }

    // Iterate over the fetched tasks and send email notifications
    results.forEach((task) => {
      // Extract task data
      const { status, description, start_time, deadline, email, title } = task;

      // Calculate the percentage of time remaining
      const currentTime = new Date();
      const startTime = new Date(start_time);
      const remainingTime = deadline - currentTime;
      const totalTime = deadline - startTime;
      const percentageRemaining = (remainingTime / totalTime) * 100;

      // Check if the time remaining is at least 80%
      if (percentageRemaining >= 80) {
        // Call your sendmail function to send the email
        sendMail({
          status,
          description,
          start_time,
          deadline,
          email,
          title,
        })
          .then(() => {
            console.log('Email sent successfully:', task);
          })
          .catch((error) => {
            console.error('Error sending email:', error);
          });
      }
    });
  });
});
