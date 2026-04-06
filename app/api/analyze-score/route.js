import { NextResponse } from 'next/server';
import { AI_CONFIG } from '../../../lib/constants'; 

export async function POST(req) {
  try {
    const { message, history, image } = await req.json();
    
    // Choose model based on whether an image is provided
    const selectedModel = image ? AI_CONFIG.VISION_MODEL : AI_CONFIG.TEXT_MODEL;

    // Strong instructions for poker sheet analysis
    const systemPrompt = `You are "ChillBoyz AI", a specialized Poker Assistant for KT's group.
    
    CORE LOGIC:
    1. Buy-in unit is $${AI_CONFIG.BUY_IN_AMOUNT}.
    2. IMAGE ANALYSIS: Look for player names. Count the number of "20"s or checkmarks next to them.
    3. THE LINE RULE: If you see a horizontal line drawn after the buy-ins, the number immediately following that line is the player's FINAL CASHOUT.
    4. NET CALCULATION: Net = Cashout - (Buyins * ${AI_CONFIG.BUY_IN_AMOUNT}).
    
    RESPONSE FORMAT:
    - Reply naturally in text.
    - If you identify session data or are asked to start a session, you MUST append the data at the end of your reply in this EXACT format:
      START_DATA{"players": [{"name": "PlayerName", "buyins": 2, "cashout": 150}]}END_DATA
    
    Keep the tone friendly and use "మామ" (Mama) occasionally as you are a close assistant to KT.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { 
        role: "user", 
        content: image 
          ? [
              { type: "text", text: message || "Please analyze this poker score sheet." },
              { type: "image_url", image_url: { url: image } }
            ] 
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
        temperature: 0.2, // Lower temperature for more accurate data extraction
        max_tokens: 1024
      })
    });

    const result = await response.json();

    if (result.error) {
      console.error("Groq API Error:", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    if (!result.choices || result.choices.length === 0) {
      return NextResponse.json({ error: "No response from AI model" }, { status: 500 });
    }

    return NextResponse.json({ reply: result.choices[0].message.content });

  } catch (error) {
    console.error("Server Crash:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
