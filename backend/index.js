const fs = require('fs');
const path = require('path');
const { Configuration, OpenAIApi } = require('openai');

const NAICS_DB_PATH = path.join(__dirname, '..', 'data', 'naics.json');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

function loadNaicsDb() {
  const data = fs.readFileSync(NAICS_DB_PATH, 'utf-8');
  return JSON.parse(data);
}

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const description = body.description || '';

  const naicsDb = loadNaicsDb();
  
  // 1. Ask ChatGPT for a 6-digit NAICS code and short description
  const chatResponse = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You map descriptions to NAICS codes.' },
      { role: 'user', content: description }
    ],
    max_tokens: 50,
  });
  const chatText = chatResponse.data.choices[0].message.content;
  const match = chatText.match(/(\d{6})/);
  const code = match ? match[1] : null;

  if (code && naicsDb.some(item => item.code === code)) {
    const found = naicsDb.find(item => item.code === code);
    return {
      statusCode: 200,
      body: JSON.stringify(found)
    };
  }

  // 2. If not found, generate embedding and query vector DB (placeholder)
  const embeddingResponse = await openai.createEmbedding({
    model: 'text-embedding-ada-002',
    input: chatText,
  });
  const embedding = embeddingResponse.data.data[0].embedding;

  const vectorResults = await queryVectorDb(embedding);

  return {
    statusCode: 200,
    body: JSON.stringify({ code: code || 'unknown', results: vectorResults })
  };
};

async function queryVectorDb(embedding) {
  // TODO: connect to your vector DB service and return top 3 matches
  // Example placeholder implementation
  return [
    { code: '111110', description: 'Soybean Farming' },
    { code: '111120', description: 'Oilseed (except Soybean) Farming' },
    { code: '111130', description: 'Dry Pea and Bean Farming' },
  ];
}
