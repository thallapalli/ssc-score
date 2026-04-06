import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { message, history, image } = await req.json();
    
    const systemPrompt = `You are "ChillBoyz AI", KT's poker assistant. 
    1. Chat naturally with the user.
    2. If providing session data (players/scores), always wrap it EXACTLY like this: 
       START_DATA{"players": [{"name": "Name", "buyins": 1, "cashout": 0}]}END_DATA
    3. Buy-in is $20. Identify players/scores from text or images.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { 
        role: "user", 
        content: image 
          ? [{ type: "text", text: message || "Analyze this" }, { type: "image_url", image_url: { url: image } }] 
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
        model: image ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile",
        messages: messages,
        temperature: 0.5
      })
    });

    const result = await response.json();
    if (!result.choices) throw new Error(result.error?.message || "Groq Error");

    return NextResponse.json({ reply: result.choices[0].message.content });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
