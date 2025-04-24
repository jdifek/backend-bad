const prisma = require('../lib/prisma')
const bot = require('../config/telegram')

const createReminder = async (courseId, userId, schedule) => {
	const reminders = []

	const user = await prisma.user.findUnique({ where: { id: userId } })
	if (!user) {
		throw new Error(`User with id ${userId} not found`)
	}

	console.log(
		`Creating reminders for user ${user.telegramId}, course ${courseId}`
	)

	// Проверка, начал ли пользователь чат с ботом
	const canSendMessages = async telegramId => {
		if (!bot) {
			console.error(`Bot is not initialized for ${telegramId}`)
			return false
		}
		try {
			// Тестовый запрос к Telegram API для проверки статуса чата
			await bot.getChat(telegramId)
			return true
		} catch (error) {
			console.error(`Cannot send message to ${telegramId}:`, error.message)
			return false
		}
	}

	// Напоминания о приёме БАДов (SUPPLEMENT)
	if (schedule.morning?.length) {
		const reminder = await prisma.reminder.create({
			data: {
				courseId,
				userId,
				type: 'SUPPLEMENT',
				time: '08:00',
				message: `Пора принять утренние добавки: ${schedule.morning.join(
					', '
				)}`,
			},
		})
		reminders.push(reminder)

		if (await canSendMessages(user.telegramId)) {
			try {
				await bot.sendMessage(user.telegramId, reminder.message, {
					reply_markup: {
						inline_keyboard: [
							[
								{
									text: 'Выпил ✅',
									callback_data: `supplement_taken_${reminder.id}`,
								},
								{
									text: 'Пропустил ❌',
									callback_data: `supplement_skipped_${reminder.id}`,
								},
							],
						],
					},
				})
				console.log(
					`Telegram SUPPLEMENT message sent to ${user.telegramId}: ${reminder.message}`
				)
			} catch (error) {
				console.error(
					`Failed to send Telegram SUPPLEMENT message to ${user.telegramId}: ${error.message}`
				)
			}
		} else {
			console.warn(
				`Skipped sending SUPPLEMENT message to ${user.telegramId}: User has not started chat with bot`
			)
		}
	}

	if (schedule.afternoon?.length) {
		const reminder = await prisma.reminder.create({
			data: {
				courseId,
				userId,
				type: 'SUPPLEMENT',
				time: '14:00',
				message: `Пора принять дневные добавки: ${schedule.afternoon.join(
					', '
				)}`,
			},
		})
		reminders.push(reminder)

		if (await canSendMessages(user.telegramId)) {
			try {
				await bot.sendMessage(user.telegramId, reminder.message, {
					reply_markup: {
						inline_keyboard: [
							[
								{
									text: 'Выпил ✅',
									callback_data: `supplement_taken_${reminder.id}`,
								},
								{
									text: 'Пропустил ❌',
									callback_data: `supplement_skipped_${reminder.id}`,
								},
							],
						],
					},
				})
				console.log(
					`Telegram SUPPLEMENT message sent to ${user.telegramId}: ${reminder.message}`
				)
			} catch (error) {
				console.error(
					`Failed to send Telegram SUPPLEMENT message to ${user.telegramId}: ${error.message}`
				)
			}
		} else {
			console.warn(
				`Skipped sending SUPPLEMENT message to ${user.telegramId}: User has not started chat with bot`
			)
		}
	}

	if (schedule.evening?.length) {
		const reminder = await prisma.reminder.create({
			data: {
				courseId,
				userId,
				type: 'SUPPLEMENT',
				time: '20:00',
				message: `Пора принять вечерние добавки: ${schedule.evening.join(
					', '
				)}`,
			},
		})
		reminders.push(reminder)

		if (await canSendMessages(user.telegramId)) {
			try {
				await bot.sendMessage(user.telegramId, reminder.message, {
					reply_markup: {
						inline_keyboard: [
							[
								{
									text: 'Выпил ✅',
									callback_data: `supplement_taken_${reminder.id}`,
								},
								{
									text: 'Пропустил ❌',
									callback_data: `supplement_skipped_${reminder.id}`,
								},
							],
						],
					},
				})
				console.log(
					`Telegram SUPPLEMENT message sent to ${user.telegramId}: ${reminder.message}`
				)
			} catch (error) {
				console.error(
					`Failed to send Telegram SUPPLEMENT message to ${user.telegramId}: ${error.message}`
				)
			}
		} else {
			console.warn(
				`Skipped sending SUPPLEMENT message to ${user.telegramId}: User has not started chat with bot`
			)
		}
	}

	// Напоминание о повторных анализах (ANALYSIS)
	if (schedule.analysisReminder) {
		const analysisTime = new Date(Date.now() + 8 * 7 * 24 * 60 * 60 * 1000) // 8 недель
		const formattedTime = analysisTime.toISOString()
		console.log(
			`Creating ANALYSIS reminder for ${user.telegramId}: ${formattedTime}`
		)

		const reminder = await prisma.reminder.create({
			data: {
				courseId,
				userId,
				type: 'ANALYSIS',
				time: formattedTime,
				message: schedule.analysisReminder,
			},
		})
		reminders.push(reminder)

		if (await canSendMessages(user.telegramId)) {
			try {
				await bot.sendMessage(user.telegramId, reminder.message)
				console.log(
					`Telegram ANALYSIS message sent to ${user.telegramId}: ${reminder.message}`
				)
			} catch (error) {
				console.error(
					`Failed to send Telegram ANALYSIS message to ${user.telegramId}: ${error.message}`
				)
			}
		} else {
			console.warn(
				`Skipped sending ANALYSIS message to ${user.telegramId}: User has not started chat with bot`
			)
		}
	}

	// Микро-опрос (SURVEY)
	if (schedule.survey) {
		const surveyTime = new Date(Date.now() + 24 * 60 * 60 * 1000) // На следующий день
		const formattedSurveyTime = surveyTime.toISOString()
		console.log(
			`Creating SURVEY reminder for ${user.telegramId}: ${formattedSurveyTime}`
		)

		const reminder = await prisma.reminder.create({
			data: {
				courseId,
				userId,
				type: 'SURVEY',
				time: formattedSurveyTime,
				message: schedule.survey.message,
			},
		})
		reminders.push(reminder)

		if (await canSendMessages(user.telegramId)) {
			try {
				await bot.sendMessage(user.telegramId, reminder.message, {
					reply_markup: {
						inline_keyboard: [
							[
								{
									text: 'Хорошо 😊',
									callback_data: `survey_good_${reminder.id}`,
								},
								{
									text: 'Нормально 😐',
									callback_data: `survey_normal_${reminder.id}`,
								},
								{
									text: 'Плохо 😔',
									callback_data: `survey_bad_${reminder.id}`,
								},
							],
						],
					},
				})
				console.log(
					`Telegram SURVEY message sent to ${user.telegramId}: ${reminder.message}`
				)
			} catch (error) {
				console.error(
					`Failed to send Telegram SURVEY message to ${user.telegramId}: ${error.message}`
				)
			}
		} else {
			console.warn(
				`Skipped sending SURVEY message to ${user.telegramId}: User has not started chat with bot`
			)
		}
	}

	console.log(
		`Created ${reminders.length} reminders for user ${user.telegramId}`
	)
	return reminders
}

