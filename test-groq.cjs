const dotenv = require('dotenv');
dotenv.config();

async function test() {
  const groqKey = process.env.VITE_GROQ_API_KEY;
  const prompt = `OUTPUT FORMAT (follow EXACTLY, one per recruiter turn):
CONFIDENCE: ALEX=<0-100>, MAYA=<0-100>, JIN=<0-100>
RECRUITER: message text
COVERAGE: comma-separated from [Technical, Communication, Depth, Wildcard]

Give me one exchange for a software engineer.`;

  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 1,
      max_tokens: 500,
    })
  });
  console.log(r.status);
  const data = await r.json();
  console.log(data);
}
test();
