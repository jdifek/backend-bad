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

    Если цель входит в базовые цели, используй следующий фиксированный курс (учитывая диету и добавки пользователя):
    - Повысить концентрацию: Ежовик гребенчатый (1600 мг, утро, до еды), Омега-3 (1000 мг, вечер, с едой), Магний (400 мг, вечер, после еды), Витамин С (500 мг, утро, с едой).
    - Энергия/бодрость: Ежовик гребенчатый (1600 мг, утро, до еды), Витамин С (1000 мг, утро, с едой), Магний (400 мг, день, после еды), Цинк (15 мг, вечер, с едой).
    - Улучшить сон: Ежовик гребенчатый (1600 мг, утро, до еды), Магний (400 мг, вечер, после еды), Пробиотики (10 млрд КОЕ, вечер, до еды).
    - Поддержка иммунитета: Ежовик гребенчатый (1600 мг, утро, до еды), Витамин D (2000 МЕ, утро, с едой), Витамин С (1000 мг, день, с едой), Цинк (15 мг, вечер, с едой).
    - Снижение веса: Ежовик гребенчатый (1600 мг, утро, до еды), Омега-3 (1000 мг, утро, с едой), Пробиотики (10 млрд КОЕ, вечер, до еды).
    - Набор массы: Ежовик гребенчатый (1600 мг, утро, до еды), Цинк (15 мг, вечер, с едой), Магний (400 мг, вечер, после еды), Витамин D (2000 МЕ, утро, с едой).
    - Улучшить память: Ежовик гребенчатый (1600 мг, утро, до еды), Омега-3 (1000 мг, вечер, с едой), Магний (400 мг, вечер, после еды).
    - Повысить тестостерон: Ежовик гребенчатый (1600 мг, утро, до еды), Цинк (15 мг, вечер, с едой), Витамин D (2000 МЕ, утро, с едой), Магний (400 мг, вечер, после еды).

    Если пользователь указал свои добавки, включи их в курс с подходящими дозировками и временем приёма. Если цель не из базовых, подбери 2-4 добавки (включая базовые витамины, если подходят) для цели, добавь ежовик и пользовательские добавки.

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

    Используй простой, дружелюбный язык. Верни ответ в формате JSON:
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

    Обязательно включи добавку "Ежовик гребенчатый" (Hericium erinaceus) с дозировкой 1600 мг, время приёма: утро, инструкция: до еды.

    Если цель входит в базовые цели, используй следующий фиксированный курс (учитывая диету, добавки пользователя и дефициты из анализов):
    - Повысить концентрацию: Ежовик гребенчатый (1600 мг, утро, до еды), Омега-3 (1000 мг, вечер, с едой), Магний (400 мг, вечер, после еды), Витамин С (500 мг, утро, с едой).
    - Энергия/бодрость: Ежовик гребенчатый (1600 мг, утро, до еды), Витамин С (1000 мг, утро, с едой), Магний (400 мг, день, после エды), Цинк (15 мг, вечер, с едой).
    - Улучшить сон: Ежовик гребенчатый (1600 мг, утро, до еды), Магний (400 мг, вечер, после еды), Пробиотики (10 млрд КОЕ, вечер, до еды).
    - Поддержка иммунитета: Ежовик гребенчатый (1600 мг, утро, до еды), Витамин D (2000 МЕ, утро, с едой), Витамин С (1000 мг, день, с едой), Цинк (15 мг, вечер, с едой).
    - Снижение веса: Ежовик гребенчатый (1600 мг, утро, до еды), Омега-3 (1000 мг, утро, с едой), Пробиотики (10 млрд КОЕ, вечер, до еды).
    - Набор массы: Ежовик гребенчатый (1600 мг, утро, до еды), Цинк (15 мг, вечер, с едой), Магний (400 мг, вечер, после еды), Витамин D (2000 МЕ, утро, с едой).
    - Улучшить память: Ежовик гребенчатый (1600 мг, утро, до еды), Омега-3 (1000 мг, вечер, с едой), Магний (400 мг, вечер, после еды).
    - Повысить тестостерон: Ежовик гребенчатый (1600 мг, утро, до еды), Цинк (15 мг, вечер, с едой), Витамин D (2000 МЕ, утро, с едой), Магний (400 мг, вечер, после еды).

    Твоя задача:
    - Распознать данные анализов (значения биомаркеров, например, Витамин D, Ферритин, Магний и т.д.).
    - Сопоставить значения с нормами (используй стандартные медицинские референсы).
    - Выявить дефициты или отклонения.
    - Если цель базовая, начни с указанного фиксированного курса, но скорректируй дозировки или добавь/убери добавки на основе дефицитов из анализов.
    - Если пользователь указал свои добавки, включи их в курс с подходящими дозировками и временем приёма.
    - Если цель не из базовых, подбери 2-4 добавки (включая базовые витамины, если подходят) для цели, добавь ежовик и пользовательские добавки.
    - Укажи:
      - Название БАДа
      - Дозировку (стандартную или уточнить)
      - Время приёма (строго: "утро", "день", "вечер")
      - Инструкции по приёму (строго: "до еды", "во время еды", "после еды")
      - Длительность курса (по умолчанию 60 дней)
      - Советы по усилению курса
      - Предостережения (например, "Проконсультируйся с врачом")
      - Уточняющие вопросы (например, "Есть ли у тебя аллергия на витамин С?")
      - Рекомендации по повторным анализам (например, "Повторить через 8 недель")

    Используй простой, дружелюбный язык. Верни ответ в формате JSON:
    {
      "supplements": [
        { "name": "", "dose": "", "time": "", "intakeInstructions": "" }
      ],
      "duration": 60,
      "suggestions": "",
      "warnings": "",
      "questions": [],
      "repeatAnalysis": ""
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
  Ты — ИИ-нутрициолог. Тебе предоставлено изображение еды (URL: ${photoUrl}). Твоя задача:
  - Распознать блюда или ингредиенты на фото.
  - Оценить калорийность и содержание макронутриентов (белки, жиры, углеводы). Если точные данные недоступны, используй стандартные значения для 100 г каждого ингредиента (например, курица ~165 ккал, картофельное пюре ~80 ккал, овощи ~30 ккал) и укажи, что это приблизительные данные.
  - Дать рекомендации по улучшению питания (например, "Добавь белок", "Слишком много сахара", "Мало клетчатки").
  - Указать уточняющие вопросы (например, "Какова была порция?", "Добавлялись ли соусы?").
  - Если блюдо не распознано, укажи это и предложи пользователю ввести данные вручную.
  - Перепроверить всю информацию и выдать максимально точные данные.
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