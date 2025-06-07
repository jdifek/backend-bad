const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const prisma = require('../../lib/prisma');

const addQR = async (req, res) => {
  try {
    const { orderId } = req.body;
    const code = uuidv4();

    const qrCode = await prisma.qRCode.create({
      data: {
        code,
        orderId,
      },
    });

    const qrLink = `https://t.me/your_AInutritionist_bot?start=${code}`; // Исправленный формат
    const qrImage = await QRCode.toDataURL(qrLink); // Генерируем Base64 изображение QR-кода

    res.json({
      message: 'QR code created successfully',
      qrCode: {
        code: qrCode.code,
        link: qrLink,
        image: qrImage,
      },
    });
  } catch (error) {
    console.error('Error in addQR:', error.message, error.stack);
    res.status(500).json({ error: `Failed to create QR code: ${error.message}` });
  }
};

module.exports = { addQR };