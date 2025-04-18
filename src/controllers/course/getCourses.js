const prisma = require('../../lib/prisma')

const getCourses = async (req, res) => {
	try {
		const { telegramId } = req.params
		const user = await prisma.user.findUnique({
			where: { telegramId },
		})
		if (!user) return res.status(404).json({ err: 'User not found' })

		const courses = await prisma.course.findMany({
			where: { userId: user.id },
		})

		res.json(courses)
	} catch (err) {
		res.status(500).json({ err: 'Failed to fetch courses' })
	}
}

module.exports = { getCourses }
