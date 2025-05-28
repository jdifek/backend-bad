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

const redeemQR = async (req, res) => {
  try {
    const { code, telegramId } = req.body;

    if (!code || !telegramId) {
      return res.status(400).json({ error: 'code and telegramId are required' });
    }

    const qrCode = await prisma.qRCode.findUnique({
      where: { code },
    });

    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    if (qrCode.isUsed) {
      return res.status(400).json({ error: 'QR code already used' });
    }

    let user = await prisma.user.findUnique({
      where: { telegramId },
    });

    const isAdmin = telegramId === '5969166369';

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId,
          name: 'User',
          isPremium: true,
          isAdmin,
        },
      });
    } else if (!user.isPremium) {
      user = await prisma.user.update({
        where: { telegramId },
        data: { isPremium: true, isAdmin },
      });
    } else {
      return res.status(400).json({ error: 'User already has premium access' });
    }

    await prisma.qRCode.update({
      where: { code },
      data: {
        isUsed: true,
        userId: user.id,
      },
    });

    const { accessToken, refreshToken } = generateTokens(user);

    await prisma.user.update({
      where: { telegramId },
      data: {
        accessToken,
        refreshToken,
      },
    });

    res.json({
      message: 'QR code redeemed successfully',
      user: {
        telegramId: user.telegramId,
        name: user.name,
        isPremium: user.isPremium,
        isAdmin: user.isAdmin,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Error in redeemQR:', error.message, error.stack);
    res.status(500).json({ error: `Failed to redeem QR code: ${error.message}` });
  }
};

module.exports = { redeemQR };