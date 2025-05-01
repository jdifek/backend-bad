const prisma = require('../../lib/prisma')
const { createClient } = require('@supabase/supabase-js')
const { recognizeSupplementPhoto } = require('../../services/aiService')

const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_ANON_KEY
)

const addSupplement = async (req, res) => {
	try {
		const { telegramId, name } = req.body
		const file = req.file

		if (!telegramId) {
			return res.status(400).json({ error: 'telegramId is required' })
		}

		const user = await prisma.user.upsert({
			where: { telegramId },
			update: {},
			create: { telegramId },
		})

		let supplementName = name
		let photoUrl = null

		if (file) {
			console.log('Uploading file to Supabase:', file.originalname)
			const fileName = `${user.id}/${Date.now()}.jpg`
			const { error } = await supabase.storage
				.from('supplements-photo')
				.upload(fileName, file.buffer, { contentType: 'image/jpeg' })
			if (error) {
				console.error('Supabase upload error:', error.message)
				throw error
			}

			const { data } = supabase.storage
				.from('supplements-photos')
				.getPublicUrl(fileName)
			photoUrl = data.publicUrl
			console.log('File uploaded, public URL:', photoUrl)

			console.log('Calling GPT-4 Vision for text detection')
			supplementName = await recognizeSupplementPhoto(photoUrl)
			console.log('Recognized supplement name:', supplementName)
		}

		if (!supplementName) {
			return res
				.status(400)
				.json({ error: 'Supplement name or photo required' })
		}

		const supplement = await prisma.supplement.create({
			data: {
				userId: user.id,
				name: supplementName,
				photoUrl,
			},
		})

		res.json({
			message: 'Supplement added',
			supplement,
		})
	} catch (err) {
		console.error('Error in addSupplement:', err.message, err.stack)
		res.status(500).json({ error: `Failed to add supplement: ${err.message}` })
	}
}

module.exports = { addSupplement }
