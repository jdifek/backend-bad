const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const ExcelJS = require('exceljs');
const prisma = require('../../lib/prisma');

const bulkQR = async (req, res) => {
  try {
    const { count } = req.body;

    if (!count || count <= 0) {
      return res.status(400).json({ error: 'Valid count is required' });
    }

    const qrCodes = [];
    for (let i = 0; i < count; i++) {
      const code = uuidv4();
      const orderId = uuidv4(); // Auto-generate orderId
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

      // Add QR code image to the worksheet
      const imageId = workbook.addImage({
        base64: qr.image,
        extension: 'png',
      });
      worksheet.addImage(imageId, {
        tl: { col: 2, row: row.number - 1 },
        ext: { width: 100, height: 100 },
      });
    }

    // Set up response headers for Excel file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=qr_codes_${new Date().toISOString()}.xlsx`);

    // Write Excel file to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error in bulkQR:', error.message, error.stack);
    res.status(500).json({ error: `Failed to create bulk QR codes: ${error.message}` });
  }
};

module.exports = { bulkQR };