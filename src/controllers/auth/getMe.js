const getMe = async (req, res) => {
	try {
		const user = req.user
		res.json({
			message: 'User data retrieved successfully',
			user: {
				telegramId: user.telegramId,
				name: user.name || 'User',
        goal: user.goal,
				photoUrl: user.photoUrl,
			},
		})
	} catch (error) {
		console.error('Error in getMe:', error.message, error.stack)
		res
			.status(500)
			.json({ error: `Failed to retrieve user data: ${error.message}` })
	}
}

module.exports = { getMe }
