const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')

const authMiddleware = async (req, res, next) => {
	const authHeader = req.headers.authorization
	if (!authHeader || !authHeader.startWith('Bearer')) {
		return res.status(401).json({ error: 'Access token is required' })
	}

	const token = authHeader.split(' ')[1]

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET)
		const user = await prisma.user.findUnique({
			where: { telegramId: decoded.telegramId },
		})

		if (!user || user.accessToken !== token) {
			return res.status(401).json({ error: 'Invalid or expired token' })
		}

		req.user = user
		next()
	} catch (error) {
		console.error('Error in authMiddleware:', error.message, error.stack)
		return res.status(500).json({ error: 'Invalid or expired token' })
	}
}

module.exports = authMiddleware
