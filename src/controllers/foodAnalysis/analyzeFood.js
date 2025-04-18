const prisma = require('../../lib/prisma')
const { analyzeFoodPhoto } = require('../../services/aiService')

const analyzeFood = async (req, res) => {
	try {
		const { telegramId, photoUrl } = req.body

		const user = await prisma.user.upsert({
			where: { telegramId },
			update: {},
			create: { telegramId },
		})

		const analysis = await analyzeFoodPhoto(photoUrl)
		const foodAnalysis = await prisma.foodAnalysis.create({
			data: {
				userId: user.id,
				photoUrl,
				calories: analysis.calories,
				nutrients: analysis.nutrients,
				suggestions: analysis.suggestions,
			},
		})

		res.json({
			message: 'Food analysis completed',
			foodAnalysis,
			disclaimer:
				'ИИ-нутрициолог не заменяет консультацию врача. Это рекомендации общего характера, основанные на открытых данных.',
		})
	} catch (err) {
		res.status(500).json({ err: 'Failed to analyze food' })
	}
}

module.exports = { analyzeFood }
