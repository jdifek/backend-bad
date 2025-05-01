const prisma = require('../../lib/prisma')
const { cancelReminders } = require('../../services/reminderService')

const deleteCourse = async (req, res) => {
  try {
    const { telegramId, courseId } = req.body

    if (!telegramId || !courseId) {
      return res.status(400).json({ error: 'telegramId and courseId are required' })
    }

    const user = await prisma.user.findUnique({
      where: { telegramId },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course || course.userId !== user.id) {
      return res.status(404).json({ error: 'Course not found or not owned by user' })
    }

    // Отменяем напоминания
    await cancelReminders(courseId)

    // Удаляем связанные данные (прогресс, опросы, напоминания)
    await prisma.progress.deleteMany({
      where: { courseId },
    })

    await prisma.survey.deleteMany({
      where: { courseId },
    })

    await prisma.reminder.deleteMany({
      where: { courseId },
    })

    // Удаляем курс
    await prisma.course.delete({
      where: { id: courseId },
    })

    res.json({
      message: 'Course deleted successfully',
    })
  } catch (error) {
    console.error('Error in deleteCourse:', error.message, error.stack)
    res.status(500).json({ error: `Failed to delete course: ${error.message}` })
  }
}

module.exports = { deleteCourse }