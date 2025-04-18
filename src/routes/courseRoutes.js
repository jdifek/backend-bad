const express = require('express')
const { createCourses } = require('../controllers/course/createCourses')
const { getCourses } = require('../controllers/course/getCourses.js')

const router = express.Router()

router.post('/', createCourses)
router.get('/:telegramId', getCourses)

module.exports = router
