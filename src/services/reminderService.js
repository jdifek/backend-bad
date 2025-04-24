const prisma = require('../lib/prisma')
const schedule = require('node-schedule')
const bot = require('../config/telegram')

const createReminder = async (courseId, userId, schedule) => {
	const reminders = []
	const failedMessages = []

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

	const sendReminderMessage = async (reminder, telegramId) => {
		if (await canSendMessages(telegramId)) {
			try {
				const options =
					reminder.type === 'SUPPLEMENT'
						? {
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
						  }
						: reminder.type === 'SURVEY'
						? {
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
						  }
						: {}

				await bot.sendMessage(telegramId, reminder.message, options)
				console.log(
					`Telegram ${reminder.type} message sent to ${telegramId}: ${reminder.message}`
				)
			} catch (error) {
				console.error(
					`Failed to send Telegram ${reminder.type} message to ${telegramId}:`,
					error.message
				)
				failedMessages.push({
					type: reminder.type,
					message: reminder.message,
					error: error.message,
				})
			}
		} else {
			console.warn(
				`Skipped sending ${reminder.type} message to ${telegramId}: User has not started chat with bot`
			)
			failedMessages.push({
				type: reminder.type,
				message: reminder.message,
				error: 'User has not started chat with bot',
			})
		}
	}

	// Напоминания о приёме БАДов (SUPPLEMENT)
	const supplementTimes = [
		{ time: '08:00', supplements: schedule.morning, period: 'утренние' },
		{ time: '14:00', supplements: schedule.afternoon, period: 'дневные' },
		{ time: '20:00', supplements: schedule.evening, period: 'вечерние' },
	]

	for (const { time, supplements, period } of supplementTimes) {
		if (supplements?.length) {
			const reminder = await prisma.reminder.create({
				data: {
					courseId,
					userId,
					type: 'SUPPLEMENT',
					time,
					message: `Пора принять ${period} добавки: ${supplements.join(', ')}`,
				},
			})
			reminders.push(reminder)

			// Отправляем сразу
			await sendReminderMessage(reminder, user.telegramId)

			// Планируем ежедневное напоминание
			schedule.scheduleJob(
				`supplement_${reminder.id}`,
				`${time.split(':')[1]} ${time.split(':')[0]} * * *`,
				async () => {
					await sendReminderMessage(reminder, user.telegramId)
				}
			)
		}
	}

	// if (schedule.morning?.length) {
	// 	const reminder = await prisma.reminder.create({
	// 		data: {
	// 			courseId,
	// 			userId,
	// 			type: 'SUPPLEMENT',
	// 			time: '08:00',
	// 			message: `Пора принять утренние добавки: ${schedule.morning.join(
	// 				', '
	// 			)}`,
	// 		},
	// 	})
	// 	reminders.push(reminder)

	// 	if (await canSendMessages(user.telegramId)) {
	// 		try {
	// 			await bot.sendMessage(user.telegramId, reminder.message, {
	// 				reply_markup: {
	// 					inline_keyboard: [
	// 						[
	// 							{
	// 								text: 'Выпил ✅',
	// 								callback_data: `supplement_taken_${reminder.id}`,
	// 							},
	// 							{
	// 								text: 'Пропустил ❌',
	// 								callback_data: `supplement_skipped_${reminder.id}`,
	// 							},
	// 						],
	// 					],
	// 				},
	// 			})
	// 			console.log(
	// 				`Telegram SUPPLEMENT message sent to ${user.telegramId}: ${reminder.message}`
	// 			)
	// 		} catch (error) {
	// 			console.error(
	// 				`Failed to send Telegram SUPPLEMENT message to ${user.telegramId}: ${error.message}`
	// 			)
	// 		}
	// 	} else {
	// 		console.warn(
	// 			`Skipped sending SUPPLEMENT message to ${user.telegramId}: User has not started chat with bot`
	// 		)
	// 	}
	// }

	// if (schedule.afternoon?.length) {
	// 	const reminder = await prisma.reminder.create({
	// 		data: {
	// 			courseId,
	// 			userId,
	// 			type: 'SUPPLEMENT',
	// 			time: '14:00',
	// 			message: `Пора принять дневные добавки: ${schedule.afternoon.join(
	// 				', '
	// 			)}`,
	// 		},
	// 	})
	// 	reminders.push(reminder)

	// 	if (await canSendMessages(user.telegramId)) {
	// 		try {
	// 			await bot.sendMessage(user.telegramId, reminder.message, {
	// 				reply_markup: {
	// 					inline_keyboard: [
	// 						[
	// 							{
	// 								text: 'Выпил ✅',
	// 								callback_data: `supplement_taken_${reminder.id}`,
	// 							},
	// 							{
	// 								text: 'Пропустил ❌',
	// 								callback_data: `supplement_skipped_${reminder.id}`,
	// 							},
	// 						],
	// 					],
	// 				},
	// 			})
	// 			console.log(
	// 				`Telegram SUPPLEMENT message sent to ${user.telegramId}: ${reminder.message}`
	// 			)
	// 		} catch (error) {
	// 			console.error(
	// 				`Failed to send Telegram SUPPLEMENT message to ${user.telegramId}: ${error.message}`
	// 			)
	// 		}
	// 	} else {
	// 		console.warn(
	// 			`Skipped sending SUPPLEMENT message to ${user.telegramId}: User has not started chat with bot`
	// 		)
	// 	}
	// }

	// if (schedule.evening?.length) {
	// 	const reminder = await prisma.reminder.create({
	// 		data: {
	// 			courseId,
	// 			userId,
	// 			type: 'SUPPLEMENT',
	// 			time: '20:00',
	// 			message: `Пора принять вечерние добавки: ${schedule.evening.join(
	// 				', '
	// 			)}`,
	// 		},
	// 	})
	// 	reminders.push(reminder)

	// 	if (await canSendMessages(user.telegramId)) {
	// 		try {
	// 			await bot.sendMessage(user.telegramId, reminder.message, {
	// 				reply_markup: {
	// 					inline_keyboard: [
	// 						[
	// 							{
	// 								text: 'Выпил ✅',
	// 								callback_data: `supplement_taken_${reminder.id}`,
	// 							},
	// 							{
	// 								text: 'Пропустил ❌',
	// 								callback_data: `supplement_skipped_${reminder.id}`,
	// 							},
	// 						],
	// 					],
	// 				},
	// 			})
	// 			console.log(
	// 				`Telegram SUPPLEMENT message sent to ${user.telegramId}: ${reminder.message}`
	// 			)
	// 		} catch (error) {
	// 			console.error(
	// 				`Failed to send Telegram SUPPLEMENT message to ${user.telegramId}: ${error.message}`
	// 			)
	// 		}
	// 	} else {
	// 		console.warn(
	// 			`Skipped sending SUPPLEMENT message to ${user.telegramId}: User has not started chat with bot`
	// 		)
	// 	}
	// }

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

		// Отправляем сразу
		await sendReminderMessage(reminder, user.telegramId)

		// Планируем одноразовое напоминание
		schedule.scheduleJob(`analysis_${reminder.id}`, analysisTime, async () => {
			await sendReminderMessage(reminder, user.telegramId)
		})
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

		// Отправляем сразу
		await sendReminderMessage(reminder, user.telegramId)

		// Планируем ежедневный опрос в 09:00
		schedule.scheduleJob(`survey_${reminder.id}`, `0 9 * * *`, async () => {
			const newReminder = await prisma.reminder.create({
				data: {
					courseId,
					userId,
					type: 'SURVEY',
					time: new Date().toISOString(),
					message: schedule.survey.message,
				},
			})
			await sendReminderMessage(newReminder, user.telegramId)
		})
	}

	console.log(
		`Created ${reminders.length} reminders for user ${user.telegramId}`
	)
	return { reminders, failedMessages }
}

const cancelReminders = async courseId => {
	const reminders = await prisma.reminder.findMany({ where: { courseId } })
	for (const reminder of reminders) {
		const job =
			schedule.scheduledJobs[`${reminder.type.toLowerCase()}_${reminder.id}`]
		if (job) {
			job.cancel()
			console.log(
				`Cancelled ${reminder.type} reminder ${reminder.id} for course ${courseId}`
			)
		}
	}
}

module.exports = { createReminder, cancelReminders }
