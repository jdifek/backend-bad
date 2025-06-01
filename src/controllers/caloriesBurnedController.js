const prisma = require("../lib/prisma");

const saveCaloriesBurned = async (req, res) => {
  try {
    const { telegramId, calories, date, notes } = req.body;
    
    if (!telegramId || !calories || !date) {
      return res.status(400).json({ error: 'telegramId, calories и date обязательны' });
    }

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    const burned = await prisma.caloriesBurned.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: new Date(date),
        }
      },
      update: { calories, notes },
      create: {
        userId: user.id,
        calories,
        date: new Date(date),
        notes,
      },
    });

    res.json({ message: 'Потраченные калории сохранены', burned });
  } catch (error) {
    console.error('Error saving calories burned:', error);
    res.status(500).json({ error: 'Не удалось сохранить данные' });
  }
};
const getCaloriesBurned = async (req, res) => {
  try {
    const { telegramId, date } = req.params;

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const burned = await prisma.caloriesBurned.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    res.json({ burned: burned || { calories: 0 } });
  } catch (error) {
    console.error('Error fetching calories burned:', error);
    res.status(500).json({ error: 'Не удалось загрузить данные' });
  }
};

module.exports = { saveCaloriesBurned, getCaloriesBurned };