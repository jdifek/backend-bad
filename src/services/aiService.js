const OpenAI = require('openai');

const fetch = require('node-fetch');
const pdfParse = require('pdf-parse');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const analyzeManualFoodInput = async (dish, grams) => {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set in .env');
    throw new Error('OpenAI API key is missing');
  }

  const prompt = `
    Ты — ИИ-нутрициолог. Пользователь указал блюдо: "${dish}" и его вес: ${grams} грамм. Твоя задача:
    - Распознать блюдо или его основные ингредиенты.
    - Оценить калорийность и содержание макронутриентов (белки, жиры, углеводы) для указанного веса.
    - Дать рекомендации по улучшению питания (например, "Добавь белок", "Слишком много сахара").
    - Указать уточняющие вопросы (например, "Какова была порция?", "Добавлялись ли соусы?").
    - Если блюдо не распознано, укажи это и предложи пользователю уточнить состав.
    - Перепроверить всю информацию и выдать максимально точные данные
    Используй простой, дружелюбный язык. Верни ответ в формате JSON:
    {
      "dish": "Название блюда или описание",
      "calories": 0,
      "nutrients": { "protein": 0, "fats": 0, "carbs": 0 },
      "suggestions": "",
      "questions": [],
      "warnings": ""
    }
  `;

  try {
    console.log('Calling GPT-4o-mini for manual food analysis:', dish, grams);
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log('GPT-4o-mini manual food analysis result:', result);

    // Масштабируем значения КБЖУ в зависимости от веса (если ИИ вернул данные для 100 г)
    const scaleFactor = grams / 100;
    return {
      dish: result.dish,
      calories: result.calories * scaleFactor,
      nutrients: {
        protein: result.nutrients.protein * scaleFactor,
        fats: result.nutrients.fats * scaleFactor,
        carbs: result.nutrients.carbs * scaleFactor,
      },
      suggestions: result.suggestions,
      questions: result.questions,
      warnings: result.warnings,
    };
  } catch (error) {
    console.error('Error with GPT-4o-mini for manual food analysis:', error.message, error.stack);
    throw new Error(`Failed to analyze manual food input: ${error.message}`);
  }
};
const generateCourse = async (goal, supplements = [], dietPreference = 'none') => {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set in .env');
    throw new Error('OpenAI API key is missing');
  }

  const dietInstruction = dietPreference !== 'none'
    ? `Пользователь следует ${dietPreference === 'vegan' ? 'веганской' : 'вегетарианской'} диете. Исключи добавки животного происхождения (например, рыбий жир) и предлагай только растительные альтернативы (например, омега-3 из водорослей).`
    : '';

  const supplementPrompt = supplements.length > 0
    ? `У пользователя есть добавки: ${supplements.join(', ')}. Обязательно включи ВСЕ эти добавки в курс, подобрав подходящие дозировки и время приёма.`
    : '';

  const prompt = `
   Ты — ИИ-нутрициолог. Пользователь выбрал цель: "${goal}".
${supplementPrompt}
${dietInstruction}

Базовые витамины: Омега-3, Витамин D, Магний, Цинк, Пробиотики, Витамин С.  
Базовые цели: Повысить концентрацию, Энергия/бодрость, Улучшить сон, Поддержка иммунитета, Снижение веса, Набор массы, Улучшить память, Повысить тестостерон.

Обязательно включи добавку "Ежовик гребенчатый" (Hericium erinaceus) с дозировкой 1600 мг, время приёма: утро, инструкция: до еды.

Если цель входит в базовые цели, используй фиксированный курс для этой цели (см. ниже), добавляя:

- Все указанные пользователем добавки (с дозировкой и временем приёма),
- **Дополнительно 2–3 новых добавки**, которых нет среди пользовательских и обязательных — они должны усиливать эффект в рамках цели.

Если цель **не входит** в базовые, то:

- Обязательно добавь ежовик,
- Включи все добавки, указанные пользователем,
- Подбери 2–4 дополнительных добавки, включая подходящие базовые витамины, если они уместны,
- Убедись, что минимум 2–3 добавки **новые**, которых не было у пользователя.

Если пользователь **не указал свои добавки**, всё равно добавляй 2–3 дополнительных добавки, усиливающих эффект (например, из списка базовых витаминов или адаптогенов, нейропептидов и т.д.).

Фиксированные курсы по базовым целям:

- Повысить концентрацию: Ежовик гребенчатый (1600 мг, утро, до еды), Омега-3 (1000 мг, вечер, с едой), Магний (400 мг, вечер, после еды), Витамин С (500 мг, утро, с едой).
- Энергия/бодрость: Ежовик гребенчатый (1600 мг, утро, до еды), Витамин С (1000 мг, утро, с едой), Магний (400 мг, день, после еды), Цинк (15 мг, вечер, с едой).
- Улучшить сон: Ежовик гребенчатый (1600 мг, утро, до еды), Магний (400 мг, вечер, после еды), Пробиотики (10 млрд КОЕ, вечер, до еды).
- Поддержка иммунитета: Ежовик гребенчатый (1600 мг, утро, до еды), Витамин D (2000 МЕ, утро, с едой), Витамин С (1000 мг, день, с едой), Цинк (15 мг, вечер, с едой).
- Снижение веса: Ежовик гребенчатый (1600 мг, утро, до еды), Омега-3 (1000 мг, утро, с едой), Пробиотики (10 млрд КОЕ, вечер, до еды).
- Набор массы: Ежовик гребенчатый (1600 мг, утро, до еды), Цинк (15 мг, вечер, с едой), Магний (400 мг, вечер, после еды), Витамин D (2000 МЕ, утро, с едой).
- Улучшить память: Ежовик гребенчатый (1600 мг, утро, до еды), Омега-3 (1000 мг, вечер, с едой), Магний (400 мг, вечер, после еды).
- Повысить тестостерон: Ежовик гребенчатый (1600 мг, утро, до еды), Цинк (15 мг, вечер, с едой), Витамин D (2000 МЕ, утро, с едой), Магний (400 мг, вечер, после еды).

Составь персональный курс приёма БАДов. Укажи:
- Название БАДа
- Дозировку (стандартную или уточни)
- Время приёма (строго: "утро", "день", "вечер")
- Инструкции по приёму (строго: "до еды", "во время еды", "после еды")
- Длительность курса (по умолчанию 30 дней)
- Советы по усилению курса
- Предостережения (например, "Проконсультируйся с врачом")
- Уточняющие вопросы (например, "Какой бренд магния?")
- Рекомендации по повторным анализам (например, "Повторить через 8 недель")

Ответ верни в формате JSON:
{
  "supplements": [
    { "name": "", "dose": "", "time": "", "intakeInstructions": "" }
  ],
  "duration": 30,
  "suggestions": "",
  "warnings": "",
  "questions": [],
  "repeatAnalysis": ""
}

  `;

  try {
    console.log('Attempting to call OpenAI with model: gpt-4o-mini for generateCourse');
    console.log('Prompt for generateCourse:', prompt);
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log('OpenAI response for generateCourse:', JSON.stringify(result, null, 2));
    return {
      ...result,
      repeatAnalysis: result.repeatAnalysis || 'Повторить через 8 недель.',
    };
  } catch (error) {
    console.error('Error with GPT-4o in generateCourse:', error.message, error.stack);
    throw new Error(`Failed to generate course: ${error.message}`);
  }
};

