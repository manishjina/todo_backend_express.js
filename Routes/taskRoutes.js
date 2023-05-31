const express=require("express");
const { handleGetTasks, handleDeleteSubtask, handleUpdateSubtask, handleDeleteTask, handleUpdateTask, handelAddSubTask } = require("../RouterController/taskController");
const taskRouter=express.Router();


taskRouter.get("/alltask/:userId",handleGetTasks)
taskRouter.post('/addsubtask/:id',handelAddSubTask)
taskRouter.delete("/deletesubtask/:taskId/:maintaskId",handleDeleteSubtask)
taskRouter.patch("/updatesubtask/:taskId/:maintaskId",handleUpdateSubtask)
taskRouter.delete("/deletetask/:userId/:taskId",handleDeleteTask)
taskRouter.patch("/updatetask/:userId/:taskId",handleUpdateTask)

module.exports={taskRouter}