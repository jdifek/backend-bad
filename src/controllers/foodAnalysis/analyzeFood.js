const prisma = require('../../lib/prisma')
const { createClient } = require('@supabase/supabase-js')
const { analyzeFoodPhoto } = require('../../services/aiService')

const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_ANON_KEY
)

const analyzeFood = async (req, res) => {
	try {
		const { telegramId } = req.body
		const file = req.file

		console.log('Request body:', req.body)
		console.log('File received:', file ? file.originalname : 'No file')

		if (!telegramId) {
			return res.status(400).json({ error: 'telegramId is required' })
		}

		if (!file) {
			return res.status(400).json({ error: 'Photo is required' })
		}

		const user = await prisma.user.upsert({
			where: { telegramId },
			update: {},
			create: { telegramId },
		})

		let photoUrl = null
		console.log('Uploading food photo to Supabase:', file.originalname)
		const fileName = `${user.id}/food_${Date.now()}.jpg`
		const { error: uploadError } = await supabase.storage
			.from('food-photos')
			.upload(fileName, file.buffer, { contentType: 'image/jpeg' })

		if (uploadError) {
			console.error('Supabase upload error:', uploadError.message, uploadError)
			throw new Error(`Supabase upload failed: ${uploadError.message}`)
		}

		const { data } = supabase.storage.from('food-photos').getPublicUrl(fileName)
		photoUrl = data.publicUrl
		console.log('Food photo uploaded, public URL:', photoUrl)

		const analysis = await analyzeFoodPhoto(photoUrl)

		const foodAnalysis = await prisma.foodAnalysis.create({
			data: {
				userId: user.id,
				photoUrl,
				dish: analysis.dish,
				calories: analysis.calories,
				nutrients: analysis.nutrients,
				suggestions: analysis.suggestions,
				questions: analysis.questions,
				warnings: analysis.warnings,
			},
		})

		res.json({
			message: 'Food analysis completed',
			foodAnalysis,
			disclaimer:
				'ИИ-нутрициолог не заменяет консультацию врача. Это рекомендации общего характера, основанные на открытых данных.',
		})
	} catch (error) {
		console.error('Error in analyzeFood:', error.message, error.stack)
		res.status(500).json({ error: `Failed to analyze food: ${error.message}` })
	}
}

module.exports = { analyzeFood }
