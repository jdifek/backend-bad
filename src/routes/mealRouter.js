const express = require('express');
const { saveMeal, getUserMeals, updateUserGoal, deleteMeal } = require('../controllers/mealCotrollers.js');

const router = express.Router();

router.post('/meals', saveMeal);
router.get('/user/:telegramId/meals', getUserMeals);
router.put('/user/:telegramId', updateUserGoal);
router.delete('/:mealId', deleteMeal);
module.exports = router;