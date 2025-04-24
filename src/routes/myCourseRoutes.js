const express = require('express')
const { getMyCourse } = require('../controllers/myCourse/getMyCourse')
const { markProgress } = require('../controllers/myCourse/markProgress')
const { updateCourse } = require('../controllers/myCourse/updateCourse')
const { getAllCourses } = require('../controllers/myCourse/getAllCourses')

const router = express.Router()

router.get('/', getMyCourse)
router.get('/all-courses', getAllCourses)
router.post('/progress', markProgress)
router.post('/update', updateCourse)

module.exports = router
