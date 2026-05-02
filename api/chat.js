export default async function handler(req, res) {
    // التأكد من أن الطلب القادم هو من نوع POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { userMessage } = req.body;

    try {
        // إرسال الطلب لشركة Groq من السيرفر بشكل آمن
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: "You are the specialized PGFN Network Assistant. You ONLY talk about Computer Networking, Cisco IOS, and CCNA. Strictly refuse to answer any questions about cars, food, sports, general knowledge, or anything outside the networking field. Respond exactly with: 'I am sorry, but I am specialized only in networking topics (Cisco/CCNA). Please ask me something related to that field.' if off-topic."
                    },
                    { role: "user", content: userMessage }
                ],
                temperature: 0.1
            })
        });

        const data = await response.json();
        
        // إعادة الرد إلى واجهة الموقع (الفروونت اند)
        if (data.choices && data.choices[0]) {
            res.status(200).json({ reply: data.choices[0].message.content });
        } else {
            res.status(500).json({ error: "Invalid response from AI" });
        }
    } catch (error) {
        res.status(500).json({ error: "Server connection failed" });
    }
}