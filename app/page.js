const sendMessage = async (imgData = null) => {
  if (!input.trim() && !imgData) return;
  
  const userMsg = { role: 'user', content: input || "Sent an image" };
  setMessages(prev => [...prev, userMsg]);
  setInput('');
  setIsLoading(true);

  try {
    const res = await fetch('/api/analyze-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: input, 
        history: messages.slice(-5), 
        image: imgData 
      }),
    });
    
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    const aiReply = data.reply;

    // --- DATA EXTRACTION LOGIC ---
    const dataMatch = aiReply.match(/START_DATA({.*?})END_DATA/s);
    if (dataMatch) {
      try {
        const sessionInfo = JSON.parse(dataMatch[1]);
        setActivePlayers(sessionInfo.players.map((p, i) => ({
          id: `ai-${Date.now()}-${i}`,
          ...p,
          cashout: p.cashout || 0
        })));
        setIsLive(true);
        // గ్రీన్ సిగ్నల్ ఇవ్వడానికి చిన్న అలర్ట్ లాంటిది
      } catch (e) {
        console.error("JSON Parse Error", e);
      }
    }

    // టెక్స్ట్ మాత్రమే చూపించు (START_DATA పార్ట్ తీసేసి)
    const cleanText = aiReply.replace(/START_DATA.*?END_DATA/s, '').trim();
    setMessages(prev => [...prev, { role: 'assistant', content: cleanText || "Session updated! Check the Live tab." }]);

  } catch (err) {
    setMessages(prev => [...prev, { role: 'assistant', content: `ఎర్రర్ వచ్చింది మామ: ${err.message}` }]);
  } finally {
    setIsLoading(false);
  }
};
