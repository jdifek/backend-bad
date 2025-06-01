const prisma = require('../../lib/prisma')
const { analyzeManualFoodInput } = require('../../services/aiService')

const manualFoodInput = async (req, res) => {
	try {
		const { telegramId, dish, grams, suggestions, type} = req.body

		if (!telegramId || !dish || !grams) {
			return res.status(400).json({
				error: 'telegramId, dish, and grams are required',
			})
		}

		const user = await prisma.user.upsert({
			where: { telegramId },
			update: {},
			create: { telegramId },
		})

		// Вызываем функцию для анализа блюда через OpenAI
		const analysis = await analyzeManualFoodInput(dish, grams)

		const foodAnalysis = await prisma.foodAnalysis.create({
			data: {
				userId: user.id,
				dish,
				calories: analysis.calories,
				nutrients: {
					protein: analysis.nutrients.protein,
					fats: analysis.nutrients.fats,
					carbs: analysis.nutrients.carbs,
				},
				suggestions: suggestions || analysis.suggestions || 'Нет дополнительных рекомендаций.',
				questions: analysis.questions || [],
				warnings: analysis.warnings || 'Введенные данные могут быть неточными. Уточните состав блюда.',
        type: type || 'Lunch', // Add type here

			},
		})

		res.json({
			message: 'Manual food analysis saved',
			foodAnalysis,
			disclaimer:
				'Персонализированные рекомендации ИИ-нутрициолога на основе открытых исследований и общих принципов. Не является медицинской услугой или диагнозом',
		})
	} catch (error) {
		console.error('Error in manualFoodInput:', error.message, error.stack)
		res
			.status(500)
			.json({ error: `Failed to save manual food analysis: ${error.message}` })
	}
}

module.exports = { manualFoodInput }