const prisma = require('../../lib/prisma')

const getAllCourses = async (req, res) => {
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

		const courses = await prisma.course.findMany({
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

		res.json({
			message: 'Courses retrieved successfully',
			courses,
			disclaimer:
				'ИИ-нутрициолог не заменяет консультацию врача. Это рекомендации общего характера, основанные на открытых данных.',
		})
	} catch (error) {
		console.error('Error in getAllCourses:', error.message, error.stack)
		res
			.status(500)
			.json({ error: `Failed to retrieve courses: ${error.message}` })
	}
}

module.exports = { getAllCourses }
