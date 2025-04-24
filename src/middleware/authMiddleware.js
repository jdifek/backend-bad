const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')

const authMiddleware = async (req, res, next) => {
	const authHeader = req.headers.authorization
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ error: 'Access token is required' })
	}

	const token = authHeader.split(' ')[1]

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET)
		const user = await prisma.user.findUnique({
			where: { telegramId: decoded.telegramId },
		})

		if (!user) {
			return res.status(401).json({ error: 'User not found' })
		}

		req.user = user
		next()
	} catch (error) {
		console.error('Error in authMiddleware:', error.message, error.stack)
		return res.status(401).json({ error: 'Invalid or expired token' })
	}
}

module.exports = authMiddleware
