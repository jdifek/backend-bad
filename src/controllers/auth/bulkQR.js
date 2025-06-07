const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const path = require('path');
const prisma = require('../../lib/prisma');
const bot = require('../../config/telegram');

const bulkQR = async (req, res) => {
  try {
    const { count, telegramId } = req.body;

    if (!count || count <= 0) {
      return res.status(400).json({ error: 'Необходимо указать корректное количество' });
    }

    if (!telegramId) {
      return res.status(400).json({ error: 'Необходим Telegram ID' });
    }

    if (!bot) {
      console.error('Telegram бот не инициализирован');
      return res.status(500).json({ error: 'Telegram бот недоступен' });
    }

    // Проверка существования пользователя
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      return res.status(400).json({ error: 'Пользователь с указанным Telegram ID не найден' });
    }

    const qrCodes = [];
    for (let i = 0; i < count; i++) {
      const code = uuidv4();
      const orderId = uuidv4();
      const qrLink = `https://t.me/your_AInutritionist_bot?start=${code}`;
      const qrImage = await QRCode.toDataURL(qrLink);

      await prisma.qRCode.create({
        data: {
          code,
          orderId,
        },
      });

      qrCodes.push({ code, link: qrLink, image: qrImage });
    }

    // Создание Excel файла
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('QR Codes');

    worksheet.columns = [
      { header: 'Code', key: 'code', width: 40 },
      { header: 'Link', key: 'link', width: 60 },
      { header: 'QR Image', key: 'image', width: 20 },
    ];

    for (const qr of qrCodes) {
      const row = worksheet.addRow({
        code: qr.code,
        link: qr.link,
        image: qr.image,
      });

      const imageId = workbook.addImage({
        base64: qr.image,
        extension: 'png',
      });
      worksheet.addImage(imageId, {
        tl: { col: 2, row: row.number - 1 },
        ext: { width: 100, height: 100 },
      });
    }

    // Создание временной папки и файла
    const tempDir = path.resolve(__dirname, '../../temp');
    await fs.mkdir(tempDir, { recursive: true });
    const fileName = `qr_codes_${new Date().toISOString().replace(/:/g, '-')}.xlsx`;
    const filePath = path.resolve(tempDir, fileName);

    console.log(`Создание файла: ${filePath}`);

    // Запись файла и проверка его существования
    await workbook.xlsx.writeFile(filePath);
    try {
      await fs.access(filePath);
      console.log(`Файл успешно создан: ${filePath}`);
    } catch (error) {
      console.error(`Файл не найден после записи: ${filePath}`, error.message);
      throw new Error(`Не удалось создать файл: ${filePath}`);
    }

    // Отправка файла в Telegram
    let telegramError = null;
    try {
      await bot.sendDocument(
        telegramId,
        filePath,
        { caption: `Сгенерировано ${count} QR-кодов` },
        { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: fileName }
      );
      console.log(`Excel файл отправлен на Telegram ID ${telegramId}`);
    } catch (error) {
      console.error('Ошибка при отправке файла в Telegram:', error.message, error.stack);
      telegramError = 'Не удалось отправить файл в Telegram. Убедитесь, что вы начали диалог с ботом, отправив /start.';
    }

    // Отправка файла на фронтенд
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);

    // Удаление временного файла
    await fs.unlink(filePath).catch((err) => console.error('Ошибка при удалении временного файла:', err.message));

    // Если была ошибка Telegram, вернуть ее в ответе
    if (telegramError) {
      res.setHeader('X-Telegram-Error', telegramError);
    }
  } catch (error) {
    console.error('Ошибка в bulkQR:', error.message, error.stack);
    res.status(500).json({ error: `Не удалось создать QR-коды: ${error.message}` });
  }
};

module.exports = { bulkQR };