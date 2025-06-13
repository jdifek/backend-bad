require('dotenv').config();
const app = require('./app');
const crypto = require("crypto");
const axios = require("axios");

const TERMINAL_KEY = "TinkoffBankTest"; // ваш TerminalKey из ЛК
const PASSWORD = "1234567890";      // ваш SecretKey (Password) из ЛК
const PORT = process.env.PORT || 5000;

app.post("/api/create-payment", async (req, res) => {
  const { amount, orderId, description, customerEmail, customerPhone } = req.body;

  // Шаг 1: создаем basePayload без дополнительных полей
  const basePayload = {
    TerminalKey: TERMINAL_KEY,
    Amount: amount * 100, // сумма в копейках
    OrderId: orderId,
    Description: description,
  };

  // Шаг 2: формируем строку токена
  const tokenPayload = {
    ...basePayload,
    Password: PASSWORD,
  };

  const tokenString = Object.keys(tokenPayload)
    .sort()
    .map((key) => `${key}=${tokenPayload[key]}`)
    .join("");

  const Token = crypto.createHash("sha256").update(tokenString).digest("hex");

  // Логирование токена и строки
  console.log("🔐 Token string:", tokenString);
  console.log("🔑 Token:", Token);

  // Шаг 3: окончательный payload
  const payload = {
    ...basePayload,
    Token,
    DATA: {
      Email: customerEmail,
      Phone: customerPhone,
    },
  };

  console.log("📦 Payload to Tinkoff:", payload);

  try {
    const response = await axios.post("https://securepay.tinkoff.ru/v2/Init", payload);
    res.json(response.data);
  } catch (err) {
    console.error("❌ Ошибка от Tinkoff:", err.response?.data || err.message);
    res.status(500).json({
      error: "Ошибка создания платежа",
      tinkoffResponse: err.response?.data || null,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
