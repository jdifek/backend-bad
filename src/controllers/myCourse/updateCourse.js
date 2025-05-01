const prisma = require('../../lib/prisma')
const { generateCourse } = require('../../services/aiService')
const { createReminder, cancelReminders } = require('../../services/reminderService')

const updateCourse = async (req, res) => {
  try {
    const { telegramId, goal, supplements, dietPreference } = req.body

    if (!telegramId || !goal || !supplements) {
      return res
        .status(400)
        .json({ error: 'telegramId, goal, and supplements are required' })
    }

    const user = await prisma.user.findUnique({
      where: { telegramId },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const oldCourse = await prisma.course.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })
    if (oldCourse) {
      await cancelReminders(oldCourse.id)
    }

    const analysis = await generateCourse(goal, supplements, dietPreference);
    const newCourse = await prisma.course.create({
      data: {
        userId: user.id,
        goal,
        supplements: analysis.supplements,
        duration: analysis.duration,
        suggestions: analysis.suggestions,
        warnings: analysis.warnings,
        questions: analysis.questions,
        schedule: {
          morning: analysis.supplements
            .filter(s => s.time?.toLowerCase() === 'утро')
            .map(s => s.name),
          afternoon: analysis.supplements
            .filter(s => s.time?.toLowerCase() === 'день')
            .map(s => s.name),
          evening: analysis.supplements
            .filter(s => s.time?.toLowerCase() === 'вечер')
            .map(s => s.name),
        },
      },
    })

    const { reminders, failedMessages } = await createReminder(
      newCourse.id,
      user.id,
      {
        morning: newCourse.schedule.morning,
        afternoon: newCourse.schedule.afternoon,
        evening: newCourse.schedule.evening,
        analysisReminder: analysis.repeatAnalysis,
        survey: {
          message: 'Как ты себя сегодня чувствуешь? Это поможет уточнить твой курс.',
        },
      }
    )

    res.json({
      message: 'Course updated successfully',
      course: newCourse,
      notifications: {
        sent: reminders.length - failedMessages.length,
        failed: failedMessages.length,
        failedMessages: failedMessages.length > 0 ? failedMessages : undefined,
      },
      disclaimer: 'Персонализированные рекомендации ИИ-нутрициолога на основе открытых исследований и общих принципов. Не является медицинской услугой или диагнозом',
    })
  } catch (error) {
    console.error('Error in updateCourse:', error.message, error.stack)
    res.status(500).json({ error: `Failed to update course: ${error.message}` })
  }
}

module.exports = { updateCourse }