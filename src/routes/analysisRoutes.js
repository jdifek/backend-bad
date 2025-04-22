const express = require('express')
const multer = require('multer')
const {
	createAnalysisCourse,
} = require('../controllers/analysis/createAnalysisCourse')

const upload = multer({ storage: multer.memoryStorage() })

const router = express.Router()

router.post('/', upload.single('photo'), createAnalysisCourse)

module.exports = router
