const { generateAnalysisCourse, generateCourse } = require('../../services/aiService');
const { createReminder, cancelReminders } = require('../../services/reminderService');
const prisma = require('../../lib/prisma');

const createCourses = async (req, res) => {
  try {
    const { telegramId, goal, checklist, hasFile, dietPreference } = req.body;
    console.log('Received request to /api/courses:', { telegramId, goal, checklist, hasFile, dietPreference });

    if (!telegramId || !goal) {
      return res.status(400).json({ error: 'telegramId and goal are required' });
    }

    let user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      user = await prisma.user.create({
        data: { telegramId, name: 'User' },
      });
    }
    console.log(`User upserted: ${user.id}, telegramId: ${telegramId}`);

    let courseData;

    if (hasFile && req.file) {
      const photoUrl = req.file ? `/path/to/uploaded/photo.jpg` : null; // Замените на реальную логику загрузки
      console.log('Using photo URL for analysis:', photoUrl);
      courseData = await generateAnalysisCourse(goal, photoUrl, checklist ? JSON.parse(checklist) : [], dietPreference);
    } else {
      courseData = await generateCourse(goal, checklist ? JSON.parse(checklist) : [], dietPreference);
    }
    console.log('Generated course data:', courseData);

    const existingCourse = await prisma.course.findFirst({
      where: { userId: user.id },
    });

    if (existingCourse) {
      console.log(`Cancelling reminders for existing course ${existingCourse.id}`);
      await cancelReminders(existingCourse.id);
      await prisma.progress.deleteMany({ where: { courseId: existingCourse.id } });
      await prisma.survey.deleteMany({ where: { courseId: existingCourse.id } });
      await prisma.course.delete({ where: { id: existingCourse.id } });
      console.log(`Deleted existing course ${existingCourse.id}`);
    }

    const course = await prisma.course.create({
      data: {
        userId: user.id,
        goal,
        supplements: courseData.supplements,
        schedule: {
          morning: courseData.supplements.filter(s => s.time === 'утро').map(s => s.name),
          afternoon: courseData.supplements.filter(s => s.time === 'день').map(s => s.name),
          evening: courseData.supplements.filter(s => s.time === 'вечер').map(s => s.name),
        },
        duration: courseData.duration,
        suggestions: courseData.suggestions,
        warnings: courseData.warnings,
        questions: courseData.questions,
        repeatAnalysis: courseData.repeatAnalysis,
        disclaimer: 'Персонализированные рекомендации ИИ-нутрициолога на основе открытых исследований и общих принципов. Не является медицинской услугой или диагнозом',
        isPremium: courseData.isPremium || false,
      },
    });
    console.log(`Course created: ${course.id} for user ${telegramId}`);

    const scheduleData = {
      morning: courseData.supplements.filter(s => s.time === 'утро').map(s => s.name),
      afternoon: courseData.supplements.filter(s => s.time === 'день').map(s => s.name),
      evening: courseData.supplements.filter(s => s.time === 'вечер').map(s => s.name),
      analysisReminder: courseData.repeatAnalysis,
      survey: { message: 'Как ты себя сегодня чувствуешь? Это поможет уточнить твой курс.' },
    };

    const { reminders, failedMessages } = await createReminder(course.id, user.id, scheduleData);
    console.log(`Created ${reminders.length} reminders for user ${telegramId}`);

    res.status(201).json({
      course,
      reminders,
      failedMessages,
    });
  } catch (error) {
    console.error('Error in createCourses:', error);
    res.status(500).json({ error: 'Failed to create course', details: error.message });
  }
};

module.exports = { createCourses };