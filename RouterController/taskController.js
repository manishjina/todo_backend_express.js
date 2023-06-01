const { dbConfig } = require("../db/db");
const jwt = require("jsonwebtoken");
const mysql = require("mysql");


//adding a subtask :-
const handelAddSubTask = async (req, res) => {
  try {
    const main_task_id = req.params.id;
    const { sub_task, status,custom_status="",color_code="" } = req.body;
    const token = req.headers.authorization;

    const result = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.secret_key, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });
  
    const dbName = `tenant_${result.org_id || result.uuid}`;
    const userDbConfig = {
      ...dbConfig,
      database: dbName,
    };
    const pool1 = mysql.createPool(userDbConfig);

    const checkQ = "SELECT id FROM todo WHERE id=?";
    pool1.query(checkQ, [main_task_id], (err, result) => {
      if (err) {
        return res.status(301).send({ "err": err });
      } else if (result.length === 0) {
        res.send({ "no_main_id": "no main task found" });
      } else {
        const subtaskQ =
          "INSERT INTO subtask (main_task_id, sub_task, status, color_code, custom_status) VALUES (?, ?, ?, ?, ?)";
  
        const values = [main_task_id, sub_task, status || 0,color_code, custom_status];
  
        pool1.query(subtaskQ, values, (err, result) => {
          if (err) {
            return res.status(301).send({ "err": "cannot post subtask" .err});
          } else {
            console.log('subtask inserted successfully');
            res.send({ "message": "sub task added successfully",data:{...req.body,subtask_id:result.insertId} });
          }
        });
      }
    });
  } catch (error) {
    console.log(error);
    return res
      .status(401)
      .send({ error: `error while adding the task ${error}` });
  }
};



// Get all tasks with their associated subtasks
const handleGetTasks = (req, res) => {
    const token = req.headers.authorization;
    const email = req.headers.email;
    try {
      jwt.verify(token, process.env.secret_key, (err, result) => {
        if (err) {
          return res.status(401).send({ error: "Cannot process the request", err });
        }
  
        const dbName = `tenant_${result.org_id || result.uuid}`;
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
  
          const userQuery = `SELECT id from user WHERE email = ?`;
          connection.query(userQuery, [email], (error, result1) => {
            if (error) {
              console.error("Error retrieving user:", error);
              return res
                .status(500)
                .json({ success: false, message: "Failed to retrieve user" });
            }
            const userId = result1[0].id;
            console.log(userId);
  
            const query = `
              SELECT t.id, t.title, t.description, s.subtask_id, s.sub_task, s.status, s.color_code, s.custom_status
              FROM todo AS t
              LEFT JOIN subtask AS s ON t.id = s.main_task_id
              WHERE t.user_id = ?
            `;
  
            connection.query(query, [userId], (error, results) => {
              if (error) {
                console.error("Error retrieving tasks:", error);
                return res
                  .status(500)
                  .json({ success: false, message: "Failed to retrieve tasks" });
              }
  
              const tasks = [];
              results.forEach((row) => {
                const {
                  id,
                  title,
                  description,
                  subtask_id,
                  sub_task,
                  status,
                  color_code,
                  custom_status,
                } = row;
                let task = tasks.find((task) => task.id === id);
                if (!task) {
                  task = {
                    id,
                    title,
                    description,
                    subtasks: [],
                  };
                  tasks.push(task);
                }
                if (subtask_id) {
                  task.subtasks.push({
                    subtask_id,
                    sub_task,
                    status,
                    color_code: color_code || 'default_color',
                    custom_status: custom_status || 'custom_status',
                  });
                }
              });
  
              return res
                .status(200)
                .json({ message: "Tasks retrieved successfully", tasks });
            });
          });
        });
      });
    } catch (err) {
      return res.status(401).json({ error: "Something went wrong", err });
    }
  };
  


