const express = require('express')
const { login } = require('../controllers/auth/login')
const { refresh } = require('../controllers/auth/refresh')
const authMiddleware = require('../middleware/authMiddleware')
const { getMe } = require('../controllers/auth/getMe')

const router = express.Router()

router.post('/login', login)
router.post('/refresh', refresh)
router.get('/me', authMiddleware, getMe)

module.exports = router
