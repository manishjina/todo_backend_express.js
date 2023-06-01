const express=require("express");
const { handleGetTasks, handleDeleteSubtask, handleUpdateSubtask, handleDeleteTask, handleUpdateTask, handelAddSubTask } = require("../RouterController/taskController");
const taskRouter=express.Router();


taskRouter.get("/alltask",handleGetTasks)
taskRouter.post('/addsubtask/:id',handelAddSubTask)
taskRouter.delete("/deletesubtask/:maintaskId/:taskId",handleDeleteSubtask)
taskRouter.patch("/updatesubtask/:maintaskId/:taskId",handleUpdateSubtask)
taskRouter.delete("/deletetask/:userId/:taskId",handleDeleteTask)

module.exports={taskRouter}