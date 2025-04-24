const prisma = require('../../lib/prisma')

const getMyCourse = async (req, res) => {
	try {
		const { telegramId } = req.query

		if (!telegramId) {
			return res.status(400).json({ error: 'telegramId is required' })
		}

		const user = await prisma.user.findUnique({
			where: { telegramId },
		})

		if (!user) {
			return res.status(404).json({ error: 'User not found' })
		}

		const course = await prisma.course.findFirst({
			where: { userId: user.id },
			orderBy: { createdAt: 'desc' },
			include: {
				progress: {
					orderBy: { date: 'asc' },
				},
				reminders: true,
				surveys: true,
			},
		})

		if (!course) {
			return res.status(404).json({ error: 'No course found for this user' })
		}

		res.json({
			message: 'Course retrieved successfully',
			course,
			disclaimer:
				'ИИ-нутрициолог не заменяет консультацию врача. Это рекомендации общего характера, основанные на открытых данных.',
		})
	} catch (error) {
		console.error('Error in getMyCourse:', error.message, error.stack)
		res
			.status(500)
			.json({ error: `Failed to retrieve course: ${error.message}` })
	}
}

module.exports = { getMyCourse }
