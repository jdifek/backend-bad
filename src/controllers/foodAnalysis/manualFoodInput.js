const prisma = require('../../lib/prisma')

const manualFoodInput = async (req, res) => {
	try {
		const { telegramId, dish, calories, nutrients, suggestions } = req.body

		if (!telegramId || !dish || !calories || !nutrients) {
			return res.status(400).json({
				error: 'telegramId, dish, calories, and nutrients are required',
			})
		}

		const user = await prisma.user.upsert({
			where: { telegramId },
			update: {},
			create: { telegramId },
		})

		const foodAnalysis = await prisma.foodAnalysis.create({
			data: {
				userId: user.id,
				dish,
				calories,
				nutrients,
				suggestions: suggestions || 'Нет дополнительных рекомендаций.',
				questions: [],
				warnings:
					'Введенные данные могут быть неточными. Уточните состав блюда.',
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