const recognizeSupplementPhoto = async (photoUrl) => {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set in .env');
    throw new Error('OpenAI API key is missing');
  }

  const prompt = `
    Ты — ИИ-нутрициолог. Тебе предоставлено изображение с баночками или упаковками БАДов. Твоя задача:
    - Распознать названия всех БАДов на упаковках (например, "Vitamin D3", "Omega-3", "Магний цитрат").
    - Игнорируй текст, не связанный с названиями БАДов (например, инструкции, состав, дозировки).
    - Если названия неразборчивы или не видны, вернуть пустой массив.
    - Вернуть ответ в формате JSON: { "names": ["Название БАДа 1", "Название БАДа 2", ...] }
    Используй простой и точный подход. Если на фото несколько БАДов, верни все распознанные названия. Если ничего не распознано, верни { "names": [] }.
  `;

  try {
    console.log('Calling GPT-4 Vision for photo recognition with URL:', photoUrl);
    console.log('Prompt for recognizeSupplementPhoto:', prompt);
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
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log('Raw GPT-4 Vision response for recognizeSupplementPhoto:', JSON.stringify(result, null, 2));
    const names = result.names || [];
    console.log('Parsed supplement names:', names);
    if (names.length === 0) {
      console.warn('No supplements recognized from photo at URL:', photoUrl);
    }
    return names;
  } catch (error) {
    console.error('Error with GPT-4 Vision in recognizeSupplementPhoto:', error.message, error.stack);
    console.error('Failed photo URL:', photoUrl);
    return [];
  }
};

