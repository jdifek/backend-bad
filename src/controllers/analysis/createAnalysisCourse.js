const prisma = require('../../lib/prisma')
const { createReminder } = require('../../services/reminderService')
const { generateAnalysisCourse } = require('../../services/aiService')

const createAnalysisCourse = async (req, res) => {
	try {
		const { telegramId, goal, analysisPhotoUrl, checklist } = req.body

		const user = await prisma.user.upsert({
			where: { telegramId },
			update: {},
			create: { telegramId },
		})

		// Проверка подписки тестовая
		const hasSubscription = true // TODO: Проверить подписку
		if (!hasSubscription) {
			return res.status(403).json({ error: 'Subscription required' })
		}

		const courseData = await generateAnalysisCourse(
			goal,
			analysisPhotoUrl,
			checklist
		)
		const course = await prisma.course.create({
			data: {
				userId: user.id,
				goal,
				supplements: courseData.supplements,
				schedule: courseData.schedule,
				isPremium: true,
			},
		})

		await createReminder(course.id, user.id, courseData.schedule)
		await createReminder(course.id, user.id, {
			analysisReminder: 'Через 8 недель сдать анализы',
		})

		res.json({
			message: 'Analysis course created',
			course,
			disclaimer:
				'ИИ-нутрициолог не заменяет консультацию врача. Это рекомендации общего характера, основанные на открытых данных.',
		})
	} catch (error) {
		console.error('Error in createAnalysisCourse:', error)
		res.status(500).json({ error: 'Failed to create analysis course' })
	}
}

module.exports = { createAnalysisCourse }
