const prisma = require('../../lib/prisma')
const { createReminder } = require('../../services/reminderService')
const { generateCourse } = require('../../services/aiService')

const createCourses = async (req, res) => {
	try {
		const { telegramId, goal, supplements } = req.body

		const user = await prisma.user.upsert({
			where: { telegramId },
			update: {},
			create: { telegramId },
		})

		const courseData = await generateCourse(goal, supplements)
		const course = await prisma.course.create({
			data: {
				userId: user.id,
				goal,
				supplements: courseData.supplements,
				schedule: courseData.schedule,
				isPremium: false,
			},
		})

		await createReminder(course.id, user.id, courseData.schedule)

		res.json({
			message: 'Course created',
			course,
			disclaimer:
				'ИИ-нутрициолог не заменяет консультацию врача. Это рекомендации общего характера, основанные на открытых данных.',
		})
	} catch (err) {
		res.status(500).json({ err: 'Failed to create course' })
	}
}

module.exports = { createCourses }