const analyzeAnalysisFile = async (fileUrl) => {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set in .env');
    throw new Error('OpenAI API key is missing');
  }



  const prompt = `
    Ты — ИИ-нутрициолог. Тебе предоставлены результаты анализов. Твоя задача:
    - Извлечь данные биомаркеров (например, Витамин D, Ферритин, Магний и т.д.).
    - Указать значения, нормальные диапазоны и статус (нормально/дефицит/избыток).
    - Дать краткую общую характеристику состояния здоровья на основе анализов.
    - Вернуть ответ в формате JSON:
    {
      "biomarkers": [
        { "name": "", "value": "", "normalRange": "", "status": "" }
      ],
      "summary": ""
    }
    Используй стандартные медицинские референсы для нормальных диапазонов. Если данные неразборчивы, укажи это в summary.
  `;

  try {
    console.log('Fetching file for analysis:', fileUrl);
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    const mimeType = response.headers.get('content-type');

    let result;

    if (mimeType === 'application/pdf') {
      console.log('Processing PDF file');
      const pdfData = await pdfParse(Buffer.from(buffer));
      const text = pdfData.text;
      console.log('Extracted text from PDF:', text);

      // Анализ текста с помощью текстовой модели
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\nТекст анализов:\n${text}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      result = JSON.parse(response.choices[0].message.content);
    } else if (['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(mimeType)) {
      console.log('Processing image file');
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: fileUrl } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      });

      result = JSON.parse(response.choices[0].message.content);
    } else {
      throw new Error(`Неподдерживаемый тип файла: ${mimeType}. Допустимые типы: PDF, PNG, JPEG, GIF, WEBP.`);
    }

    console.log('Analysis result:', result);
    return result;
  } catch (error) {
    console.error('Error with file analysis:', error.message, error.stack);
    throw new Error(`Не удалось проанализировать файл: ${error.message}`);
  }
};

const generateAnalysisCourse = async (goal, fileUrl, checklist = [], dietPreference = 'none') => {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set in .env');
    throw new Error('OpenAI API key is missing');
  }

  const dietInstruction = dietPreference !== 'none'
    ? `Пользователь следует ${dietPreference === 'vegan' ? 'веганской' : 'вегетарианской'} диете. Исключи добавки животного происхождения (например, рыбий жир) и предлагай только растительные альтернативы (например, омега-3 из водорослей).`
    : '';

  const supplementPrompt = checklist.length > 0
    ? `У пользователя есть добавки: ${checklist.join(', ')}. Обязательно включи ВСЕ эти добавки в курс, подобрав подходящие дозировки и время приёма.`
    : '';

  const prompt = `
   Ты — ИИ-нутрициолог. Пользователь предоставил цель: "${goal}".
${supplementPrompt}
${dietInstruction}

Базовые витамины: Омега-3, Витамин D, Магний, Цинк, Пробиотики, Витамин С.  
Базовые цели: Повысить концентрацию, Энергия/бодрость, Улучшить сон, Поддержка иммунитета, Снижение веса, Набор массы, Улучшить память, Повысить тестостерон.  
Обязательно включи добавку "Ежовик гребенчатый" (Hericium erinaceus), дозировка: 1600 мг, время приёма: утро, инструкция: до еды.

Если цель входит в базовые цели — используй соответствующий фиксированный курс, адаптируя его под диету, пользовательские добавки и анализы:

- Повысить концентрацию: Ежовик гребенчатый (1600 мг, утро, до еды), Омега-3 (1000 мг, вечер, с едой), Магний (400 мг, вечер, после еды), Витамин С (500 мг, утро, с едой).
- Энергия/бодрость: Ежовик гребенчатый (1600 мг, утро, до еды), Витамин С (1000 мг, утро, с едой), Магний (400 мг, день, после еды), Цинк (15 мг, вечер, с едой).
- Улучшить сон: Ежовик гребенчатый (1600 мг, утро, до еды), Магний (400 мг, вечер, после еды), Пробиотики (10 млрд КОЕ, вечер, до еды).
- Поддержка иммунитета: Ежовик гребенчатый (1600 мг, утро, до еды), Витамин D (2000 МЕ, утро, с едой), Витамин С (1000 мг, день, с едой), Цинк (15 мг, вечер, с едой).
- Снижение веса: Ежовик гребенчатый (1600 мг, утро, до еды), Омега-3 (1000 мг, утро, с едой), Пробиотики (10 млрд КОЕ, вечер, до еды).
- Набор массы: Ежовик гребенчатый (1600 мг, утро, до еды), Цинк (15 мг, вечер, с едой), Магний (400 мг, вечер, после еды), Витамин D (2000 МЕ, утро, с едой).
- Улучшить память: Ежовик гребенчатый (1600 мг, утро, до еды), Омега-3 (1000 мг, вечер, с едой), Магний (400 мг, вечер, после еды).
- Повысить тестостерон: Ежовик гребенчатый (1600 мг, утро, до еды), Цинк (15 мг, вечер, с едой), Витамин D (2000 МЕ, утро, с едой), Магний (400 мг, вечер, после еды).

Твоя задача:

- Распознать и интерпретировать анализы: выяви дефициты по биомаркерам (например, ферритин, витамин D, магний).
- Если цель базовая: начни с фиксированного курса, но при необходимости скорректируй дозировки или замени/добавь добавки с учётом анализов и пользовательских добавок.
- Обязательно включи **все добавки, указанные пользователем** (с дозировкой и временем приёма).
- В любом случае — **добавь 2–3 дополнительных добавки**:
    - Если пользователь указал свои добавки — подбери 2–3 **новых**, которые усиливают эффект курса или компенсируют возможные дефициты (не дублируй введённые).
    - Если пользователь не указал добавки — выбери любые 2–3 базовые или подходящие к цели.
- Если цель нестандартная (не из базовых) — подбери курс из 3–5 добавок, включая ежовик, пользовательские и дополнительно подобранные добавки по цели и анализам.

Верни ответ в формате JSON следующего вида:


{
  "supplements": [
    { "name": "Название БАДа", "dose": "Дозировка", "time": "утро|день|вечер", "intakeInstructions": "до еды|во время еды|после еды" }
  ],
  "duration": 60,
  "suggestions": "Краткие советы по усилению эффекта курса.",
  "warnings": "Краткие предостережения (например, 'Проконсультируйся с врачом перед приёмом витамина D').",
  "questions": [
    "Уточняющие вопросы (например, 'Есть ли аллергия на витамин С?')"
  ],
  "repeatAnalysis": "Рекомендация по повтору анализов, например, 'Повторить анализ ферритина через 8 недель'."
}

  `;

  try {
    console.log('Fetching file for analysis course:', fileUrl);
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    const mimeType = response.headers.get('content-type');

    let result;

    if (mimeType === 'application/pdf') {
      console.log('Processing PDF file for course generation');
      const pdfData = await pdfParse(Buffer.from(buffer));
      const text = pdfData.text;
      console.log('Extracted text from PDF:', text);

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\nТекст анализов:\n${text}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      result = JSON.parse(response.choices[0].message.content);
    } else if (['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(mimeType)) {
      console.log('Processing image file for course generation');
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: fileUrl } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      });

      result = JSON.parse(response.choices[0].message.content);
    } else {
      throw new Error(`Неподдерживаемый тип файла: ${mimeType}. Допустимые типы: PDF, PNG, JPEG, GIF, WEBP.`);
    }

    console.log('Analysis course result:', result);
    return {
      ...result,
      isPremium: true,
    };
  } catch (error) {
    console.error('Error with analysis course generation:', error.message, error.stack);
    throw new Error(`Не удалось создать курс анализа: ${error.message}`);
  }
};