const handleDeleteTask = (req, res) => {
    const { userId, taskId } = req.params;
    const token = req.headers.authorization;
  
    try {
      jwt.verify(token, process.env.secret_key, (err, result) => {
        if (err) {
          return res.status(401).send({ error: "cannot process req", err });
        }
  
        const dbName = `tenant_${result.org_id || result.uuid}`;
        const userDbConfig = {
          ...dbConfig,
          database: dbName,
        };
        const pool1 = mysql.createPool(userDbConfig);
  
        pool1.getConnection((error, connection) => {
          if (error) {
            return res
              .status(401)
              .send({ error: "error while connecting to db", error });
          }
  
          connection.beginTransaction((transactionErr) => {
            if (transactionErr) {
              console.error("Error starting transaction:", transactionErr);
              return res.status(500).json({ message: "Failed to delete task" });
            }
  
            const deleteSubtasksQuery =
              "DELETE FROM subtasks WHERE main_task_id = ?";
            connection.query(deleteSubtasksQuery, [taskId], (subtasksError) => {
              if (subtasksError) {
                connection.rollback(() => {
                  console.error("Error deleting subtasks:", subtasksError);
                  return res.status(500).json({ message: "Failed to delete task" });
                });
              }
  
              const deleteTaskQuery = "DELETE FROM todo WHERE user_id = ? AND task_id = ?";
              connection.query(deleteTaskQuery, [userId, taskId], (taskError, result) => {
                if (taskError) {
                  connection.rollback(() => {
                    console.error("Error deleting task:", taskError);
                    return res.status(500).json({ message: "Failed to delete task" });
                  });
                }
  
                connection.commit((commitErr) => {
                  if (commitErr) {
                    connection.rollback(() => {
                      console.error("Error committing transaction:", commitErr);
                      return res.status(500).json({ message: "Failed to delete task" });
                    });
                  }
  
                  connection.release();
  
                  if (result.affectedRows === 0) {
                    return res.status(404).json({ message: "Task not found" });
                  }
  
                  res.status(200).json({ message: "Task and subtasks deleted successfully" });
                });
              });
            });
          });
        });
      });
    } catch (err) {
      res.status(401).json({ error: "Something went wrong", err });
    }
  };
  

  const handleUpdateTask = (req, res) => {
    const { userId, taskId } = req.params;
    const { title, description } = req.body;
    const token = req.headers.authorization;
  
    const dbName = `tenant_${result.org_id || result.uuid}`;
    const userDbConfig = {
      ...dbConfig,
      database: dbName,
    };
    const pool1 = mysql.createPool(userDbConfig);
  
    try {
      jwt.verify(token, process.env.secret_key, (err, result) => {
        if (err) {
          return res.status(401).send({ error: "cannot process req", err });
        }
  
        pool1.getConnection((error, connection) => {
          if (error) {
            return res
              .status(401)
              .send({ error: "error while connecting to db", error });
          }
  
          const updateTaskQuery =
            "UPDATE todo SET title = ?, description = ? WHERE user_id = ? AND id = ?";
          connection.query(
            updateTaskQuery,
            [title, description, userId, taskId],
            (error, result) => {
              connection.release();
  
              if (error) {
                console.error("Error updating task:", error);
                return res.status(500).json({ message: "Failed to update task" });
              }
  
              if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Task not found" });
              }
  
              return res.status(200).json({ message: "Task updated successfully" });
            }
          );
        });
      });
    } catch (err) {
      return res.status(401).json({ error: "Something went wrong", err });
    }
  };
  

const handleDeleteSubtask = (req, res) => {
  const { maintaskId, taskId } = req.params;
  const token = req.headers.authorization;
  try {
    jwt.verify(token, process.env.secret_key, (err, result) => {
      if (err) {
        return res.status(401).send({ error: "cannot process req", err });
      }

      const dbName = `tenant_${result.org_id || result.uuid}`;
      const userDbConfig = {
        ...dbConfig,
        database: dbName,
      };
      const pool1 = mysql.createPool(userDbConfig);

      pool1.getConnection((error, connection) => {
        if (error) {
          return res
            .status(401)
            .send({ error: "error while connecting to db", error });
        }

        const deleteSubtaskQuery =
          "DELETE FROM subtask WHERE main_task_id AND subtask_id = ?";
        connection.query(
          deleteSubtaskQuery,
          [maintaskId, taskId],
          (error, result) => {
            connection.release();

            if (error) {
              console.error("Error deleting subtask:", error);
              return res
                .status(500)
                .json({ message: "Failed to delete subtask" });
            }

            if (result.affectedRows === 0) {
              return res.status(404).json({ message: "Subtask not found" });
            }

            res.status(200).json({ message: "Subtask deleted successfully" });
          }
        );
      });
    });
  } catch (err) {
    res.status(401).json({ error: "Something went wrong", err });
  }
};

const handleUpdateSubtask = (req, res) => {
  const { maintaskId, taskId } = req.params;
  const { sub_task, status, color_code, custom_status } = req.body;
  const token = req.headers.authorization;

  try {
    jwt.verify(token, process.env.secret_key, (err, result) => {
      if (err) {
        return res.status(401).send({ error: "cannot process req", err });
      }

      const dbName = `tenant_${result.org_id || result.uuid}`;
      const userDbConfig = {
        ...dbConfig,
        database: dbName,
      };
      const pool1 = mysql.createPool(userDbConfig);

      pool1.getConnection((error, connection) => {
        if (error) {
          return res
            .status(401)
            .send({ error: "error while connecting to db", error });
        }

        const updateSubtaskQuery ="UPDATE subtask SET sub_task = ?, color_code = ?, custom_status = ?, status = ? WHERE main_task_id = ? AND subtask_id = ?";
        connection.query(
          updateSubtaskQuery,
          [sub_task, color_code, custom_status, status, maintaskId, taskId],
          (error, result) => {
            connection.release();

            if (error) {
              console.error("Error updating subtask:", error);
              return res
                .status(500)
                .json({ message: "Failed to update subtask" });
            }

            if (result.affectedRows === 0) {
              return res.status(404).json({ message: "Subtask not found" });
            }

            return res.status(200).json({ message: "Subtask updated successfully",data:{...req.body,subtask_id:result} });
          }
        );
      });
    });
  } catch (err) {
    res.status(401).json({ error: "Something went wrong", err });
  }
};



module.exports = {
  handleUpdateSubtask,
  handleDeleteSubtask,
  handleDeleteTask,
  handleUpdateTask,
  // handleCreateTask,
  // handleCreateSubtask,
  handelAddSubTask,
  handleGetTasks,
};
