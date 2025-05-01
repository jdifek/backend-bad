const { createClient } = require('@supabase/supabase-js');
const { createReminder } = require('../../services/reminderService');
const { generateAnalysisCourse, analyzeAnalysisFile } = require('../../services/aiService');
const prisma = require('../../lib/prisma');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const createAnalysisCourse = async (req, res) => {
  try {
    const { telegramId, goal, dietPreference } = req.body;
    const file = req.file;

    console.log('Received request to /api/analyses:', {
      telegramId,
      goal,
      hasFile: !!file,
      dietPreference,
    });

    if (!telegramId || !goal || !file) {
      return res.status(400).json({ error: 'telegramId, goal, and file are required' });
    }

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: { telegramId },
    });
    console.log(`User upserted: ${user.id}, telegramId: ${user.telegramId}`);

    const hasSubscription = true; // TODO: Реализовать проверку подписки
    if (!hasSubscription) {
      return res.status(403).json({ error: 'Subscription required' });
    }

    let fileUrl = null;
    let fileName = `${user.id}/analysis_${Date.now()}${file.mimetype === 'application/pdf' ? '.pdf' : '.jpg'}`;
    console.log('Uploading analysis file to Supabase:', fileName);
    const { error } = await supabase.storage
      .from('analysis-photos')
      .upload(fileName, file.buffer, { contentType: file.mimetype });
    if (error) {
      console.error('Supabase upload error:', error.message);
      throw error;
    }

    const { data } = supabase.storage.from('analysis-photos').getPublicUrl(fileName);
    fileUrl = data.publicUrl;
    console.log('Analysis file uploaded, public URL:', fileUrl);

    const courseData = await generateAnalysisCourse(goal, fileUrl, [], dietPreference);
    console.log('Generated course data:', JSON.stringify(courseData, null, 2));

    const course = await prisma.course.create({
      data: {
        userId: user.id,
        goal,
        supplements: courseData.supplements,
        schedule: {
          morning: courseData.supplements
            .filter(s => s.time?.toLowerCase() === 'утро')
            .map(s => s.name),
          afternoon: courseData.supplements
            .filter(s => s.time?.toLowerCase() === 'день')
            .map(s => s.name),
          evening: courseData.supplements
            .filter(s => s.time?.toLowerCase() === 'вечер')
            .map(s => s.name),
        },
        duration: courseData.duration,
        isPremium: true,
      },
    });
    console.log(`Course created: ${course.id} for user ${user.telegramId}`);

    await createReminder(course.id, user.id, {
      ...courseData.schedule,
      analysisReminder: courseData.repeatAnalysis,
      survey: {
        message: 'Как ты себя сегодня чувствуешь? Это поможет уточнить твой курс.',
      },
    });

    res.json({
      message: 'Analysis course created',
      course,
      suggestions: courseData.suggestions,
      warnings: courseData.warnings,
      questions: courseData.questions,
      repeatAnalysis: courseData.repeatAnalysis,
      disclaimer: 'Персонализированные рекомендации ИИ-нутрициолога на основе открытых исследований и общих принципов. Не является медицинской услугой или диагнозом',
    });
  } catch (error) {
    console.error('Error in createAnalysisCourse:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
      file: req.file ? req.file.originalname : null,
    });
    res.status(500).json({ error: `Failed to create analysis course: ${error.message}` });
  }
};

const getAnalysisSummary = async (req, res) => {
  try {
    const { telegramId } = req.body;
    const file = req.file;

    if (!telegramId || !file) {
      return res.status(400).json({ error: 'telegramId and file are required' });
    }

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let fileUrl = null;
    let fileName = `${user.id}/analysis_${Date.now()}${file.mimetype === 'application/pdf' ? '.pdf' : '.jpg'}`;
    console.log('Uploading analysis file to Supabase:', fileName);
    const { error } = await supabase.storage
      .from('analysis-photos')
      .upload(fileName, file.buffer, { contentType: file.mimetype });
    if (error) {
      console.error('Supabase upload error:', error.message);
      throw error;
    }

    const { data } = supabase.storage.from('analysis-photos').getPublicUrl(fileName);
    fileUrl = data.publicUrl;
    console.log('Analysis file uploaded, public URL:', fileUrl);

    const summary = await analyzeAnalysisFile(fileUrl);
    res.json({ summary });
  } catch (error) {
    console.error('Error in getAnalysisSummary:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: `Failed to analyze file: ${error.message}` });
  }
};

module.exports = { createAnalysisCourse, getAnalysisSummary };