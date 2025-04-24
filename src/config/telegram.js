const TelegramBot = require('node-telegram-bot-api')
const dotenv = require('dotenv')
const prisma = require('../lib/prisma')

dotenv.config()

const token = process.env.TELEGRAM_BOT_TOKEN

if (!token) {
	console.error('TELEGRAM_BOT_TOKEN is not defined in .env')
	module.exports = null
	return
}

let bot
try {
	bot = new TelegramBot(token, { polling: true })
	console.log('Telegram Bot initialized successfully')

	// Обработка команды /start
	bot.onText(/\/start/, async msg => {
		const telegramId = msg.chat.id.toString()
		console.log(`Received /start from ${telegramId}`)
		try {
			const user = await prisma.user.upsert({
				where: { telegramId },
				update: {},
				create: { telegramId },
			})
			await bot.sendMessage(
				telegramId,
				'Добро пожаловать! Теперь вы можете получать напоминания о приёме добавок и анализах.'
			)
			console.log(`User ${telegramId} registered or confirmed via /start`)
		} catch (error) {
			console.error(`Error processing /start for ${telegramId}:`, error.message)
			await bot.sendMessage(telegramId, 'Произошла ошибка. Попробуйте позже.')
		}
	})

	// Обработка текстовых сообщений
	bot.on('message', async msg => {
		const telegramId = msg.chat.id.toString()
		console.log(`Received message from ${telegramId}: ${msg.text}`)
		if (msg.text && !msg.text.startsWith('/')) {
			try {
				await prisma.user.update({
					where: { telegramId },
					data: { lastMessage: msg.text },
				})
				console.log(`Saved lastMessage for ${telegramId}: ${msg.text}`)
			} catch (error) {
				console.error(
					`Error saving lastMessage for ${telegramId}:`,
					error.message
				)
			}
		}
	})

	// Обработка коллбэк-запросов от кнопок
	bot.on('callback_query', async query => {
		const telegramId = query.message.chat.id.toString()
		const data = query.data
		const messageId = query.message.message_id

		console.log(`Received callback query from ${telegramId}: ${data}`)

		try {
			const user = await prisma.user.findUnique({ where: { telegramId } })
			if (!user) {
				await bot.sendMessage(
					telegramId,
					'Пользователь не найден. Пожалуйста, начните с /start.'
				)
				return
			}

			if (data.startsWith('supplement_')) {
				const [_, action, reminderId] = data.split('_')
				const reminder = await prisma.reminder.findUnique({
					where: { id: reminderId },
				})
				if (!reminder) {
					await bot.sendMessage(telegramId, 'Напоминание не найдено.')
					return
				}

				await prisma.reminder.update({
					where: { id: reminderId },
					data: {
						status: action === 'taken' ? 'TAKEN' : 'SKIPPED',
						updatedAt: new Date(),
					},
				})

				const responseText =
					action === 'taken'
						? 'Отлично, вы приняли добавки! 😊'
						: 'Жаль, вы пропустили приём. Постарайтесь не забывать! 😌'

				await bot.editMessageText(responseText, {
					chat_id: telegramId,
					message_id: messageId,
				})
				console.log(`Processed supplement action for ${telegramId}: ${action}`)
			} else if (data.startsWith('survey_')) {
				const [_, response, reminderId] = data.split('_')
				const reminder = await prisma.reminder.findUnique({
					where: { id: reminderId },
				})
				if (!reminder) {
					await bot.sendMessage(telegramId, 'Опрос не найден.')
					return
				}

				await prisma.reminder.update({
					where: { id: reminderId },
					data: {
						surveyResponse: response,
						status: 'COMPLETED',
						updatedAt: new Date(),
					},
				})

				await bot.editMessageText(
					`Спасибо за ответ: ${response}! Мы учтём это для вашего курса.`,
					{
						chat_id: telegramId,
						message_id: messageId,
					}
				)
				console.log(`Processed survey response for ${telegramId}: ${response}`)
			}

			await bot.answerCallbackQuery(query.id)
		} catch (error) {
			console.error(
				`Error handling callback query for ${telegramId}:`,
				error.message,
				error.stack
			)
			await bot.sendMessage(telegramId, 'Произошла ошибка. Попробуйте позже.')
		}
	})

	bot.on('polling_error', error => {
		console.error('Telegram polling error:', error.message, error.stack)
	})
} catch (error) {
	console.error(
		'Failed to initialize Telegram Bot:',
		error.message,
		error.stack
	)
	bot = null
}

