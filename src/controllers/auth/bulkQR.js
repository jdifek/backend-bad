const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const path = require('path');
const prisma = require('../../lib/prisma');
const bot = require('../../config/telegram');

const bulkQR = async (req, res) => {
  try {
    const { count } = req.body;

    if (!count || count <= 0) {
      return res.status(400).json({ error: 'Valid count is required' });
    }

    if (!bot) {
      console.error('Telegram bot is not initialized');
      return res.status(500).json({ error: 'Telegram bot is not available' });
    }

    const qrCodes = [];
    for (let i = 0; i < count; i++) {
      const code = uuidv4();
      const orderId = uuidv4();
      const qrLink = `https://t.me/Badi13422_bot?start=${code}`;
      const qrImage = await QRCode.toDataURL(qrLink);

      await prisma.qRCode.create({
        data: {
          code,
          orderId,
        },
      });

      qrCodes.push({ code, link: qrLink, image: qrImage });
    }

    // Create Excel file
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

    // Save Excel file temporarily
    const tempDir = path.join(__dirname, '../../temp');
    await fs.mkdir(tempDir, { recursive: true });
    const fileName = `qr_codes_${new Date().toISOString()}.xlsx`;
    const filePath = path.join(tempDir, fileName);
    await workbook.xlsx.writeFile(filePath);

    // Send file to Telegram
    const telegramId = req.user?.telegramId || process.env.ADMIN_CHAT_ID; // Get from JWT or .env
    if (!telegramId) {
      console.error('No Telegram ID or ADMIN_CHAT_ID provided');
      await fs.unlink(filePath).catch((err) => console.error('Error deleting temp file:', err.message));
      return res.status(400).json({ error: 'Admin Telegram ID not found' });
    }

    try {
      await bot.sendDocument(
        telegramId,
        filePath,
        { caption: `Generated ${count} QR codes` },
        { filename: fileName, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );
      console.log(`Excel file sent to Telegram ID ${telegramId}`);
    } catch (error) {
      console.error('Error sending file to Telegram:', error.message, error.stack);
      // Don't fail the request; just log the error
    }

    // Send file to frontend
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);

    // Clean up temporary file
    await fs.unlink(filePath).catch((err) => console.error('Error deleting temp file:', err.message));
  } catch (error) {
    console.error('Error in bulkQR:', error.message, error.stack);
    res.status(500).json({ error: `Failed to create bulk QR codes: ${error.message}` });
  }
};

module.exports = { bulkQR };