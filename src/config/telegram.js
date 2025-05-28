const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const axios = require('axios');
const prisma = require('../lib/prisma');

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not defined in .env');
  module.exports = null;
  return;
}

let bot;
try {
  bot = new TelegramBot(token, { polling: true });
  console.log('Telegram Bot initialized successfully');

  bot.on('message', async (msg) => {
    console.log(`Received message from ${msg.chat.id}: ${msg.text}`);
    if (msg.text && !msg.text.startsWith('/')) {
      await prisma.user.update({
        where: { telegramId: msg.chat.id.toString() },
        data: { lastMessage: msg.text },
      });
    }
  });

  bot.on('callback_query', async (query) => {
    const telegramId = query.message.chat.id.toString();
    const data = query.data;
    const messageId = query.message.message_id;

    try {
      const user = await prisma.user.findUnique({ where: { telegramId } });
      if (!user) {
        await bot.sendMessage(telegramId, 'Пользователь не найден. Пожалуйста, зарегистрируйтесь.');
        await bot.answerCallbackQuery(query.id);
        return;
      }

      if (data.startsWith('supplement_')) {
        const [_, action, reminderId] = data.split('_');
        const reminder = await prisma.reminder.findUnique({
          where: { id: reminderId },
        });
        if (!reminder) {
          await bot.sendMessage(telegramId, 'Напоминание не найдено.');
          await bot.answerCallbackQuery(query.id);
          return;
        }

        const supplement = reminder.message.split(': ')[1].split(', ')[0];
        const today = new Date().toISOString().split('T')[0];

        await prisma.progress.upsert({
          where: {
            userId_courseId_supplement_date: {
              userId: user.id,
              courseId: reminder.courseId,
              supplement,
              date: new Date(today),
            },
          },
          update: {
            status: action === 'taken' ? 'TAKEN' : 'SKIPPED',
            updatedAt: new Date(),
          },
          create: {
            userId: user.id,
            courseId: reminder.courseId,
            supplement,
            date: new Date(today),
            status: action === 'taken' ? 'TAKEN' : 'SKIPPED',
          },
        });

        await prisma.reminder.update({
          where: { id: reminderId },
          data: {
            status: action === 'taken' ? 'TAKEN' : 'SKIPPED',
            updatedAt: new Date(),
          },
        });

        const responseText =
          action === 'taken'
            ? 'Отлично, вы приняли добавки! 😊'
            : 'Жаль, вы пропустили приём. Постарайтесь не забывать! 😌';

        await bot.editMessageText(responseText, {
          chat_id: telegramId,
          message_id: messageId,
        });
      } else if (data.startsWith('survey_')) {
        const [_, response, reminderId] = data.split('_');
        const reminder = await prisma.reminder.findUnique({
          where: { id: reminderId },
        });
        if (!reminder) {
          await bot.sendMessage(telegramId, 'Опрос не найден.');
          await bot.answerCallbackQuery(query.id);
          return;
        }

        await prisma.survey.upsert({
          where: { id: reminderId },
          update: {
            response,
            status: 'COMPLETED',
            updatedAt: new Date(),
          },
          create: {
            id: reminderId,
            userId: user.id,
            courseId: reminder.courseId,
            question: reminder.message,
            response,
            status: 'COMPLETED',
          },
        });

        await prisma.reminder.update({
          where: { id: reminderId },
          data: {
            surveyResponse: response,
            status: 'COMPLETED',
            updatedAt: new Date(),
          },
        });

        await bot.editMessageText(
          `Спасибо за ответ: ${response}! Мы учтём это для вашего курса.`,
          {
            chat_id: telegramId,
            message_id: messageId,
          }
        );
      }

      await bot.answerCallbackQuery(query.id);
    } catch (error) {
      console.error('Error handling callback query:', error.message, error.stack);
      await bot.sendMessage(telegramId, 'Произошла ошибка. Попробуйте позже.');
      await bot.answerCallbackQuery(query.id);
    }
  });

  bot.onText(/\/start (.+)/, async (msg, match) => {
    const telegramId = msg.chat.id.toString();
    const code = match[1]; // Извлекаем код из команды /start id=code

    try {
      const response = await axios.post('https://backend-bad-production.up.railway.app/api/auth/redeem-qr', {
        code,
        telegramId,
      });

      await bot.sendMessage(
        telegramId,
        `Добро пожаловать, ${response.data.user.name}! Ваш премиум-доступ активирован.`
      );
    } catch (error) {
      console.error('Error redeeming QR code:', error.message, error.stack);
      await bot.sendMessage(
        telegramId,
        'Ошибка активации QR-кода. Попробуйте снова или обратитесь в поддержку.'
      );
    }
  });

  bot.on('polling_error', (error) => {
    console.error('Telegram polling error:', error.message);
  });
} catch (error) {
  console.error('Failed to initialize Telegram Bot:', error.message);
  bot = null;
}

module.exports = bot;