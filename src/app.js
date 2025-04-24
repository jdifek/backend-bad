const express = require('express')
const cors = require('cors')
const {
	courseRouter,
	analysisRouter,
	foodAnalysisRouter,
	reminderRouter,
	myCourseRouter,
} = require('./routes')

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/courses', courseRouter)
app.use('/api/analyses', analysisRouter)
app.use('/api/food-analysis', foodAnalysisRouter)
app.use('/api/reminders', reminderRouter)
app.use('/api/my-course', myCourseRouter)

module.exports = app
