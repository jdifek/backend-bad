const jwt = require('jsonwebtoken');
const prisma = require('../../lib/prisma');

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { telegramId: user.telegramId, name: user.name || 'User', isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { telegramId: user.telegramId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

const login = async (req, res) => {
  try {
    const { telegramId, name, photoUrl } = req.body;

    if (!telegramId) {
      return res.status(400).json({ error: 'telegramId is required' });
    }

    let user = await prisma.user.findUnique({
      where: { telegramId },
    });

    const isAdmin = telegramId === '5969166369' || telegramId === '714660678';

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId,
          name: name || 'User',
          photoUrl: photoUrl || null,
          accessToken: null,
          refreshToken: null,
          isAdmin,
          isPremium: false, // Устанавливаем isPremium по умолчанию
        },
      });
    } else if (user.isAdmin !== isAdmin) {
      user = await prisma.user.update({
        where: { telegramId },
        data: { isAdmin },
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    await prisma.user.update({
      where: { telegramId },
      data: {
        name: name || user.name || 'User',
        photoUrl: photoUrl || user.photoUrl || null,
        accessToken,
        refreshToken,
      },
    });

    res.json({
      message: 'Login successful',
      user: {
        telegramId,
        name: name || user.name || 'User',
        photoUrl: user.photoUrl || null,
        isAdmin: user.isAdmin,
        isPremium: user.isPremium, // Добавляем isPremium
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Error in login:', error.message, error.stack);
    res.status(500).json({ error: `Failed to login: ${error.message}` });
  }
};

module.exports = { login };