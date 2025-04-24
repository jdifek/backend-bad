const prisma = require('../../lib/prisma')
const { generateCourse } = require('../../services/aiService')

const updateCourse = async (req, res) => {
	try {
		const { telegramId, goal, supplements } = req.body

		if (!telegramId || !goal || !supplements) {
			return res
				.status(400)
				.json({ error: 'telegramId, goal, and supplements are required' })
		}

		const user = await prisma.user.findUnique({
			where: { telegramId },
		})

		if (!user) {
			return res.status(404).json({ error: 'User not found' })
		}

		const analysis = await generateCourse(goal, supplements)

		const course = await prisma.course.create({
			data: {
				userId: user.id,
				goal,
				supplements: analysis.supplements,
				duration: analysis.duration,
				suggestions: analysis.suggestions,
				warnings: analysis.warnings,
				questions: analysis.questions,
			},
		})

		res.json({
			message: 'Course updated successfully',
			course,
			disclaimer:
				'ИИ-нутрициолог не заменяет консультацию врача. Это рекомендации общего характера, основанные на открытых данных.',
		})
	} catch (error) {
		console.error('Error in updateCourse:', error.message, error.stack)
		res.status(500).json({ error: `Failed to update course: ${error.message}` })
	}
}

module.exports = { updateCourse }
