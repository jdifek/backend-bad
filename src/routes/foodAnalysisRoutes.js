const express = require('express')
const { analyzeFood } = require('../controllers/foodAnalysis/analyzeFood')

const router = express.Router()

router.post('/', analyzeFood)

module.exports = router
