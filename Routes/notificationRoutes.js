const express = require('express');
const { handleGetAllNotifications, handlePostNotification } = require('../RouterController/notificationController');
const notificationRouter=express.Router()



notificationRouter.get("/allnotification",handleGetAllNotifications)
notificationRouter.post("/postnotification",handlePostNotification)

module.exports={notificationRouter}