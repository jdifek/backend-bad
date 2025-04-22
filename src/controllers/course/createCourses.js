const prisma = require('../../lib/prisma')
const { createReminder } = require('../../services/reminderService')
const { generateCourse } = require('../../services/aiService')

const createCourses = async (req, res) => {
	try {
		const { telegramId, goal } = req.body

		const user = await prisma.user.upsert({
			where: { telegramId },
			update: {},
			create: { telegramId },
		})

		// Получаем добавки пользователя
		const supplements = await prisma.supplement.findMany({
			where: { userId: user.id },
			select: { name: true },
		})

		if (!supplements.length) {
			return res
				.status(400)
				.json({ error: 'At least one supplement is required' })
		}

		const courseData = await generateCourse(
			goal,
			supplements.map(s => s.name)
		)
		const course = await prisma.course.create({
			data: {
				userId: user.id,
				goal,
				supplements: courseData.supplements,
				schedule: {
					morning: courseData.supplements
						.filter(s => s.time === 'утро')
						.map(s => s.name),
					afternoon: courseData.supplements
						.filter(s => s.time === 'день')
						.map(s => s.name),
					evening: courseData.supplements
						.filter(s => s.time === 'вечер')
						.map(s => s.name),
				},
				isPremium: false,
			},
		})

		await createReminder(course.id, user.id, course.schedule)

		res.json({
			message: 'Course created',
			course,
			suggestions: courseData.suggestions,
			warnings: courseData.warnings,
			questions: courseData.questions,
			disclaimer:
				'ИИ-нутрициолог не заменяет консультацию врача. Это рекомендации общего характера, основанные на открытых данных.',
		})
	} catch (err) {
		console.error('Error in createCourses:', err)
		res.status(500).json({ err: 'Failed to create course' })
	}
}

module.exports = { createCourses }
