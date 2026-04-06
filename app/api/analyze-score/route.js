import { NextResponse } from 'next/server';
import { AI_CONFIG } from '@/lib/constants'; // కాన్ఫిగ్ ఇంపోర్ట్

export async function POST(req) {
  try {
    const { message, history, image } = await req.json();
    
    // Choose model based on input type
    const selectedModel = image ? AI_CONFIG.VISION_MODEL : AI_CONFIG.TEXT_MODEL;

    const systemPrompt = `You are "ChillBoyz AI". 
    1. Chat naturally. 
    2. Wrap session data in START_DATA{...}END_DATA. 
    3. Buy-in unit is $${AI_CONFIG.BUY_IN_AMOUNT}.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { 
        role: "user", 
        content: image 
          ? [{ type: "text", text: message || "Analyze sheet" }, { type: "image_url", image_url: { url: image } }] 
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
        temperature: 0.5
      })
    });

    const result = await response.json();
    
    if (result.error) {
       // ఒకవేళ మోడల్ ఎర్రర్ వస్తే మనకి క్లియర్ గా తెలుస్తుంది
       console.error("Groq Model Error:", result.error.message);
       return NextResponse.json({ error: `Model Issue: ${result.error.message}` }, { status: 500 });
    }

    return NextResponse.json({ reply: result.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
