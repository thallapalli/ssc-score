import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { image } = await req.json();
    
    // GROQ API CALL
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.2-11b-vision-preview", // or current vision model
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Identify players, their total buy-ins (count how many 20s or units), and their final cashout/net from this handwritten poker score sheet. Return only a JSON array: [{ name: string, buyins: number, cashout: number }]" },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    return NextResponse.json(JSON.parse(data.choices[0].message.content));
  } catch (error) {
    return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 });
  }
}
