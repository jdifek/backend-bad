const prisma = require("../lib/prisma");
const deleteMeal = async (req, res) => {
  try {
    const mealId = req.params.mealId;
    await prisma.foodAnalysis.delete({
      where: { id: mealId }
    });
    res.status(200).json({ message: 'Meal deleted successfully' });
  } catch (error) {
    console.error('Error deleting meal:', error);
    res.status(500).json({ error: 'Failed to delete meal' });
  }
}
const saveMeal = async (req, res) => {
  try {
    const { telegramId, dish, calories, type, date } = req.body;
    if (!telegramId || !dish || !calories || !type || !date) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: { telegramId },
    });

    const meal = await prisma.foodAnalysis.create({
      data: {
        userId: user.id,
        dish,
        calories,
        type,
        date: new Date(date),
        nutrients: { protein: 0, fats: 0, carbs: 0 }, // Пример, можно уточнить
        suggestions: '',
        questions: [],
        warnings: '',
      },
    });

    res.json({ message: 'Еда добавлена', meal });
  } catch (error) {
    console.error('Error saving meal:', error);
    res.status(500).json({ error: 'Не удалось сохранить еду' });
  }
};

const getUserMeals = async (req, res) => {
  try {
    const { telegramId } = req.params;
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    const meals = await prisma.foodAnalysis.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
    });
    res.json({ meals });
  } catch (error) {
    console.error('Error fetching meals:', error);
    res.status(500).json({ error: 'Не удалось загрузить еду' });
  }
};

const updateUserGoal = async (req, res) => {
  try {
    const { telegramId } = req.params;
    const { goal } = req.body;
    if (!telegramId || !goal) {
      return res.status(400).json({ error: 'telegramId и goal обязательны' });
    }

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: { goal },
      create: { telegramId, goal },
    });

    res.json({ message: 'Цель обновлена', goal: user.goal });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Не удалось обновить цель' });
  }
};

module.exports = { saveMeal, getUserMeals, updateUserGoal, deleteMeal };