module.exports = { createReminder }

// const prisma = require('../lib/prisma')
// const bot = require('../config/telegram')

// const createReminder = async (courseId, userId, schedule) => {
// 	const reminders = []

// 	const user = await prisma.user.findUnique({ where: { id: userId } })
// 	if (!user) {
// 		throw new Error(`User with id ${userId} not found`)
// 	}

// 	// Напоминания о приёме БАДов
// 	if (schedule.morning?.length) {
// 		const reminder = await prisma.reminder.create({
// 			data: {
// 				courseId,
// 				userId,
// 				type: 'SUPPLEMENT',
// 				time: '08:00',
// 				message: `Пора принять утренние добавки: ${schedule.morning.join(
// 					', '
// 				)}`,
// 			},
// 		})
// 		reminders.push(reminder)

// 		if (bot) {
// 			try {
// 				await bot.sendMessage(user.telegramId, reminder.message, {
// 					reply_markup: {
// 						inline_keyboard: [
// 							[
// 								{
// 									text: 'Выпил ✅',
// 									callback_data: `supplement_taken_${reminder.id}`,
// 								},
// 								{
// 									text: 'Пропустил ❌',
// 									callback_data: `supplement_skipped_${reminder.id}`,
// 								},
// 							],
// 						],
// 					},
// 				})
// 				console.log(
// 					`Telegram SUPPLEMENT message sent to ${user.telegramId}: ${reminder.message}`
// 				)
// 			} catch (error) {
// 				console.error(
// 					`Failed to send Telegram SUPPLEMENT message to ${user.telegramId}: ${error.message}`
// 				)
// 			}
// 		}
// 	}

// 	if (schedule.afternoon?.length) {
// 		const reminder = await prisma.reminder.create({
// 			data: {
// 				courseId,
// 				userId,
// 				type: 'SUPPLEMENT',
// 				time: '14:00',
// 				message: `Пора принять дневные добавки: ${schedule.afternoon.join(
// 					', '
// 				)}`,
// 			},
// 		})
// 		reminders.push(reminder)

