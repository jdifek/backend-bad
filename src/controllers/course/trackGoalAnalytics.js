const prisma = require('../../lib/prisma')

const trackGoalAnalytics = async (req, res) => {
  try {
    const { telegramId, goals } = req.body

    if (!telegramId || !goals || !Array.isArray(goals) || goals.length === 0) {
      return res.status(400).json({ error: 'telegramId and goals array are required' })
    }

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: { telegramId },
    })

    // Записываем каждую цель в аналитику
    const analytics = await Promise.all(
      goals.map(goal =>
        prisma.goalAnalytics.create({
          data: {
            userId: user.id,
            goal,
          },
        })
      )
    )

    res.status(201).json({
      message: 'Goal analytics tracked',
      analytics,
    })
  } catch (error) {
    console.error('Error in trackGoalAnalytics:', error.message, error.stack)
    res.status(500).json({ error: `Failed to track goal analytics: ${error.message}` })
  }
}

module.exports = { trackGoalAnalytics }