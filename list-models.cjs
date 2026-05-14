const dotenv = require('dotenv');
dotenv.config();

async function test() {
  const geminiKey = process.env.VITE_GEMINI_API_KEY;
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`
  );
  const data = await r.json();
  const models = data.models.map(m => m.name);
  console.log(models);
}
test();
