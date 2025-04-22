const prisma = require('../lib/prisma')
const bot = require('../config/telegram')

const createReminder = async (courseId, userId, schedule) => {
	const reminders = []

	const user = await prisma.user.findUnique({ where: { id: userId } })
	if (!user) {
		throw new Error(`User with id ${userId} not found`)
	}

	// Напоминания о приёме БАДов
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

		if (bot) {
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

		if (bot) {
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

		if (bot) {
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
		}
	}

	// Напоминание о повторных анализах
	if (schedule.analysisReminder) {
		const reminder = await prisma.reminder.create({
			data: {
				courseId,
				userId,
				type: 'ANALYSIS',
				time: new Date(Date.now() + 8 * 7 * 24 * 60 * 60 * 1000), // 8 недель
				message: schedule.analysisReminder,
			},
		})
		reminders.push(reminder)

		if (bot) {
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
		}
	}

	// Микро-опрос
	if (schedule.survey) {
		const reminder = await prisma.reminder.create({
			data: {
				courseId,
				userId,
				type: 'SURVEY',
				time: new Date(Date.now() + 24 * 60 * 60 * 1000), // На следующий день
				message: schedule.survey.message,
			},
		})
		reminders.push(reminder)

		if (bot) {
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
		}
	}

	return reminders
}

module.exports = { createReminder }
