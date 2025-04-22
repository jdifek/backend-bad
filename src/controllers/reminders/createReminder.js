const prisma = require('../../lib/prisma')
const {
	createReminder: createReminderService,
} = require('../../services/reminderService')

const createReminder = async (req, res) => {
	try {
		const { telegramId, courseId, type, message } = req.body

		if (!telegramId || !courseId || !type || !message) {
			return res
				.status(400)
				.json({ error: 'telegramId, courseId, type, and message are required' })
		}

		const user = await prisma.user.findUnique({ where: { telegramId } })
		if (!user) {
			return res.status(404).json({ error: 'User not found' })
		}

		const course = await prisma.course.findUnique({ where: { id: courseId } })
		if (!course) {
			return res.status(404).json({ error: 'Course not found' })
		}

		let reminderData
		if (type === 'ANALYSIS') {
			reminderData = { analysisReminder: message }
		} else if (type === 'SURVEY') {
			reminderData = { survey: { message } }
		} else {
			return res.status(400).json({ error: 'Invalid reminder type' })
		}

		await createReminderService(courseId, user.id, reminderData)

		res.json({ message: 'Reminder created successfully' })
	} catch (error) {
		console.error('Error in createReminder:', error.message, error.stack)
		res
			.status(500)
			.json({ error: `Failed to create reminder: ${error.message}` })
	}
}

module.exports = { createReminder }
