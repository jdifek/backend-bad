const express = require('express')
const cors = require('cors')
const {
	courseRouter,
	analysisRouter,
	foodAnalysisRouter,
	reminderRouter,
	myCourseRouter,
	authRouter,
  mealRouter
} = require('./routes')
const { saveCaloriesBurned, getCaloriesBurned } = require('./controllers/caloriesBurnedController.js');

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/courses', courseRouter)
app.use('/api/analyses', analysisRouter)
app.use('/api/food-analysis', foodAnalysisRouter)
app.use('/api/reminders', reminderRouter)
app.use('/api/my-course', myCourseRouter)
app.use('/api/auth', authRouter)
app.use('/api/meals', mealRouter)

// 📌 Прямо здесь
app.post('/api/calories-burned', saveCaloriesBurned);
app.get('/api/user/:telegramId/calories-burned/:date', getCaloriesBurned);

module.exports = app
