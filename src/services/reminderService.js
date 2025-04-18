const prisma = require('../lib/prisma')
const bot = require('../config/telegram')

const createReminder = async (courseId, userId, schedule) => {
	const reminders = []

	if (schedule.morning?.length) {
		const reminder = await prisma.reminder.create({
			data: {
				courseId,
				userId,
				time: new Date(), // TODO: Установить правильное время
				message: `Пора принять утренние добавки: ${schedule.morning.join(
					', '
				)}`,
			},
		})
		reminders.push(reminder)

		if (bot) {
			const user = await prisma.user.findUnique({ where: { id: userId } })
			if (user) {
				try {
					await bot.sendMessage(user.telegramId, reminder.message)
					console.log(
						`Telegram message sent to ${user.telegramId}: ${reminder.message}`
					)
				} catch (error) {
					console.error(
						`Failed to send Telegram message to ${user.telegramId}: ${error.message}`
					)
				}
			} else {
				console.warn(`User with id ${userId} not found for reminder`)
			}
		} else {
			console.warn('Telegram Bot is not initialized, skipping message sending')
		}
	}

	if (schedule.analysisReminder) {
		const reminder = await prisma.reminder.create({
			data: {
				courseId,
				userId,
				time: new Date(Date.now() + 8 * 7 * 24 * 60 * 60 * 1000), // 8 недель
				message: schedule.analysisReminder,
			},
		})
		reminders.push(reminder)

		if (bot) {
			const user = await prisma.user.findUnique({ where: { id: userId } })
			if (user) {
				try {
					await bot.sendMessage(user.telegramId, reminder.message)
					console.log(
						`Telegram message sent to ${user.telegramId}: ${reminder.message}`
					)
				} catch (error) {
					console.error(
						`Failed to send Telegram message to ${user.telegramId}: ${error.message}`
					)
				}
			} else {
				console.warn(`User with id ${userId} not found for reminder`)
			}
		} else {
			console.warn('Telegram Bot is not initialized, skipping message sending')
		}
	}

	return reminders
}

module.exports = { createReminder }
