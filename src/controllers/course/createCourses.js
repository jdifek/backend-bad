const { generateAnalysisCourse, generateCourse } = require('../../services/aiService');
const { createReminder, cancelReminders } = require('../../services/reminderService');
const prisma = require('../../lib/prisma');

const createCourses = async (req, res) => {
  try {
    const { telegramId, goal, checklist, hasFile } = req.body;
    console.log('Received request to /api/courses:', { telegramId, goal, checklist, hasFile });

    // Проверяем входные данные
    if (!telegramId || !goal) {
      return res.status(400).json({ error: 'telegramId and goal are required' });
    }

    // Проверяем или создаём пользователя
    let user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      user = await prisma.user.create({
        data: { telegramId, name: 'User' },
      });
    }
    console.log(`User upserted: ${user.id}, telegramId: ${telegramId}`);

    let courseData;

    // Если есть фото (анализы), используем generateAnalysisCourse
    if (hasFile && req.file) {
      const photoUrl = req.file ? `/path/to/uploaded/photo.jpg` : null; // Заглушка для URL фото
      console.log('Using photo URL for analysis:', photoUrl);
      courseData = await generateAnalysisCourse(goal, photoUrl, checklist ? JSON.parse(checklist) : []);
    } else {
      // Если фото нет, генерируем курс на основе цели и добавок
      courseData = await generateCourse(goal, checklist ? JSON.parse(checklist) : []);
    }
    console.log('Generated course data:', courseData);

    // Находим существующий курс пользователя
    const existingCourse = await prisma.course.findFirst({
      where: { userId: user.id },
    });

    if (existingCourse) {
      // Отменяем старые напоминания
      console.log(`Cancelling reminders for existing course ${existingCourse.id}`);
      await cancelReminders(existingCourse.id);

      // Удаляем старый курс
      await prisma.course.delete({
        where: { id: existingCourse.id },
      });
      console.log(`Deleted existing course ${existingCourse.id}`);
    }

    // Создаём новый курс
    const course = await prisma.course.create({
      data: {
        userId: user.id,
        goal,
        supplements: courseData.supplements, // Json
        schedule: {
          morning: courseData.supplements.filter(s => s.time === 'утро').map(s => s.name),
          afternoon: courseData.supplements.filter(s => s.time === 'день').map(s => s.name),
          evening: courseData.supplements.filter(s => s.time === 'вечер').map(s => s.name),
        }, // Json
        duration: courseData.duration, // Int?
        suggestions: courseData.suggestions, // String?
        warnings: courseData.warnings, // String?
        questions: courseData.questions, // Json? (массив автоматически преобразуется в JSON)
        repeatAnalysis: courseData.repeatAnalysis, // String?
        disclaimer: 'ИИ-нутрициолог не заменяет врача.', // String?
        isPremium: courseData.isPremium || false, // Boolean
      },
    });
    console.log(`Course created: ${course.id} for user ${telegramId}`);

    // Создаём напоминания
    const scheduleData = {
      morning: courseData.supplements.filter(s => s.time === 'утро').map(s => s.name),
      afternoon: courseData.supplements.filter(s => s.time === 'день').map(s => s.name),
      evening: courseData.supplements.filter(s => s.time === 'вечер').map(s => s.name),
      analysisReminder: courseData.repeatAnalysis,
      survey: { message: 'Как ты себя сегодня чувствуешь? Это поможет уточнить твой курс.' },
    };

    const { reminders, failedMessages } = await createReminder(course.id, user.id, scheduleData);
    console.log(`Created ${reminders.length} reminders for user ${telegramId}`);

    // Отправляем ответ клиенту
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