// 		if (bot) {
// 			try {
// 				await bot.sendMessage(user.telegramId, reminder.message, {
// 					reply_markup: {
// 						inline_keyboard: [
// 							[
// 								{
// 									text: 'Выпил ✅',
// 									callback_data: `supplement_taken_${reminder.id}`,
// 								},
// 								{
// 									text: 'Пропустил ❌',
// 									callback_data: `supplement_skipped_${reminder.id}`,
// 								},
// 							],
// 						],
// 					},
// 				})
// 				console.log(
// 					`Telegram SUPPLEMENT message sent to ${user.telegramId}: ${reminder.message}`
// 				)
// 			} catch (error) {
// 				console.error(
// 					`Failed to send Telegram SUPPLEMENT message to ${user.telegramId}: ${error.message}`
// 				)
// 			}
// 		}
// 	}

// 	if (schedule.evening?.length) {
// 		const reminder = await prisma.reminder.create({
// 			data: {
// 				courseId,
// 				userId,
// 				type: 'SUPPLEMENT',
// 				time: '20:00',
// 				message: `Пора принять вечерние добавки: ${schedule.evening.join(
// 					', '
// 				)}`,
// 			},
// 		})
// 		reminders.push(reminder)

// 		if (bot) {
// 			try {
// 				await bot.sendMessage(user.telegramId, reminder.message, {
// 					reply_markup: {
// 						inline_keyboard: [
// 							[
// 								{
// 									text: 'Выпил ✅',
// 									callback_data: `supplement_taken_${reminder.id}`,
// 								},
// 								{
// 									text: 'Пропустил ❌',
// 									callback_data: `supplement_skipped_${reminder.id}`,
// 								},
// 							],
// 						],
// 					},
// 				})
// 				console.log(
// 					`Telegram SUPPLEMENT message sent to ${user.telegramId}: ${reminder.message}`
// 				)
// 			} catch (error) {
// 				console.error(
// 					`Failed to send Telegram SUPPLEMENT message to ${user.telegramId}: ${error.message}`
// 				)
// 			}
// 		}
// 	}

// 	// Напоминание о повторных анализах
// 	if (schedule.analysisReminder) {
// 		const analysisTime = new Date(Date.now() + 8 * 7 * 24 * 60 * 60 * 1000) // 8 недель
// 		const formattedTime = analysisTime.toISOString()
// 		const reminder = await prisma.reminder.create({
// 			data: {
// 				courseId,
// 				userId,
// 				type: 'ANALYSIS',
// 				time: formattedTime,
// 				message: schedule.analysisReminder,
// 			},
// 		})
// 		reminders.push(reminder)

// 		if (bot) {
// 			try {
// 				await bot.sendMessage(user.telegramId, reminder.message)
// 				console.log(
// 					`Telegram ANALYSIS message sent to ${user.telegramId}: ${reminder.message}`
// 				)
// 			} catch (error) {
// 				console.error(
// 					`Failed to send Telegram ANALYSIS message to ${user.telegramId}: ${error.message}`
// 				)
// 			}
// 		}
// 	}

// 	// Микро-опрос
// 	if (schedule.survey) {
// 		const surveyTime = new Date(Date.now() + 24 * 60 * 60 * 1000) // На следующий день
// 		const formattedSurveyTime = surveyTime.toISOString()
// 		const reminder = await prisma.reminder.create({
// 			data: {
// 				courseId,
// 				userId,
// 				type: 'SURVEY',
// 				time: formattedSurveyTime,
// 				message: schedule.survey.message,
// 			},
// 		})
// 		reminders.push(reminder)

// 		if (bot) {
// 			try {
// 				await bot.sendMessage(user.telegramId, reminder.message, {
// 					reply_markup: {
// 						inline_keyboard: [
// 							[
// 								{
// 									text: 'Хорошо 😊',
// 									callback_data: `survey_good_${reminder.id}`,
// 								},
// 								{
// 									text: 'Нормально 😐',
// 									callback_data: `survey_normal_${reminder.id}`,
// 								},
// 								{
// 									text: 'Плохо 😔',
// 									callback_data: `survey_bad_${reminder.id}`,
// 								},
// 							],
// 						],
// 					},
// 				})
// 				console.log(
// 					`Telegram SURVEY message sent to ${user.telegramId}: ${reminder.message}`
// 				)
// 			} catch (error) {
// 				console.error(
// 					`Failed to send Telegram SURVEY message to ${user.telegramId}: ${error.message}`
// 				)
// 			}
// 		}
// 	}

// 	return reminders
// }

// module.exports = { createReminder }
