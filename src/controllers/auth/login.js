const jwt = require('jsonwebtoken')
const prisma = require('../../lib/prisma')

const generateTokens = user => {
	const accessToken = jwt.sign(
		{ telegramId: user.telegramId, name: user.name || 'User' },
		process.env.JWT_SECRET,
		{ expiresIn: '15m' }
	)
	const refreshToken = jwt.sign(
		{ telegramId: user.telegramId },
		process.env.JWT_SECRET,
		{ expiresIn: '7d' }
	)
	return { accessToken, refreshToken }
}

const login = async (req, res) => {
	try {
		const { telegramId, name, photoUrl } = req.body

		if (!telegramId) {
			return res.status(400).json({ error: 'telegramId is required' })
		}

		let user = await prisma.user.findUnique({
			where: { telegramId },
		})

		if (!user) {
			user = await prisma.user.create({
				data: {
					telegramId,
					name: name || 'User',
					accessToken: null,
					refreshToken: null,
				},
			})
		}

		const { accessToken, refreshToken } = generateTokens(user)

		await prisma.user.update({
			where: { telegramId },
			data: {
				name: name || user.name || 'User',
				photoUrl: photoUrl || user.photoUrl,
				accessToken,
				refreshToken,
			},
		})

		res.json({
			message: 'Login successful',
			user: {
				telegramId,
				name: name || user.name || 'User',
				photoUrl: user.photoUrl,
			},
			accessToken,
			refreshToken,
		})
	} catch (error) {
		console.error('Error in login:', error.message, error.stack)
		res.status(500).json({ error: `Failed to login: ${error.message}` })
	}
}

module.exports = { login }
