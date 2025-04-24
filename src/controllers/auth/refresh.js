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

const refresh = async (req, res) => {
	try {
		const { refreshToken } = req.body

		if (!refreshToken) {
			return res.status(400).json({ error: 'refreshToken is required' })
		}

		const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)
		const user = await prisma.user.findUnique({
			where: { telegramId: decoded.telegramId },
		})

		if (!user || user.refreshToken !== refreshToken) {
			return res.status(401).json({ error: 'Invalid or expired refresh token' })
		}

		const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
			generateTokens(user)

		await prisma.user.update({
			where: { telegramId: user.telegramId },
			data: {
				accessToken: newAccessToken,
				refreshToken: newRefreshToken,
			},
		})

		res.json({
			message: 'Token refreshed successfully',
			accessToken: newAccessToken,
			refreshToken: newRefreshToken,
		})
	} catch (error) {
		console.error('Error in refresh:', error.message, error.stack)
		res.status(401).json({ error: 'Invalid or expired refresh token' })
	}
}

module.exports = { refresh }
