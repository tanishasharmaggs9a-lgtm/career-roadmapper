import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY in environment variables." }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    // 1. CHAT ENDPOINT HANDLER
    if (body.action === 'chat') {
      const { message, history } = body;
      
      const messages = [
        {
          role: "system",
          content: "You are the 'System' from Solo Leveling, acting as an elite, cold, yet highly motivational AI career strategist. Keep responses concise, tactical, and styled like a cyberpunk game system notification."
        },
        ...(history || []).map((h: any) => ({
          role: h.role === 'model' ? 'assistant' : 'user',
          content: h.parts ? h.parts[0].text : h.content
        })),
        { role: "user", content: message }
      ];

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        max_tokens: 500,
      });

      return NextResponse.json({ reply: completion.choices[0]?.message?.content || "System operational." }, { status: 200 });
    }

    // 2. ROADMAP GENERATION HANDLER
    const { currentSkills, dreamJob, targetCompany } = body;
    const companyName = targetCompany || "Target Guild";
    const roleTitle = dreamJob || "Elite Engineer";
    const skillBase = currentSkills || "Core Fundamentals";

    const prompt = `You are the 'System' from Solo Leveling, an elite AI generating a Hunter's growth trajectory and multi-industry career options.
Player's Current Arsenal: ${skillBase}
Target Class: ${roleTitle}
Target Guild (Company): ${companyName}

Generate a strict JSON object containing:
1. "counselling": A 2-sentence System notification analyzing the gap and giving strategic career advice.
2. "dailyQuests": An array of 3 specific, actionable daily tasks tailored to getting hired at ${companyName}.
3. "nodes": 6 skill-tree nodes representing sequential milestones (E-Rank, D-Rank, B-Rank, S-Rank) and cross-industry paths. Each node must have an "id", "title", "tier", and "actionable" object containing "quest", "githubTopic", and "bossFight" array.
4. "edges": the connections between nodes (source to target).

CRITICAL: YOU MUST RETURN ONLY RAW, VALID JSON. DO NOT WRAP IN BACKTICKS. NO CONVERSATION.
Schema:
{
  "counselling": "string",
  "dailyQuests": ["Task 1", "Task 2", "Task 3"],
  "nodes": [ { "id": "1", "title": "Skill", "tier": "E-Rank Dungeon", "actionable": { "quest": "string", "githubTopic": "string", "bossFight": ["q1", "q2"] } } ],
  "edges": [ { "source": "1", "target": "2" } ]
}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const rawText = completion.choices[0]?.message?.content;
    if (!rawText) throw new Error("No response received from Groq API.");

    const cleanedText = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
    return NextResponse.json(JSON.parse(cleanedText), { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}