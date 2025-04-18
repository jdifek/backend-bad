// Документация типов для разрабов
const Supplement = {
	name: 'string',
	dose: 'string',
	brand: 'string (optional)',
}

const Schedule = {
	morning: ['string'],
	afternoon: ['string'],
	evening: ['string'],
}

const Course = {
	goal: 'string',
	supplements: [Supplement],
	schedule: Schedule,
	duration: 'number',
	isPremium: 'boolean',
}

const FoodAnalysis = {
	photoUrl: 'string',
	calories: 'number',
	nutrients: {
		protein: 'number',
		fats: 'number',
		carbs: 'number',
	},
	suggestions: 'string',
}

module.exports = { Supplement, Schedule, Course, FoodAnalysis }
