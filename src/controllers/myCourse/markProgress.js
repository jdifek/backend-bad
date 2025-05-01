const prisma = require('../../lib/prisma')

const markProgress = async (req, res) => {
	try {
		const { telegramId, courseId, supplement, date, status } = req.body

		if (!telegramId || !courseId || !supplement || !date || !status) {
			return res.status(400).json({
				error:
					'telegramId, courseId, supplement, date, and status are required',
			})
		}
		if (!['TAKEN', 'SKIPPED'].includes(status)) {
			return res
				.status(400)
				.json({ error: 'Invalid status. Use TAKEN or SKIPPED' })
		}

		const user = await prisma.user.findUnique({
			where: { telegramId },
		})

		if (!user) {
			return res.status(404).json({ error: 'User not found' })
		}

		const course = await prisma.course.findUnique({
			where: { id: courseId },
		})

		if (!course) {
			return res.status(404).json({ error: 'Course not found' })
		}

		const progress = await prisma.progress.upsert({
			where: {
				userId_courseId_supplement_date: {
					userId: user.id,
					courseId,
					supplement,
					date: new Date(date),
				},
			},
			update: {
				status,
				updatedAt: new Date(),
			},
			create: {
				userId: user.id,
				courseId,
				supplement,
				date: new Date(date),
				status,
			},
		})

		res.json({
			message: 'Progress marked successfully',
			progress,
			disclaimer:
				'Персонализированные рекомендации ИИ-нутрициолога на основе открытых исследований и общих принципов. Не является медицинской услугой или диагнозом',
		})
	} catch (error) {
		console.error('Error in markProgress:', error.message, error.stack)
		res.status(500).json({ error: `Failed to mark progress: ${error.message}` })
	}
}

module.exports = { markProgress }
