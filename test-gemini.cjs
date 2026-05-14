const dotenv = require('dotenv');
dotenv.config();

async function test() {
  const geminiKey = process.env.VITE_GEMINI_API_KEY;
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: "Hello" }] }],
      })
    }
  );
  console.log(r.status);
  const data = await r.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
