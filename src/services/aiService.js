const OpenAI = require('openai')

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

const generateCourse = async (goal, supplements) => {
	if (!process.env.OPENAI_API_KEY) {
		console.error('OPENAI_API_KEY is not set in .env')
		throw new Error('OpenAI API key is missing')
	}

	const prompt = `
    Ты — ИИ-нутрициолог. Пользователь выбрал цель: "${goal}". У него есть добавки: ${supplements.join(
		', '
	)}.
    Составь персональный курс приёма БАДов. Укажи:
    - Название БАДа
    - Дозировку (если неизвестно, предложи стандартную или уточни)
    - Время приёма (утро/день/вечер)
    - Длительность курса (по умолчанию 30 дней)
    - Советы по усилению курса
    - Предостережения (например, "Проконсультируйся с врачом")
    - Уточняющие вопросы (например, "Какой бренд магния?")
    Используй простой, дружелюбный язык. Верни ответ в формате JSON:
    {
      "supplements": [{ "name": "", "dose": "", "time": "" }],
      "duration": 30,
      "suggestions": "",
      "warnings": "",
      "questions": []
    }
  `

	try {
		console.log('Attempting to call OpenAI with model: gpt-4o-mini')
		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [{ role: 'user', content: prompt }],
			response_format: { type: 'json_object' },
		})

		const result = JSON.parse(response.choices[0].message.content)
		console.log('OpenAI response:', result)
		return result
	} catch (error) {
		console.error('Error with GPT-4o:', error.message, error.stack)
		throw new Error(`Failed to generate course: ${error.message}`)
	}
}

const recognizeSupplementPhoto = async photoUrl => {
	if (!process.env.OPENAI_API_KEY) {
		console.error('OPENAI_API_KEY is not set in .env')
		throw new Error('OpenAI API key is missing')
	}

	const prompt = `
    Ты — ИИ-нутрициолог. Тебе предоставлено изображение баночки с БАДом. Твоя задача:
    - Распознать название БАДа на упаковке.
    - Если название неразборчиво, вернуть "Unknown Supplement".
    - Вернуть ответ в формате JSON: { "name": "Название БАДа" }
    Используй простой и точный подход. Если на фото несколько БАДов, верни название самого заметного.
  `

	try {
		console.log('Calling GPT-4 Vision for photo recognition:', photoUrl)
		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'user',
					content: [
						{ type: 'text', text: prompt },
						{ type: 'image_url', image_url: { url: photoUrl } },
					],
				},
			],
			response_format: { type: 'json_object' },
		})

		const result = JSON.parse(response.choices[0].message.content)
		console.log('GPT-4 Vision result:', result)
		return result.name || 'Unknown Supplement'
	} catch (error) {
		console.error('Error with GPT-4 Vision:', error.message, error.stack)
		throw new Error(`Failed to recognize supplement: ${error.message}`)
	}
}

const generateAnalysisCourse = async (goal, photoUrl, checklist) => {
	if (!process.env.OPENAI_API_KEY) {
		console.error('OPENAI_API_KEY is not set in .env')
		throw new Error('OpenAI API key is missing')
	}

	const prompt = `
    Ты — ИИ-нутрициолог. Пользователь предоставил цель: "${goal}" и фото анализов (URL: ${photoUrl}).
    Проверенные биомаркеры: ${checklist.join(', ')}.
    Твоя задача:
    - Распознать данные анализов на фото (значения биомаркеров, например, Витамин D, Ферритин, Магний и т.д.).
    - Сопоставить значения с нормами (используй стандартные медицинские референсы).
    - Выявить дефициты или отклонения.
    - Составить персональный курс приёма БАДов, учитывая цель и дефициты.
    - Указать:
      - Название БАДа
      - Дозировку (стандартную или уточнить)
      - Время приёма (утро/день/вечер)
      - Длительность курса (по умолчанию 60 дней)
      - Советы по усилению курса
      - Предостережения (например, "Проконсультируйся с врачом")
      - Уточняющие вопросы (например, "Есть ли у тебя аллергия на витамин С?")
      - Рекомендации по повторным анализам (например, "Повторить через 8 недель")
    Используй простой, дружелюбный язык. Верни ответ в формате JSON:
    {
      "supplements": [{ "name": "", "dose": "", "time": "" }],
      "duration": 60,
      "suggestions": "",
      "warnings": "",
      "questions": [],
      "repeatAnalysis": ""
    }
  `

	try {
		console.log('Calling GPT-4 Vision for analysis photo:', photoUrl)
		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'user',
					content: [
						{ type: 'text', text: prompt },
						{ type: 'image_url', image_url: { url: photoUrl } },
					],
				},
			],
			response_format: { type: 'json_object' },
		})

		const result = JSON.parse(response.choices[0].message.content)
		console.log('GPT-4 Vision analysis result:', result)
		return {
			...result,
			isPremium: true,
		}
	} catch (error) {
		console.error(
			'Error with GPT-4 Vision for analysis:',
			error.message,
			error.stack
		)
		throw new Error(`Failed to generate analysis course: ${error.message}`)
	}
}

const analyzeFoodPhoto = async photoUrl => {
	if (!process.env.OPENAI_API_KEY) {
		console.error('OPENAI_API_KEY is not set in .env')
		throw new Error('OpenAI API key is missing')
	}

	const prompt = `
    Ты — ИИ-нутрициолог. Тебе предоставлено изображение еды (URL: ${photoUrl}). Твоя задача:
    - Распознать блюда или ингредиенты на фото.
    - Оценить калорийность и содержание макронутриентов (белки, жиры, углеводы).
    - Дать рекомендации по улучшению питания (например, "Добавь белок", "Слишком много сахара", "Мало клетчатки").
    - Указать уточняющие вопросы (например, "Какова была порция?", "Добавлялись ли соусы?").
    - Если блюдо не распознано, укажи это и предложи пользователю ввести данные вручную.
    Используй простой, дружелюбный язык. Верни ответ в формате JSON:
    {
      "dish": "Название блюда или описание",
      "calories": 0,
      "nutrients": { "protein": 0, "fats": 0, "carbs": 0 },
      "suggestions": "",
      "questions": [],
      "warnings": ""
    }
  `

	try {
		console.log('Calling GPT-4 Vision for food photo analysis:', photoUrl)
		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'user',
					content: [
						{ type: 'text', text: prompt },
						{ type: 'image_url', image_url: { url: photoUrl } },
					],
				},
			],
			response_format: { type: 'json_object' },
		})

		const result = JSON.parse(response.choices[0].message.content)
		console.log('GPT-4 Vision food analysis result:', result)
		return result
	} catch (error) {
		console.error(
			'Error with GPT-4 Vision for food analysis:',
			error.message,
			error.stack
		)
		throw new Error(`Failed to analyze food photo: ${error.message}`)
	}
}

module.exports = {
	generateCourse,
	recognizeSupplementPhoto,
	generateAnalysisCourse,
	analyzeFoodPhoto,
}
