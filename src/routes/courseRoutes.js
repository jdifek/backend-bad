const express = require('express')
const multer = require('multer')
const { createCourses } = require('../controllers/course/createCourses')
const { getCourses } = require('../controllers/course/getCourses.js')
const { addSupplement } = require('../controllers/course/addSupplement.js')
const { trackGoalAnalytics } = require('../controllers/course/trackGoalAnalytics.js')

const upload = multer({ storage: multer.memoryStorage() })

const router = express.Router()

router.post('/', createCourses)
router.get('/:telegramId', getCourses)
router.post('/supplements', upload.single('photo'), addSupplement)
router.post('/analytics/goals', trackGoalAnalytics)

module.exports = router
