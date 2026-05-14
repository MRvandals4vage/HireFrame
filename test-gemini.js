const { VITE_GEMINI_API_KEY } = process.env;

async function run() {
  const resumeText = "John Doe\nFrontend Engineer";
  const targetRole = "Frontend Engineer";
  const SYSTEM_PROMPT = `You are simulating a hiring panel debate for the role of: ${targetRole}\nThree recruiters evaluate the candidate's profile:\n- ALEX (Skeptic): finds gaps.\n- MAYA (Champion): finds strengths.\n- JIN (Neutral): gives verdict.\nProduce exactly 6 exchanges total. Format each message EXACTLY as:\nRECRUITER: message text\nCOVERAGE: Technical|Communication|Depth|Wildcard`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${VITE_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: `Resume:\n${resumeText}\n\nTarget role: ${targetRole}` }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 4096,
        }
      }),
    });

    if (!response.ok) {
      console.error('API Error:', await response.text());
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let sseBuffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("Stream complete.");
        break;
      }
      sseBuffer += decoder.decode(value, { stream: true });
      const events = sseBuffer.split(/\r?\n\r?\n/);
      sseBuffer = events.pop();
      for (const event of events) {
        const lines = event.split(/\r?\n/);
        const dataLine = lines.find((l) => l.startsWith('data: '));
        if (dataLine) {
          try {
            const data = JSON.parse(dataLine.slice(6).trim());
            const textChunk = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textChunk) {
              process.stdout.write(textChunk);
            }
          } catch (e) {
            console.error('\nJSON parse error:', e.message);
          }
        }
      }
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

run();
