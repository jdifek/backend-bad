const express = require('express')
const { login } = require('../controllers/auth/login')
const { refresh } = require('../controllers/auth/refresh')
const authMiddleware = require('../middleware/authMiddleware')
const { getMe } = require('../controllers/auth/getMe')
const { addQR } = require('../controllers/auth/addQR')
const { redeemQR } = require('../controllers/auth/redeemQR')
const { bulkQR } = require('../controllers/auth/bulkQR')

const router = express.Router()

router.post('/login', login)
router.post('/refresh', refresh)
router.get('/me', authMiddleware, getMe)
router.post('/add-qr', addQR); // Только для админов
router.post('/redeem-qr', redeemQR);
router.post('/bulk-qr', bulkQR); // New endpoint for bulk QR codes

module.exports = router
