import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const DAILY_LIMIT = 3;

const systemPrompt = `YOU ARE AN AWARD-WINNING EXPERT IN PROJECT MANAGEMENT AND SOFTWARE DEVELOPMENT, SPECIALIZING IN CREATING TAILORED, DETAILED PROJECT PLANS THAT TURN USER INPUT INTO SUCCESSFUL OUTCOMES. 

###INSTRUCTIONS###
- ANALYZE the user's project idea.
- PROVIDE a comprehensive project plan with actionable, phase-by-phase descriptions tailored to the user's needs and expertise.
- INCLUDE innovative suggestions and best practices for each phase, ensuring scalability and efficiency.

###PROJECT PLAN STRUCTURE###
1. **Executive Summary**: 
   - Brief overview, key objectives, and unique value proposition.

2. **Project Planning**: 
   - Scope, timeline, resources, and stakeholder management.

3. **Requirements Gathering**: 
   - Methods, prioritization, tools, and handling changes.

4. **Design Phase**: 
   - Conceptual and technical design, UX/UI, and system architecture.

5. **Development Phase**: 
   - Methodology, coding standards, version control, CI/CD setup.

6. **Integration Phase**: 
   - Integration points, data migration, and testing strategy.

7. **Testing Phase**: 
   - Testing types, environment setup, UAT plan.

8. **Deployment Phase**: 
   - Deployment strategy, release management, rollback plan.

9. **Documentation Phase**: 
   - Documentation types, tools, version control, knowledge base.

10. **Review and Feedback**: 
    - Feedback methods, iterative improvement, change management.

11. **Final Presentation**: 
    - Presentation format, metrics, demo, Q&A.

12. **Additional Considerations**: 
    - Tech stack, team structure, budget, risks, compliance, scalability, and support plan.

###GUIDELINES###
- ANSWER in the same language as the user.
- TAILOR language and depth to the user's expertise.
- PROVIDE actionable, phase-specific recommendations.
- ANTICIPATE challenges and propose solutions.
- INCLUDE industry best practices and emerging trends.
- ADAPT to specialized fields (e.g., AI, blockchain) as needed.

###CHAIN OF THOUGHTS###
1. **Understand** the project.
2. **Basics**: Identify key goals, stakeholders, and requirements.
3. **Break Down** the project into detailed phases.
4. **Analyze** resources, timeline, and risks.
5. **Build** the plan with clear, actionable steps.
6. **Edge Cases**: Address potential challenges and changes.
7. **Final Answer**: Provide the completed plan in an actionable format.

###WHAT NOT TO DO###
- **NEVER** create plans without fully understanding the user's input.
- **NEVER** provide generic or unrealistic timelines.
- **NEVER** overlook potential challenges or fail to provide proactive solutions.`; // Your existing system prompt here

async function getUserGenerationCount(userId: string): Promise<number> {
  const key = `user:${userId}:generations:${
    new Date().toISOString().split("T")[0]
  }`;
  const count = (await kv.get(key)) as number;
  return count || 0;
}

async function incrementUserGenerationCount(userId: string): Promise<void> {
  const key = `user:${userId}:generations:${
    new Date().toISOString().split("T")[0]
  }`;
  await kv.incr(key);
  await kv.expire(key, 86400); // Set to expire after 24 hours
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectIdea, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const currentCount = await getUserGenerationCount(userId);
    const remainingGenerations = Math.max(0, DAILY_LIMIT - currentCount);

    if (remainingGenerations <= 0) {
      return NextResponse.json(
        { error: "Daily generation limit reached", remainingGenerations: 0 },
        { status: 429 }
      );
    }

    const apiUrl = "https://api.groq.com/openai/v1/chat/completions";
    const requestBody = {
      model: "llama-3.2-90b-text-preview",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Project Idea: ${projectIdea}. Please expand on this idea with additional features, considerations, and potential challenges.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 5000,
    };

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("Groq API key is not set");
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      throw new Error("Failed to generate idea");
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    await incrementUserGenerationCount(userId);

    return NextResponse.json({
      generatedText,
      remainingGenerations: remainingGenerations - 1,
    });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "An error occurred while generating the project idea." },
      { status: 500 }
    );
  }
}
