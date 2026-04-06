import { NextResponse } from 'next/server';
import { AI_CONFIG } from '../../../lib/constants'; 

export async function POST(req) {
  try {
    const { message, history, image } = await req.json();
    
    // Llama 4 Scout handles both, but we specify for clarity
    const selectedModel = image ? AI_CONFIG.VISION_MODEL : AI_CONFIG.TEXT_MODEL;

    const systemPrompt = `You are "SSC Score AI", a specialized Poker Assistant.
    1. Buy-in unit is $${AI_CONFIG.BUY_IN_AMOUNT}.
    2. Identify players and buy-ins. If a line is drawn, the following number is the cashout.
    3. IMPORTANT: Wrap data in START_DATA{"players": [...]}END_DATA at the end.
    Tone: Professional yet friendly, addressing the user as "మామ" (Mama).`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { 
        role: "user", 
        content: image 
          ? [{ type: "text", text: message || "Analyze this score sheet." }, { type: "image_url", image_url: { url: image } }] 
          : message 
      }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: messages,
        temperature: 0.1
      })
    });

    const result = await response.json();
    if (result.error) throw new Error(result.error.message);

    return NextResponse.json({ reply: result.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