const analyzeFoodPhoto = async (photoUrl) => {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set in .env');
    throw new Error('OpenAI API key is missing');
  }

  const prompt = `
  Ты — ИИ-нутрициолог. Пользователь отправил изображение еды (URL: ${photoUrl}).

Твоя задача:
- Распознай блюда или ингредиенты на фото.
- Примерно оцени **общий вес еды в граммах** на тарелке (на глаз, но реалистично: не завышай и не занижай). Учитывай визуальный размер, тип еды (например, мясо, гарнир, соус), порции.
- Используя стандартные данные на 100 г каждого ингредиента, рассчитай:
  - Общую калорийность блюда.
  - Содержание макронутриентов (белки, жиры, углеводы) на весь объём порции.
- Используй средние значения:
  - куриная грудка (варёная) — 165 ккал / 100 г, Б: 31 г, Ж: 3.6 г, У: 0 г;
  - картофельное пюре — 80 ккал / 100 г, Б: 2 г, Ж: 3 г, У: 12 г;
  - овощи тушёные — 30 ккал / 100 г, Б: 1 г, Ж: 0 г, У: 6 г;
  - макароны отварные — 110 ккал / 100 г, Б: 3.5 г, Ж: 1 г, У: 22 г;
  - жареное — увеличивает жир и калории, учитывай это при анализе.
- Если блюдо не распознано — так и напиши в dish, и в suggestions укажи ввести вручную.
- Дай 1–2 конкретных рекомендации по улучшению питания.
- Возвращай строго в формате JSON. Не добавляй дополнительных полей и не задавай вопросов.

📦 Формат ответа:
{
  "dish": "Название блюда или описание",
  "calories": 0,
  "nutrients": { "protein": 0, "fats": 0, "carbs": 0 },
  "suggestions": "",
  "questions": [],
  "warnings": ""
}

`;

  try {
    console.log('Calling GPT-4 Vision for food photo analysis:', photoUrl);
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
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log('GPT-4 Vision food analysis result:', result);
    return result;
  } catch (error) {
    console.error('Error with GPT-4 Vision for food analysis:', error.message, error.stack);
    throw new Error(`Failed to analyze food photo: ${error.message}`);
  }
};

module.exports = {
  generateCourse,
  recognizeSupplementPhoto,
  analyzeAnalysisFile,
  generateAnalysisCourse,
  analyzeFoodPhoto,
  analyzeManualFoodInput
};