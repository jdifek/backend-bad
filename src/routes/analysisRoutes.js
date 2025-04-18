const express = require('express')
const {
	createAnalysisCourse,
} = require('../controllers/analysis/createAnalysisCourse')

const router = express.Router()

router.post('/', createAnalysisCourse)

module.exports = router
