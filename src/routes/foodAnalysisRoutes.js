const express = require('express')
const multer = require('multer')
const { analyzeFood } = require('../controllers/foodAnalysis/analyzeFood')
const {
	manualFoodInput,
} = require('../controllers/foodAnalysis/manualFoodInput')

const upload = multer({ storage: multer.memoryStorage() })

const router = express.Router()

router.post('/photo', upload.single('photo'), analyzeFood)
router.post('/manual', manualFoodInput)

module.exports = router
