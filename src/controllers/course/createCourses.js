const { createClient } = require('@supabase/supabase-js');
const { generateAnalysisCourse, generateCourse, recognizeSupplementPhoto } = require('../../services/aiService');
const { createReminder, cancelReminders } = require('../../services/reminderService');
const prisma = require('../../lib/prisma');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const createCourses = async (req, res) => {
  try {
    const { telegramId, goal, checklist, hasFile, dietPreference, fileType } = req.body;
    const file = req.file;

    console.log('Received request to /api/courses:', {
      telegramId,
      goal,
      checklist,
      hasFile,
      dietPreference,
      fileType,
      hasFileAttached: !!file,
      fileMimetype: file?.mimetype,
    });

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
    let finalChecklist = checklist ? JSON.parse(checklist) : [];

    console.log('Initial checklist:', finalChecklist);

    if (hasFile && file) {
      // Загружаем файл в Supabase
      const fileName = `${user.id}/course_${Date.now()}${file.mimetype === 'application/pdf' ? '.pdf' : '.jpg'}`;
      console.log('Uploading file to Supabase:', fileName);
      const { error: uploadError } = await supabase.storage
        .from('course-photos')
        .upload(fileName, file.buffer, { contentType: file.mimetype });
      if (uploadError) {
        console.error('Supabase upload error:', uploadError.message);
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage.from('course-photos').getPublicUrl(fileName);
      const photoUrl = publicUrlData.publicUrl;
      console.log('File uploaded, public URL:', photoUrl);

      if (fileType === 'supplement') {
        // Распознаём добавки с фото
        console.log('Calling recognizeSupplementPhoto with URL:', photoUrl);
        const supplementNames = await recognizeSupplementPhoto(photoUrl);
        console.log('Recognized supplements:', supplementNames);

        if (Array.isArray(supplementNames) && supplementNames.length > 0) {
          finalChecklist = [...finalChecklist, ...supplementNames.filter(name => name !== 'Unknown Supplement')];
          console.log('Updated finalChecklist with recognized supplements:', finalChecklist);
        } else if (typeof supplementNames === 'string' && supplementNames !== 'Unknown Supplement') {
          finalChecklist = [...finalChecklist, supplementNames];
          console.log('Updated finalChecklist with single recognized supplement:', finalChecklist);
        } else {
          console.warn('No valid supplements recognized from photo');
        }
        // Генерируем курс с распознанными добавками
        console.log('Calling generateCourse with:', { goal, finalChecklist, dietPreference });
        courseData = await generateCourse(goal, finalChecklist, dietPreference);
      } else if (fileType === 'analysis') {
        // Генерируем курс на основе анализов
        console.log('Calling generateAnalysisCourse with:', { goal, photoUrl, finalChecklist, dietPreference });
        courseData = await generateAnalysisCourse(goal, photoUrl, finalChecklist, dietPreference);
      } else {
        return res.status(400).json({ error: 'Invalid fileType. Must be "supplement" or "analysis"' });
      }
    } else {
      // Без файла используем только checklist
      console.log('No file provided, calling generateCourse with:', { goal, finalChecklist, dietPreference });
      courseData = await generateCourse(goal, finalChecklist, dietPreference);
    }
    console.log('Generated course data:', JSON.stringify(courseData, null, 2));

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
    console.log(`Course created: ${course.id} for user ${telegramId}`, {
      supplements: course.supplements,
      schedule: course.schedule,
    });

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
      compatibilityNotes: courseData.compatibilityNotes,
      failedMessages,
    });
  } catch (error) {
    console.error('Error in createCourses:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create course', details: error.message });
  }
};

module.exports = { createCourses };