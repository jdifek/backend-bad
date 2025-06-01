const express = require('express')
const { getMyCourse } = require('../controllers/myCourse/getMyCourse')
const { markProgress } = require('../controllers/myCourse/markProgress')
const { updateCourse } = require('../controllers/myCourse/updateCourse')
const { getAllCourses } = require('../controllers/myCourse/getAllCourses')
const { deleteCourse } = require('../controllers/myCourse/deleteCourse')
const { upCourse } = require('../controllers/myCourse/upCourse')

const router = express.Router()

router.get('/', getMyCourse)
router.get('/all-courses', getAllCourses)
router.post('/progress', markProgress)
router.post('/update', updateCourse)
router.post('/up', upCourse)
router.delete('/delete', deleteCourse)


module.exports = router

