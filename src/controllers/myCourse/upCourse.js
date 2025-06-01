const prisma = require("../../lib/prisma");
const { upCourseAi } = require('../../services/aiService')
const upCourse = async (req, res) => {
  try {
    const { id } = req.body; // ID курса должен приходить от клиента
    const courseOld = await prisma.course.findUnique({ where: { id } });

    if (!courseOld) {
      return res.status(404).json({ error: "Курс не найден" });
    }

    const courseData = await upCourseAi(courseOld); // AI-обновление курса

    const updatedCourse = await prisma.course.update({
      where: {
        id: courseOld.id,
      },
      data: {
        userId: courseOld.userId,
        goal: courseData.goal,
        supplements: courseData.supplements,
        duration: courseData.duration,
        suggestions: courseData.suggestions,
        warnings: courseData.warnings,
        questions: courseData.questions,
        repeatAnalysis: courseData.repeatAnalysis,
        disclaimer: courseData.disclaimer,
        schedule: courseData.schedule,
        isPremium: courseData.isPremium,
      },
    });

    console.log(updatedCourse);
    
    res.json(updatedCourse);
  } catch (error) {
    console.error("Ошибка при обновлении курса:", error);
    res.status(500).json({ error: "Ошибка при обновлении курса" });
  }
};

module.exports = {
  upCourse
}