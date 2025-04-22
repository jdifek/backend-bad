const prisma = require('../../lib/prisma')
const { createClient } = require('@supabase/supabase-js')
const { createReminder } = require('../../services/reminderService')
const { generateAnalysisCourse } = require('../../services/aiService')

const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_ANON_KEY
)

const createAnalysisCourse = async (req, res) => {
	try {
		const { telegramId, goal, checklist } = req.body
		const file = req.file

		if (!telegramId || !goal || !checklist) {
			return res
				.status(400)
				.json({ error: 'telegramId, goal, and checklist are required' })
		}

		const user = await prisma.user.upsert({
			where: { telegramId },
			update: {},
			create: { telegramId },
		})

		// Проверка подписки (заглушка)
		const hasSubscription = true // TODO: Реализовать проверку подписки
		if (!hasSubscription) {
			return res.status(403).json({ error: 'Subscription required' })
		}

		let photoUrl = null
		if (file) {
			console.log('Uploading analysis photo to Supabase:', file.originalname)
			const fileName = `${user.id}/analysis_${Date.now()}.jpg`
			const { error } = await supabase.storage
				.from('analysis-photos')
				.upload(fileName, file.buffer, { contentType: 'image/jpeg' })
			if (error) {
				console.error('Supabase upload error:', error.message)
				throw error
			}

			const { data } = supabase.storage
				.from('analysis-photos')
				.getPublicUrl(fileName)
			photoUrl = data.publicUrl
			console.log('Analysis photo uploaded, public URL:', photoUrl)
		}

		const courseData = await generateAnalysisCourse(goal, photoUrl, checklist)

		const course = await prisma.course.create({
			data: {
				userId: user.id,
				goal,
				supplements: courseData.supplements,
				schedule: {
					morning: courseData.supplements
						.filter(s => s.time.toLowerCase() === 'утро')
						.map(s => s.name),
					afternoon: courseData.supplements
						.filter(s => s.time.toLowerCase() === 'день')
						.map(s => s.name),
					evening: courseData.supplements
						.filter(s => s.time.toLowerCase() === 'вечер')
						.map(s => s.name),
				},
				duration: courseData.duration,
				isPremium: true,
			},
		})

		// Создание напоминаний
		await createReminder(course.id, user.id, {
			...courseData.schedule,
			analysisReminder: courseData.repeatAnalysis,
			survey: {
				message:
					'Как ты себя сегодня чувствуешь? Это поможет уточнить твой курс.',
			},
		})

		res.json({
			message: 'Analysis course created',
			course,
			suggestions: courseData.suggestions,
			warnings: courseData.warnings,
			questions: courseData.questions,
			repeatAnalysis: courseData.repeatAnalysis,
			disclaimer:
				'ИИ-нутрициолог не заменяет консультацию врача. Это рекомендации общего характера, основанные на открытых данных.',
		})
	} catch (error) {
		console.error('Error in createAnalysisCourse:', error.message, error.stack)
		res
			.status(500)
			.json({ error: `Failed to create analysis course: ${error.message}` })
	}
}

module.exports = { createAnalysisCourse }
