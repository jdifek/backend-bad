const express = require('express')
const { courseRouter, analysisRouter, foodAnalysisRouter } = require('./routes')

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/courses', courseRouter)
app.use('/api/analyses', analysisRouter)
app.use('/api/food', foodAnalysisRouter)

module.exports = app
