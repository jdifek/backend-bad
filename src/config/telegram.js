const TelegramBot = require('node-telegram-bot-api')
const dotenv = require('dotenv')

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

	bot.on('message', msg => {
		console.log(`Received message from ${msg.chat.id}: ${msg.text}`)
	})

	bot.on('polling_error', error => {
		console.error('Telegram polling error:', error.message)
	})
} catch (error) {
	console.error('Failed to initialize Telegram Bot:', error.message)
	bot = null
}

module.exports = bot
