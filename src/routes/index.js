const courseRouter = require('./courseRoutes')
const analysisRouter = require('./analysisRoutes')
const foodAnalysisRouter = require('./foodAnalysisRoutes')
const reminderRouter = require('./reminderRoutes')
const myCourseRouter = require('./myCourseRoutes')
const authRouter = require('./authRoutes')
const mealRouter = require('./mealRouter')

module.exports = {
	courseRouter,
	analysisRouter,
	foodAnalysisRouter,
	reminderRouter,
	myCourseRouter,
  mealRouter,
	authRouter,
}
