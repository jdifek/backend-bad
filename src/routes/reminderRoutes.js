const express = require('express')
const { createReminder } = require('../controllers/reminders/createReminder')

const router = express.Router()

router.post('/', createReminder)

module.exports = router