module.exports = bot

// const TelegramBot = require('node-telegram-bot-api')
// const dotenv = require('dotenv')
// const prisma = require('../lib/prisma')

// dotenv.config()

// const token = process.env.TELEGRAM_BOT_TOKEN

// if (!token) {
// 	console.error('TELEGRAM_BOT_TOKEN is not defined in .env')
// 	module.exports = null
// 	return
// }

// let bot
// try {
// 	bot = new TelegramBot(token, { polling: true })
// 	console.log('Telegram Bot initialized successfully')

// 	// Обработка текстовых сообщений
// 	bot.on('message', async msg => {
// 		console.log(`Received message from ${msg.chat.id}: ${msg.text}`)
// 		if (msg.text && !msg.text.startsWith('/')) {
// 			// Логируем ответы, не связанные с командами
// 			await prisma.user.update({
// 				where: { telegramId: msg.chat.id.toString() },
// 				data: { lastMessage: msg.text },
// 			})
// 		}
// 	})

// 	// Обработка колбек-запросов от кнопок
// 	bot.on('callback_query', async query => {
// 		const telegramId = query.message.chat.id.toString()
// 		const data = query.data
// 		const messageId = query.message.message_id

// 		try {
// 			const user = await prisma.user.findUnique({ where: { telegramId } })
// 			if (!user) {
// 				await bot.sendMessage(
// 					telegramId,
// 					'Пользователь не найден. Пожалуйста, зарегистрируйтесь.'
// 				)
// 				return
// 			}

// 			if (data.startsWith('supplement_')) {
// 				const [_, action, reminderId] = data.split('_')
// 				const reminder = await prisma.reminder.findUnique({
// 					where: { id: reminderId },
// 				})
// 				if (!reminder) {
// 					await bot.sendMessage(telegramId, 'Напоминание не найдено.')
// 					return
// 				}

// 				// Логируем действие
// 				await prisma.reminder.update({
// 					where: { id: reminderId },
// 					data: {
// 						status: action === 'taken' ? 'TAKEN' : 'SKIPPED',
// 						updatedAt: new Date(),
// 					},
// 				})

// 				const responseText =
// 					action === 'taken'
// 						? 'Отлично, вы приняли добавки! 😊'
// 						: 'Жаль, вы пропустили приём. Постарайтесь не забывать! 😌'

// 				await bot.editMessageText(responseText, {
// 					chat_id: telegramId,
// 					message_id: messageId,
// 				})
// 			} else if (data.startsWith('survey_')) {
// 				const [_, response, reminderId] = data.split('_')
// 				const reminder = await prisma.reminder.findUnique({
// 					where: { id: reminderId },
// 				})
// 				if (!reminder) {
// 					await bot.sendMessage(telegramId, 'Опрос не найден.')
// 					return
// 				}

// 				// Сохраняем ответ на опрос
// 				await prisma.reminder.update({
// 					where: { id: reminderId },
// 					data: {
// 						surveyResponse: response,
// 						status: 'COMPLETED',
// 						updatedAt: new Date(),
// 					},
// 				})

// 				await bot.editMessageText(
// 					`Спасибо за ответ: ${response}! Мы учтём это для вашего курса.`,
// 					{
// 						chat_id: telegramId,
// 						message_id: messageId,
// 					}
// 				)
// 			}

// 			await bot.answerCallbackQuery(query.id)
// 		} catch (error) {
// 			console.error(
// 				'Error handling callback query:',
// 				error.message,
// 				error.stack
// 			)
// 			await bot.sendMessage(telegramId, 'Произошла ошибка. Попробуйте позже.')
// 		}
// 	})

// 	bot.on('polling_error', error => {
// 		console.error('Telegram polling error:', error.message)
// 	})
// } catch (error) {
// 	console.error('Failed to initialize Telegram Bot:', error.message)
// 	bot = null
// }

// module.exports = bot
